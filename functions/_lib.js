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
CREATE INDEX IF NOT EXISTS events_day_type ON events(day, type);`;
  await env.DB.batch(sql.split(";\n").map(s => env.DB.prepare(s.replace(/;$/,""))));
  ready = true;
}
