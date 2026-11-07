export const GENS = ["10대","20대","30대","40대","50대","60대","70대","80·90대"];
export function today(){ return new Date(Date.now()+9*3600e3).toISOString().slice(0,10); }
export function shiftDay(day, n){ return new Date(Date.parse(day)+n*864e5).toISOString().slice(0,10); }
export function json(data, status=200, extra={}){ return new Response(JSON.stringify(data), {status, headers:{"content-type":"application/json; charset=utf-8", ...extra}}); }
export const BOT = /bot|crawl|spider|slurp|yeti|daum|facebookexternalhit|kakaotalk-scrap|headless|preview|curl|wget|python|axios|node-fetch/i;
export async function readJson(request){ try{ const t = await request.text(); if(t.length>4000) return null; return JSON.parse(t); }catch{ return null; } }
export const validDevice = d => typeof d==="string" && /^[a-z0-9]{8,32}$/i.test(d);

// 테이블이 없으면 처음 요청 때 자동으로 만듭니다 (별도 설치 작업 불필요)
let ready = false;
export async function ensureSchema(env){
  if(ready) return;
  const sql = `CREATE TABLE IF NOT EXISTS plays (device TEXT NOT NULL, day TEXT NOT NULL, gen TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL, oks TEXT NOT NULL, streak INTEGER, ref TEXT, created_at INTEGER NOT NULL, PRIMARY KEY (device, day));
CREATE INDEX IF NOT EXISTS plays_day_gen ON plays(day, gen);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, type TEXT NOT NULL, device TEXT, gen TEXT, ref TEXT, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS events_day_type ON events(day, type);
CREATE TABLE IF NOT EXISTS league_splits (gen TEXT PRIMARY KEY, since TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS backups (code TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL);`;
  await env.DB.batch(sql.split(";\n").map(s => env.DB.prepare(s.replace(/;$/,""))));
  ready = true;
}

/* ---------- 리그: 처음엔 4개로 묶고, 커진 세대는 자동 독립 ---------- */
export const GEN_TITLE = {"10대":"뉴비","20대":"성장캐","30대":"만렙 직전","40대":"만렙","50대":"베테랑","60대":"명인","70대":"고수","80·90대":"전설"};
export const LEAGUE_GROUPS = [
  {name:"뉴비", ages:"10·20대", gens:["10대","20대"]},
  {name:"만렙", ages:"30·40대", gens:["30대","40대"]},
  {name:"명인", ages:"50·60대", gens:["50대","60대"]},
  {name:"전설", ages:"70대 이상", gens:["70대","80·90대"]}
];
export const SPLIT_MIN = 30;   // 하루 참여 기준
export const SPLIT_DAYS = 7;   // 이 기준을 연속으로 채워야 하는 날 수
export function weekMonday(day){ const d=new Date(day+"T00:00:00Z"); const dow=(d.getUTCDay()+6)%7; return shiftDay(day,-dow); }
// 이번 주 월요일 기준으로 지난 7일을 한 번만 평가해 독립 세대를 정합니다 (한 번 독립하면 다시 합치지 않음)
export async function evaluateSplits(env, day){
  const mon = weekMonday(day);
  const done = await env.DB.prepare("SELECT value FROM meta WHERE key='split_week'").first();
  if(done && done.value >= mon) return;
  const from = shiftDay(mon,-SPLIT_DAYS), to = shiftDay(mon,-1);
  const rows = (await env.DB.prepare("SELECT gen, day, COUNT(*) n FROM plays WHERE day>=? AND day<=? GROUP BY gen, day").bind(from,to).all()).results||[];
  const okDays = {};
  rows.forEach(r => { if(r.n>=SPLIT_MIN) okDays[r.gen]=(okDays[r.gen]||0)+1; });
  const stmts = Object.keys(okDays).filter(g => okDays[g]>=SPLIT_DAYS).map(g => env.DB.prepare("INSERT OR IGNORE INTO league_splits (gen,since) VALUES (?,?)").bind(g,mon));
  stmts.push(env.DB.prepare("INSERT INTO meta (key,value) VALUES ('split_week',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(mon));
  await env.DB.batch(stmts);
}
// 현재 리그 목록: 독립한 세대는 따로, 나머지는 묶음 그대로 (남은 세대가 하나면 그 세대 이름)
export function currentLeagues(splitGens){
  const out = [];
  LEAGUE_GROUPS.forEach(g => {
    g.gens.filter(x => splitGens.includes(x)).forEach(x => out.push({name:GEN_TITLE[x], ages:x, gens:[x], independent:true}));
    const rest = g.gens.filter(x => !splitGens.includes(x));
    if(rest.length===g.gens.length) out.push({name:g.name, ages:g.ages, gens:rest, independent:false});
    else if(rest.length) rest.forEach(x => out.push({name:GEN_TITLE[x], ages:x, gens:[x], independent:false}));
  });
  return out;
}
