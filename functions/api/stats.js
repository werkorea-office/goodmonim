import { today, json, evaluateSplits, currentLeagues, weekMonday } from "../_lib.js";
// 오늘의 리그 순위(공통 5문제 기준) + 문제별 정답률 + 이번 주 독립한 세대
export async function onRequestGet({ request, env }){
  const url = new URL(request.url);
  const t = today();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day")||"") ? url.searchParams.get("day") : t;
  const gen = url.searchParams.get("gen") || "";
  await evaluateSplits(env, t);
  const splits = (await env.DB.prepare("SELECT gen, since FROM league_splits").all()).results||[];
  const leagues = currentLeagues(splits.map(s=>s.gen));
  // 세대별: 참여 인원 + 공통 5문제 정답 수 (추억 문제는 세대마다 달라서 리그 점수에서 뺍니다)
  const per = (await env.DB.prepare("SELECT plays.gen gen, COUNT(DISTINCT plays.device) n, SUM(j.value) ok, COUNT(j.value) cnt FROM plays, json_each(plays.oks) j WHERE plays.day=? AND CAST(j.key AS INTEGER)<5 GROUP BY plays.gen").bind(day).all()).results||[];
  const L = leagues.map(l => { let n=0, ok=0, cnt=0; per.filter(p=>l.gens.includes(p.gen)).forEach(p=>{ n+=p.n; ok+=p.ok; cnt+=p.cnt; }); return {name:l.name, gens:l.gens, independent:l.independent, n, acc: cnt? ok/cnt : 0}; });
  const common = (await env.DB.prepare("SELECT CAST(j.key AS INTEGER) k, COUNT(*) n, SUM(j.value) ok FROM plays, json_each(plays.oks) j WHERE plays.day=? AND CAST(j.key AS INTEGER)<5 GROUP BY j.key").bind(day).all()).results||[];
  const bonus = await env.DB.prepare("SELECT COUNT(*) n, SUM(j.value) ok FROM plays, json_each(plays.oks) j WHERE plays.day=? AND plays.gen=? AND CAST(j.key AS INTEGER)=5").bind(day, gen).first();
  const q = [0,1,2,3,4].map(k => { const r = common.find(x=>x.k===k); return r ? {n:r.n, ok:r.ok} : null; });
  q.push(bonus && bonus.n ? {n:bonus.n, ok:bonus.ok} : null);
  const total = per.reduce((a,p)=>a+p.n,0);
  const newSplits = splits.filter(s => s.since===weekMonday(t)).map(s=>s.gen);
  return json({day, total, leagues:L, q, newSplits}, 200, {"cache-control":"public, max-age=60"});
}
