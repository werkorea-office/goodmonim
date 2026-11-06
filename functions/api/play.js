import { GENS, today, shiftDay, json, readJson, validDevice, BOT } from "../_lib.js";
// 문제를 다 풀면 결과 1건 저장 (같은 기기는 하루 1번만)
export async function onRequestPost({ request, env }){
  if(BOT.test(request.headers.get("user-agent")||"")) return json({ok:false}, 403);
  const b = await readJson(request); if(!b) return json({ok:false,error:"bad_json"}, 400);
  const t = today();
  if(!validDevice(b.device)) return json({ok:false,error:"device"}, 400);
  if(b.day!==t && b.day!==shiftDay(t,-1)) return json({ok:false,error:"day"}, 400); // 자정 직후 제출 허용
  if(!GENS.includes(b.gen)) return json({ok:false,error:"gen"}, 400);
  if(!Array.isArray(b.oks) || b.oks.length<5 || b.oks.length>6 || !b.oks.every(v=>v===0||v===1)) return json({ok:false,error:"oks"}, 400);
  const score = b.oks.reduce((a,v)=>a+v,0);
  const streak = Number.isInteger(b.streak) && b.streak>0 && b.streak<5000 ? b.streak : null;
  const ref = typeof b.ref==="string" && /^[a-z0-9]{6,24}$/i.test(b.ref) && !b.device.startsWith(b.ref) ? b.ref : null;
  await env.DB.prepare("INSERT OR IGNORE INTO plays (device,day,gen,score,total,oks,streak,ref,created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .bind(b.device, b.day, b.gen, score, b.oks.length, JSON.stringify(b.oks), streak, ref, Date.now()).run();
  return json({ok:true});
}
