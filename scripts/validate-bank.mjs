// 문제 은행 형식 검사: 배포 전 자동 실행. 문제가 있으면 배포를 멈춥니다.
import fs from "node:fs"; import vm from "node:vm";
const src = fs.readFileSync(new URL("../public/bank.js", import.meta.url), "utf8");
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(src, ctx);
const B = ctx.window.GM_BANK; let errors = [], n = 0; const seen = new Set();
function check(q, where){ n++;
  if(!q.q || !Array.isArray(q.o) || q.o.length !== 4) errors.push(where+": 보기는 4개여야 합니다");
  if(!(Number.isInteger(q.a) && q.a>=0 && q.a<4)) errors.push(where+": 정답 번호 오류");
  if(new Set(q.o).size !== 4) errors.push(where+": 보기 중복");
  if(!q.e) errors.push(where+": 해설 없음");
  const key = q.q + "|" + q.o.join(","); if(seen.has(key)) errors.push(where+": 같은 문제 중복"); seen.add(key);
}
["A","B","C"].forEach(k => B[k].forEach((q,i)=>check(q,k+"#"+(i+1))));
B.GENS.forEach(g => { if(!B.BONUS[g]) errors.push("추억 문제 없음: "+g); else B.BONUS[g].forEach((q,i)=>check(q,g+"#"+(i+1))); });
console.log(`문제 ${n}개 검사 · 속담 ${B.A.length} · 맞춤법 ${B.B.length} · 상식 ${B.C.length} · 세대 ${B.GENS.length}`);
if(errors.length){ console.error(errors.join("\n")); process.exit(1); } else console.log("이상 없음");
