// 문제 원본(scripts/src/*.txt) → public/bank2.js
// - 문제는 '추가만' 합니다. 이미 있던 줄을 지우면 빌드가 멈춥니다. (잘못된 문제는 줄 앞에 ~ 를 붙여 은퇴시킵니다)
// - 새 문제는 '내일'부터 낼 수 있게 날짜(s)를 붙여 잠금 파일에 기록합니다. 그래서 오늘 문제는 절대 바뀌지 않습니다.
// - 배포 서버에서는 --check 로만 돌립니다: 잠금 파일에 없는 새 문제가 있으면 멈춥니다(날짜가 매번 달라지는 것 방지).
import fs from "node:fs"; import crypto from "node:crypto";
const CHECK = process.argv.includes("--check");
const root = new URL("..", import.meta.url).pathname;
const EPOCH = Math.floor(Date.parse("2026-11-14T00:00:00Z")/864e5);
const todayKST = Math.floor((Date.now()+9*3600e3)/864e5);
const SINCE_NEW = Math.max(EPOCH, todayKST+1);
const lockPath = root+"scripts/bank.lock.json";
const lock = fs.existsSync(lockPath) ? JSON.parse(fs.readFileSync(lockPath,"utf8")) : {};
const GENS = ["10대","20대","30대","40대","50대","60대","70대","80·90대"];
const hash = s => crypto.createHash("sha1").update(s).digest("hex").slice(0,10);
function seeded(seed){ let x=parseInt(seed.slice(0,8),16)||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296; }; }
function parse(file, withGen){
  const out=[];
  fs.readFileSync(root+"scripts/src/"+file,"utf8").split("\n").forEach((raw,ln)=>{
    let line=raw.trim(); if(!line||line.startsWith("#")) return;
    let retired=false; if(line.startsWith("~")){ retired=true; line=line.slice(1).trim(); }
    let gen=null; if(withGen){ const m=line.match(/^\[(.+?)\]\s*/); if(!m) throw new Error(file+":"+(ln+1)+" 세대 표시가 없습니다"); gen=m[1]; line=line.slice(m[0].length); if(!GENS.includes(gen)) throw new Error(file+":"+(ln+1)+" 알 수 없는 세대 "+gen); }
    const p=line.split(" | ").map(s=>s.trim());
    if(p.length!==6) throw new Error(file+":"+(ln+1)+" 칸이 6개가 아닙니다");
    const [q,ok,d1,d2,d3,e]=p, R=seeded(hash(q+ok));
    const opts=[ok,d1,d2,d3].map((v,i)=>[R(),v,i]).sort((a,b)=>a[0]-b[0]);
    out.push({gen, retired, item:{q, o:opts.map(x=>x[1]), a:opts.findIndex(x=>x[2]===0), e}});
  });
  return out;
}
const src = { A:parse("A_proverbs.txt"), B:parse("B_spelling.txt"), C:parse("C_trivia.txt") };
parse("D_bonus.txt",true).forEach(x=>{ (src["BONUS:"+x.gen] ||= []).push(x); });
let changed=false, problems=[];
const out = { A:[], B:[], C:[], BONUS:{} };
Object.keys(src).forEach(key=>{
  const prev = lock[key] || [], list = src[key];
  if(list.length < prev.length) problems.push(`${key}: 문제가 ${prev.length}개에서 ${list.length}개로 줄었습니다. 지우지 말고 줄 앞에 ~ 를 붙이세요.`);
  const next = list.map((x,i)=>{
    const old = prev[i];
    let s = old ? old.s : SINCE_NEW, r = old && old.r!=null ? old.r : null;
    if(!old) changed=true;
    if(x.retired && r==null){ r = SINCE_NEW; changed=true; }
    if(!x.retired && r!=null){ problems.push(`${key} #${i+1}: 은퇴한 문제는 되살릴 수 없습니다. 새 줄로 추가하세요.`); }
    const it = Object.assign({}, x.item, {s}); if(r!=null) it.r=r;
    if(key.startsWith("BONUS:")) (out.BONUS[key.slice(6)] ||= []).push(it); else out[key].push(it);
    return {h:hash(x.item.q), s, ...(r!=null?{r}:{})};
  });
  lock[key]=next;
});
if(CHECK && changed) problems.push("잠금 파일에 없는 새 문제가 있습니다. 내 컴퓨터에서 'npm run bank'를 실행한 뒤 함께 올리세요.");
if(problems.length){ console.error(problems.join("\n")); process.exit(1); }
const js = "/* 자동 생성 파일입니다. 직접 고치지 말고 scripts/src 의 원본을 고친 뒤 'npm run bank'를 실행하세요. */\nwindow.GM_BANK2="+JSON.stringify(out)+";\n";
fs.writeFileSync(root+"public/bank2.js", js);
if(!CHECK) fs.writeFileSync(lockPath, JSON.stringify(lock,null,0).replace(/\],"/g,'],\n"')+"\n");
const cnt = k => out[k].length;
console.log(`추가 문제: 속담 ${cnt("A")} · 맞춤법 ${cnt("B")} · 상식 ${cnt("C")} · 세대 ${GENS.map(g=>g+" "+(out.BONUS[g]||[]).length).join(", ")}`);
