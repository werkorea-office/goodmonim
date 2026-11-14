import { json, readJson, validDevice, GENS, BOT } from "../../_lib.js";
// 알림 구독 저장/갱신. 알려진 푸시 서비스 주소만 받습니다.
const HOSTS = [/\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/, /\.push\.apple\.com$/];
export async function onRequestPost({ request, env }){
  if(BOT.test(request.headers.get("user-agent")||"")) return json({ok:false}, 403);
  const b = await readJson(request); const s = b && b.sub;
  if(!s || typeof s.endpoint!=="string" || !s.keys || typeof s.keys.p256dh!=="string" || typeof s.keys.auth!=="string") return json({ok:false}, 400);
  let u; try{ u = new URL(s.endpoint); }catch{ return json({ok:false}, 400); }
  if(u.protocol!=="https:" || !HOSTS.some(h=>h.test(u.hostname)) || s.endpoint.length>800 || s.keys.p256dh.length>200 || s.keys.auth.length>64) return json({ok:false}, 400);
  const device = validDevice(b.device) ? b.device : null, sync = /^[a-z0-9]{12}$/.test(b.sync||"") ? b.sync : null, gen = GENS.includes(b.gen) ? b.gen : null;
  await env.DB.prepare("INSERT INTO push_subs (endpoint,p256dh,auth,device,sync,gen,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, device=excluded.device, sync=excluded.sync, gen=excluded.gen, fails=0")
    .bind(s.endpoint, s.keys.p256dh, s.keys.auth, device, sync, gen, Date.now()).run();
  return json({ok:true});
}
