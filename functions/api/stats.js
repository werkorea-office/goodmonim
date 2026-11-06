import { today, json } from "../_lib.js";
// 오늘의 세대별 정답률 + 문제별 정답률 (작은 표본은 화면에서 숨김)
export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day")||"") ? url.searchParams.get("day") : today();
  const gen = url.searchParams.get("gen") || "";
  const gens = await env.DB.prepare("SELECT gen, COUNT(*) n, SUM(score)*1.0/SUM(total) acc FROM plays WHERE day=? GROUP BY gen").bind(day).all();
  const common = await env.DB.prepare("SELECT CAST(j.key AS INTEGER) k, COUNT(*) n, SUM(j.value) ok FROM plays, json_each(plays.oks) j WHERE plays.day=? AND CAST(j.key AS INTEGER)<5 GROUP BY j.key").bind(day).all();
  const bonus = await env.DB.prepare("SELECT COUNT(*) n, SUM(j.value) ok FROM plays, json_each(plays.oks) j WHERE plays.day=? AND plays.gen=? AND CAST(j.key AS INTEGER)=5").bind(day, gen).first();
  const q = [0,1,2,3,4].map(k => { const r = (common.results||[]).find(x=>x.k===k); return r ? {n:r.n, ok:r.ok} : null; });
  q.push(bonus && bonus.n ? {n:bonus.n, ok:bonus.ok} : null);
  const total = (gens.results||[]).reduce((a,g)=>a+g.n,0);
  return json({day, total, gens: gens.results||[], q}, 200, {"cache-control":"public, max-age=60"});
}
