import { json, readJson, BOT } from "../_lib.js";
// 기록 보관함: 사파리와 바탕화면 아이콘(아이폰은 저장소가 따로)이 같은 기록을 쓰도록
const CODE = /^[a-z0-9]{12}$/;
export async function onRequestGet({ request, env }){
  const code = new URL(request.url).searchParams.get("code")||"";
  if(!CODE.test(code)) return json({ok:false}, 400);
  const r = await env.DB.prepare("SELECT state, updated_at FROM backups WHERE code=?").bind(code).first();
  return json({ok:true, state: r ? JSON.parse(r.state) : null, updated: r ? r.updated_at : 0});
}
export async function onRequestPost({ request, env }){
  if(BOT.test(request.headers.get("user-agent")||"")) return json({ok:false}, 403);
  const b = await readJson(request); if(!b || !CODE.test(b.code||"") || typeof b.state!=="object" || !b.state) return json({ok:false}, 400);
  const st = JSON.stringify(b.state); if(st.length > 60000) return json({ok:false,error:"size"}, 413);
  await env.DB.prepare("INSERT INTO backups (code,state,updated_at) VALUES (?,?,?) ON CONFLICT(code) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at")
    .bind(b.code, st, Date.now()).run();
  return json({ok:true});
}
