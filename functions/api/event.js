import { today, shiftDay, json, readJson, validDevice, BOT, GENS } from "../_lib.js";
import { runBatch, slotNow } from "../_pushrun.js";
const TYPES = new Set(["visit","invite_open","share_brag","share_invite","copy","install_click","install_done","home_launch","push_on","push_off","push_click","share_card","share_money","open_card","open_money","family_click","from_family"]);
// 방문·공유·초대 기록 (봇 제외)
export async function onRequestPost({ request, env, waitUntil }){
  if(BOT.test(request.headers.get("user-agent")||"")) return new Response(null, {status:204});
  const b = await readJson(request); if(!b || !TYPES.has(b.type)) return json({ok:false}, 400);
  const t = today(); const day = (b.day===t || b.day===shiftDay(t,-1)) ? b.day : t;
  const device = validDevice(b.device) ? b.device : null;
  const gen = GENS.includes(b.gen) ? b.gen : null;
  const ref = typeof b.ref==="string" && /^[a-z0-9]{6,24}$/i.test(b.ref) ? b.ref : null;
  await env.DB.prepare("INSERT INTO events (day,type,device,gen,ref,created_at) VALUES (?,?,?,?,?,?)").bind(day, b.type, device, gen, ref, Date.now()).run();
  // 예약 실행이 늦어질 때를 대비해, 발송 시간대에 들어온 방문이 남은 알림을 이어서 보냅니다
  if(b.type==="visit" && slotNow() && env.VAPID_JWK && waitUntil) waitUntil(runBatch(env).catch(()=>{}));
  return json({ok:true});
}
