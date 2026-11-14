import { today, shiftDay } from "./_lib.js";
import { sendPush } from "./_push.js";
// 알림 발송 한 묶음 처리 — 몇 번을 불러도 한 사람에게 아침 1번·밤 1번을 넘지 않습니다.
// 아침 07:00~11:59 / 밤 21:00~23:29 (한국 시각) 에만 보냅니다. 그 밖의 시간에는 아무것도 하지 않습니다.
const BATCH = 40; // Cloudflare 무료 요금제의 요청 한도(50) 안쪽
export function slotNow(ms=Date.now()){
  const k = new Date(ms+9*3600e3), m = k.getUTCHours()*60 + k.getUTCMinutes();
  if(m >= 7*60 && m < 12*60) return "morning";
  if(m >= 21*60 && m < 23*60+30) return "evening";
  return null;
}
function streakInfo(state, t){
  if(!state || !state.last) return { played:false, streak:0 };
  if(state.last === t || (state.done && state.done[t])) return { played:true, streak:state.streak||0 };
  const gap = (Date.parse(t)-Date.parse(state.last))/864e5;
  return { played:false, streak: gap <= 3 ? (state.streak||0) : 0 };
}
function message(slot, info){
  if(slot === "morning") return { title:"굿모님 · 오늘의 문제가 열렸어요", body: info.streak>0 ? `연속 ${info.streak}일째, 오늘도 이어 가세요. 6문제, 1분이면 충분합니다.` : "6문제, 1분이면 충분합니다. 오늘의 돈 정보도 함께 열렸어요.", url:"/?src=push", tag:"gm-morning" };
  return { title:"굿모님 · 오늘 문제, 아직이에요", body: info.streak>0 ? `지금 풀면 연속 ${info.streak+1}일째! 자정이 지나면 오늘 문제는 사라집니다.` : "자정이 지나면 오늘 문제는 사라집니다. 1분이면 충분합니다.", url:"/?src=push", tag:"gm-evening" };
}
export async function runBatch(env, ms=Date.now()){
  const slot = slotNow(ms); if(!slot) return { slot:null, sent:0, remaining:0 };
  if(!env.VAPID_JWK) return { slot, error:"no_key" };
  const jwk = JSON.parse(env.VAPID_JWK), t = today(), col = slot==="morning" ? "last_morning" : "last_evening";
  const subs = (await env.DB.prepare(`SELECT * FROM push_subs WHERE ${col} IS NULL OR ${col} <> ? LIMIT ?`).bind(t, BATCH).all()).results || [];
  let sent = 0;
  for(const s of subs){
    // 먼저 '보냄'으로 표시해 두어, 동시에 여러 번 불려도 두 번 가지 않게 합니다
    const claim = await env.DB.prepare(`UPDATE push_subs SET ${col}=? WHERE endpoint=? AND (${col} IS NULL OR ${col} <> ?)`).bind(t, s.endpoint, t).run();
    if(!claim.meta || claim.meta.changes !== 1) continue;
    let state = null;
    if(s.sync){ const b = await env.DB.prepare("SELECT state FROM backups WHERE code=?").bind(s.sync).first(); if(b) try{ state = JSON.parse(b.state); }catch{} }
    const info = streakInfo(state, t);
    if(!state && s.device){ const p = await env.DB.prepare("SELECT 1 FROM plays WHERE device=? AND day=?").bind(s.device, t).first(); if(p) info.played = true; }
    if(slot === "evening" && info.played) continue; // 이미 푼 분께는 밤 알림을 보내지 않습니다
    let r = "fail"; try{ r = await sendPush(s, message(slot, info), jwk, "https://goodmonim.co.kr"); }catch{}
    if(r === "gone") await env.DB.prepare("DELETE FROM push_subs WHERE endpoint=?").bind(s.endpoint).run();
    else if(r === "ok"){ sent++; if(s.fails) await env.DB.prepare("UPDATE push_subs SET fails=0 WHERE endpoint=?").bind(s.endpoint).run(); }
    else await env.DB.prepare("UPDATE push_subs SET fails=fails+1 WHERE endpoint=?").bind(s.endpoint).run().then(()=>env.DB.prepare("DELETE FROM push_subs WHERE endpoint=? AND fails>=5").bind(s.endpoint).run());
  }
  const rem = await env.DB.prepare(`SELECT COUNT(*) n FROM push_subs WHERE ${col} IS NULL OR ${col} <> ?`).bind(t).first();
  return { slot, sent, remaining: rem ? rem.n : 0 };
}
