import { json, readJson } from "../../_lib.js";
export async function onRequestPost({ request, env }){
  const b = await readJson(request); if(!b || typeof b.endpoint!=="string") return json({ok:false}, 400);
  await env.DB.prepare("DELETE FROM push_subs WHERE endpoint=?").bind(b.endpoint).run();
  return json({ok:true});
}
