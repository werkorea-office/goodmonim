import { ensureSchema, json } from "./_lib.js";
// 모든 /api 요청 전에 데이터베이스 준비를 확인하고, 오류는 한국어로 돌려줍니다
export async function onRequest(ctx){
  if(!new URL(ctx.request.url).pathname.startsWith("/api/")) return ctx.next();
  if(!ctx.env.DB) return json({ok:false,error:"db_not_bound"}, 503);
  try{ await ensureSchema(ctx.env); return await ctx.next(); }
  catch(e){ return json({ok:false,error:"server"}, 500); }
}
