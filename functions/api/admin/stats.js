import { today, shiftDay, json } from "../../_lib.js";
// 관리자 숫자 화면용 (비밀 키 필요)
export async function onRequestGet({ request, env }){
  const key = request.headers.get("x-admin-key") || "";
  if(!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ok:false,error:"unauthorized"}, 401);
  const t = today(), from = shiftDay(t, -27);
  const q = (sql, ...a) => env.DB.prepare(sql).bind(...a).all().then(r=>r.results||[]);
  const [plays, gens, events, invited, retention, firsts] = await Promise.all([
    q("SELECT day, COUNT(*) n, ROUND(AVG(score*1.0/total)*100) acc FROM plays WHERE day>=? GROUP BY day ORDER BY day", from),
    q("SELECT gen, COUNT(DISTINCT device) n FROM plays WHERE day>=? GROUP BY gen ORDER BY n DESC", shiftDay(t,-6)),
    q("SELECT day, type, COUNT(*) n FROM events WHERE day>=? GROUP BY day, type", from),
    q("SELECT day, COUNT(*) n FROM plays WHERE day>=? AND ref IS NOT NULL GROUP BY day", from),
    q("SELECT a.day, COUNT(*) base, SUM(CASE WHEN b.device IS NOT NULL THEN 1 ELSE 0 END) back FROM plays a LEFT JOIN plays b ON b.device=a.device AND b.day=date(a.day,'+1 day') WHERE a.day>=? AND a.day<? GROUP BY a.day ORDER BY a.day", from, t),
    q("SELECT first_day day, COUNT(*) n FROM (SELECT device, MIN(day) first_day FROM plays GROUP BY device) WHERE first_day>=? GROUP BY first_day", from)
  ]);
  const totals = await env.DB.prepare("SELECT COUNT(DISTINCT device) devices, COUNT(*) plays FROM plays").first();
  return json({ok:true, today:t, totals, plays, gens, events, invited, retention, firsts});
}
