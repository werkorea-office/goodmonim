import { today, shiftDay, json, readJson, validDevice, BOT, GENS } from "../_lib.js";
const TYPES = new Set(["visit","invite_open","share_brag","share_invite","copy","install_click","install_done","home_launch"]);
// 방문·공유·초대 기록 (봇 제외)
export async function onRequestPost({ request, env }){
  if(BOT.test(request.headers.get("user-agent")||"")) return new Response(null, {status:204});
  const b = await readJson(request); if(!b || !TYPES.has(b.type)) return json({ok:false}, 400);
  const t = today(); const day = (b.day===t || b.day===shiftDay(t,-1)) ? b.day : t;
  const device = validDevice(b.device) ? b.device : null;
  const gen = GENS.includes(b.gen) ? b.gen : null;
  const ref = typeof b.ref==="string" && /^[a-z0-9]{6,24}$/i.test(b.ref) ? b.ref : null;
  await env.DB.prepare("INSERT INTO events (day,type,device,gen,ref,created_at) VALUES (?,?,?,?,?,?)").bind(day, b.type, device, gen, ref, Date.now()).run();
  return json({ok:true});
}
