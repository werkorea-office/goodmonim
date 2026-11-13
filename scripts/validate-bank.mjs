// 배포 전 자동 검사: 하나라도 어기면 배포가 멈춥니다.
//  1) 형식: 보기 4개, 정답 번호, 보기 중복, 해설
//  2) 같은 문제가 은행 안에 두 번 들어 있지 않은지
//  3) 앞으로 1년을 미리 돌려서, 같은 문제가 정해진 기간 안에 다시 나오지 않는지
//     속담·맞춤법·상식: 100일 · 계산 문제: 365일 · 세대 추억: 30일
import fs from "node:fs"; import vm from "node:vm";
const root = new URL("..", import.meta.url).pathname;
const ctx = { window: {} }; ctx.globalThis = ctx.window; vm.createContext(ctx);
for (const f of ["public/bank.js","public/bank2.js","public/engine.js"]) vm.runInContext(fs.readFileSync(root+f,"utf8"), ctx);
const B = ctx.window.GM_BANK, E = ctx.window.GM_ENGINE;
const errors = []; let n = 0; const seen = new Map();
function check(q, where){ n++;
  if(!q || !q.q || !Array.isArray(q.o) || q.o.length !== 4){ errors.push(where+": 보기는 4개여야 합니다"); return; }
  if(!(Number.isInteger(q.a) && q.a>=0 && q.a<4)) errors.push(where+": 정답 번호 오류");
  if(new Set(q.o).size !== 4) errors.push(where+": 보기 중복 — "+q.q);
  if(!q.e) errors.push(where+": 해설 없음");
}
for (const k of ["A","B","C"]) E._pool(k,null).forEach((q,i)=>{ check(q,k+"#"+(i+1)); const key=q.q+"|"+q.o[q.a]; if(seen.has(key)) errors.push(`같은 문제 중복: ${k}#${i+1} = ${seen.get(key)} (${q.q})`); seen.set(key,k+"#"+(i+1)); });
for (const g of B.GENS) { const p=E._pool("BONUS",g); if(!p.length) errors.push("추억 문제 없음: "+g); p.forEach((q,i)=>{ check(q,g+"#"+(i+1)); const key=g+q.q; if(seen.has(key)) errors.push("같은 추억 문제 중복: "+g+" "+q.q); seen.set(key,1); }); }

const RULE = { "Proverbs":100, "Spelling":100, "Knowledge":100, "Brain Math":365, "Everyday Math":365, "Memory Lane":30 };
const start = E.dayNo(E.LAUNCH), todayKST = Math.floor((Date.now()+9*3600e3)/864e5), end = todayKST + 365;
const minGap = {};
for (const g of B.GENS) {
  const lastSeen = {};
  for (let d=start; d<=end; d++) {
    const set = E.setFor(d, g);
    const today = new Set();
    set.qs.forEach((q,k)=>{
      const where = `${g} ${new Date(d*864e5).toISOString().slice(0,10)} ${set.ko[k]}`;
      if(!q){ errors.push(where+": 낼 문제가 없습니다"); return; }
      if(d>=E.dayNo(E.EPOCH)) check(q, where);
      if(today.has(q.q+q.o[q.a])) errors.push(where+": 같은 날 같은 문제 두 번"); today.add(q.q+q.o[q.a]);
      const cat = set.en[k], key = cat+"|"+q.q+"|"+q.o[q.a];
      if(lastSeen[key]!=null && d>todayKST){
        const gap = d-lastSeen[key]; minGap[cat] = Math.min(minGap[cat]??1e9, gap);
        if(gap < (RULE[cat]||100)) errors.push(`${where}: ${gap}일 만에 같은 문제 — ${q.q}`);
      }
      lastSeen[key] = d;
    });
  }
}
const pc = k => E._pool(k,null).length;
console.log(`문제 ${n}개 형식 검사 · 속담 ${pc("A")} · 맞춤법 ${pc("B")} · 상식 ${pc("C")} · 세대 ${B.GENS.map(g=>E._pool("BONUS",g).length).join("/")}`);
console.log("앞으로 1년 동안 같은 문제가 다시 나오기까지 가장 짧은 간격(일): "+Object.entries(minGap).map(([k,v])=>k+" "+v).join(" · ") + (Object.keys(minGap).length<6?" (나머지 분야는 1년 안에 반복 없음)":""));
if(errors.length){ console.error(errors.slice(0,40).join("\n")+(errors.length>40?`\n…외 ${errors.length-40}건`:"")); process.exit(1); }
console.log("이상 없음");
