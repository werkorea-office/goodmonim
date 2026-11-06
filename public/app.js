/* 굿모님 앱 — 화면과 기록 (기록은 이 기기 + 서버 집계) */
(function(){
"use strict";
var CFG = window.GM_CONFIG || {};
var SITE = CFG.siteUrl || location.origin;
var BANK = window.GM_BANK, A=BANK.A, B=BANK.B, C=BANK.C, BONUS=BANK.BONUS, GENS=BANK.GENS;
var PREVIEW = !!window.GM_FORCE_PREVIEW || /[?&]preview=1/.test(location.search);
var MIN_SAMPLE = 30;

var GEN_EN={"10대":"Newbies","20대":"Level-Ups","30대":"Almost Max","40대":"Max Level","50대":"Veterans","60대":"Masters","70대":"Grandmasters","80·90대":"Legends"};
var GEN_KO={"10대":"뉴비","20대":"성장캐","30대":"만렙 직전","40대":"만렙","50대":"베테랑","60대":"명인","70대":"고수","80·90대":"전설"};
function genFull(g){ return (GEN_KO[g]||"")+"("+g+")"; }
var CAT_EN=["Proverbs","Spelling","Knowledge","Brain Math","Knowledge"];
var CAT_KO=["속담·우리말","맞춤법","상식","두뇌 계산","상식"];
var LINES=[
 {en:"A clear mind makes a bright day.",ko:"맑은 생각이 밝은 하루를 만듭니다."},
 {en:"Small habits, quietly kept, shape a good life.",ko:"조용히 지켜 온 작은 습관이 좋은 삶을 만듭니다."},
 {en:"Today is a fresh page. Write it gently.",ko:"오늘은 새로 펼친 한 페이지, 다정하게 채워 보세요."},
 {en:"Those who keep learning keep shining.",ko:"배움을 멈추지 않는 사람은 언제나 빛납니다."},
 {en:"Every good morning begins with curiosity.",ko:"좋은 아침은 언제나 작은 호기심에서 시작됩니다."},
 {en:"A warm heart and a sharp mind.",ko:"마음은 따뜻하게, 생각은 또렷하게."},
 {en:"May your day be as kind as your smile.",ko:"당신의 미소만큼 다정한 하루 보내세요."}
];
/* 오늘 놓치지 마세요: 정부 공식 사이트로만 연결합니다 (개인정보를 받지 않음) */
var TIPS={
 young:{t:"청년 정책 한곳에서 찾기",d:"취업, 주거, 교육 지원을 나이와 지역으로 찾아볼 수 있습니다.",site:"온통청년",url:"https://www.youthcenter.go.kr"},
 middle:{t:"우리 집이 받을 수 있는 복지 찾기",d:"육아, 주거, 생활 지원 가운데 해당되는 것을 확인해 보세요.",site:"복지로",url:"https://www.bokjiro.go.kr"},
 senior:{t:"내가 받을 수 있는 정부 혜택 확인",d:"보조금과 지원 서비스를 한 번에 찾아볼 수 있습니다.",site:"정부24",url:"https://www.gov.kr"},
 elder:{t:"어르신 복지 서비스 찾기",d:"기초연금, 돌봄, 일자리 지원 등을 확인해 보세요.",site:"복지로",url:"https://www.bokjiro.go.kr"}
};
/* ---------- 오늘의 돈 정보: 3일 중 1일 공통 숨은 돈, 2일 세대 맞춤(이달 시기 정보 우선) ---------- */
var MONEY=window.GM_MONEY||{hidden:[],calendar:[],gen:[]};
function moneyOn(dayNum,gen){
  var d=new Date(dayNum*864e5), month=d.getUTCMonth()+1, slot=dayNum%3, k=Math.floor(dayNum/3);
  var H=MONEY.hidden||[]; if(!H.length) return null;
  var cal=(MONEY.calendar||[]).filter(function(c){ return c.m.indexOf(month)>=0 && c.gens.indexOf(gen)>=0; });
  var P=(MONEY.gen||[]).filter(function(c){ return c.gens.indexOf(gen)>=0; });
  if(slot===0 || !P.length && !cal.length) return H[k%H.length];
  if(slot===1 && cal.length) return cal[k%cal.length];
  if(!P.length) return cal[k%cal.length];
  return P[(k*2+(slot===2?1:0))%P.length];
}
function nextSame(item,fromDay,gen){ for(var k=1;k<=90;k++){ if(moneyOn(fromDay+k,gen)===item) return k; } return null; }
function dayOfYear(){ var y=Date.UTC(DT.getUTCFullYear(),0,1); return Math.floor((Date.parse(TODAY)-y)/864e5)+1; }
function untilMidnight(){ var now=Date.now()+9*3600e3, next=(Math.floor(now/864e5)+1)*864e5, m=Math.max(0,Math.floor((next-now)/60000)); return Math.floor(m/60)+"시간 "+(m%60)+"분"; }
function tipFor(g){ return (g==="10대"||g==="20대")?TIPS.young:(g==="30대"||g==="40대")?TIPS.middle:(g==="50대"||g==="60대")?TIPS.senior:TIPS.elder; }

/* ---------- 날짜 (한국 시간) ---------- */
function kst(off){ return new Date(Date.now()+9*3600e3+(off||0)*864e5).toISOString().slice(0,10); }
var TODAY=kst(0), DAY=Math.floor(Date.parse(TODAY)/864e5);
var LINE=LINES[DAY%LINES.length];
var DT=new Date(TODAY+"T00:00:00Z");
var KO_DOW=["일","월","화","수","목","금","토"];
var EN_DATE=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].at(DT.getUTCDay())+", "+["January","February","March","April","May","June","July","August","September","October","November","December"].at(DT.getUTCMonth())+" "+DT.getUTCDate();
var KO_DATE=(DT.getUTCMonth()+1)+"월 "+DT.getUTCDate()+"일 "+KO_DOW.at(DT.getUTCDay())+"요일";
function dayNo(iso){ return Math.floor(Date.parse(iso)/864e5); }
function isoOf(n){ return new Date(n*864e5).toISOString().slice(0,10); }
function shortDate(iso){ var d=new Date(iso+"T00:00:00Z"); return (d.getUTCMonth()+1)+"월 "+d.getUTCDate()+"일"; }

/* ---------- 두뇌 계산: 날짜로 자동 생성 (계산이라 오답이 없음) ---------- */
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function fmt(n){ return Number(n).toLocaleString("ko-KR"); }
function mathQ(day){
  var R=rng(day*7919+13), pick=function(a,b){ return a+Math.floor(R()*(b-a+1)); }, type=day%7, q, ans, e, unit="", dis=[];
  if(type===0){ var a=pick(1,3), r=pick(2,3), s=[a,a*r,a*r*r,a*r*r*r]; ans=a*r*r*r*r; q=s.join(", ")+", 다음 숫자는?"; e="앞의 숫자에 "+r+"를 곱합니다. "+s[3]+" × "+r+" = "+ans; dis=[ans-r, ans+a*r, s[3]+r*r]; }
  else if(type===1){ var a1=pick(2,9), d=pick(3,9), s1=[a1,a1+d,a1+2*d,a1+3*d]; ans=a1+4*d; q=s1.join(", ")+", 다음 숫자는?"; e="앞의 숫자에 "+d+"씩 더합니다. "+s1[3]+" + "+d+" = "+ans; dis=[ans+1, ans-2, ans+d]; }
  else if(type===2){ var x=pick(1,4), y=pick(x,6), f=[x,y]; for(var i=0;i<4;i++) f.push(f.at(-1)+f.at(-2)); ans=f.at(-1)+f.at(-2); q=f.join(", ")+", 다음 숫자는?"; e="앞의 두 숫자를 더합니다. "+f.at(-2)+" + "+f.at(-1)+" = "+ans; dis=[ans-1, ans+2, f.at(-1)*2]; }
  else if(type===3){ var w=pick(0,6), n=pick(8,20), aw=(w+n)%7; q="오늘이 "+KO_DOW.at(w)+"요일이면 "+n+"일 뒤는 무슨 요일?"; e="7일마다 같은 요일이 돌아옵니다. "+n+"일 = 7×"+Math.floor(n/7)+" + "+(n%7)+"일이라 "+KO_DOW.at(aw)+"요일입니다.";
    var opts=[aw,(aw+1)%7,(aw+6)%7,(aw+3)%7].map(function(k){ return KO_DOW.at(k)+"요일"; }); return shuffleQ(q,opts,e,R); }
  else if(type===4){ var p=pick(3,20)*100, k=pick(2,4), t=pick(2,4), c=p*k; ans=c*t; q="귤 "+k+"개에 "+fmt(c)+"원이면 "+(k*t)+"개는 얼마?"; e=(k*t)+"개는 "+k+"개 묶음이 "+t+"개입니다. "+fmt(c)+" × "+t+" = "+fmt(ans)+"원"; unit="원"; dis=[ans-c, ans+c, ans+p]; }
  else if(type===5){ var h=pick(1,5); ans=h*30; q="시계가 정확히 "+h+"시일 때 두 바늘 사이의 작은 각도는?"; e="한 시간 칸은 30도입니다. "+h+"칸이니 "+ans+"도입니다."; unit="도"; dis=[ans+30, ans+60, ans===30?45:ans-30]; }
  else { var m=pick(6,15); ans=m*(m+1)/2; q="1부터 "+m+"까지 모두 더하면?"; e="(1 + "+m+") × "+m+" ÷ 2 = "+ans; dis=[ans-m, ans+m, ans+1]; }
  var seen={}; seen[ans]=1; var list=[ans]; dis.forEach(function(v){ if(v>0&&!seen[v]){ seen[v]=1; list.push(v); } }); var bump=1; while(list.length<4){ var v2=ans+bump*(bump%2?1:-1)*3; if(v2>0&&!seen[v2]){ seen[v2]=1; list.push(v2); } bump++; }
  return shuffleQ(q, list.slice(0,4).map(function(v){ return fmt(v)+unit; }), e, R);
}
function shuffleQ(q,opts,e,R){ var order=[0,1,2,3].map(function(i){ return [R(),i]; }).sort(function(a,b){ return a[0]-b[0]; }).map(function(x){ return x[1]; }); return {q:q,o:order.map(function(i){ return opts.at(i); }),a:order.indexOf(0),e:e}; }

function todaySet(gen){
  var qs=[A[DAY%A.length],B[DAY%B.length],C[DAY%C.length],mathQ(DAY),C[(DAY+21)%C.length]];
  var en=CAT_EN.slice(), ko=CAT_KO.slice(), pool=BONUS[gen]||[];
  if(pool.length){ qs.push(pool[DAY%pool.length]); en.push("Memory Lane"); ko.push(gen+" 추억 문제"); }
  return {qs:qs,en:en,ko:ko};
}

/* ---------- 저장 (이 기기 안) ---------- */
var KEY="goodmonim.v3";
function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
var S=load(); if(!S.done) S.done={}; if(!S.theme) S.theme="dawn";
if(!S.device){ S.device=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()).replace(/-/g,"").slice(0,24); save(); }
var run={i:0,picks:[],answered:false};

/* ---------- 초대 링크 추적 ---------- */
(function(){
  var m=location.search.match(/[?&]ref=([a-z0-9]{6,24})/i);
  if(m && !S.ref && m[1]!==S.device.slice(0,10)){ S.ref=m[1]; save(); track("invite_open",{ref:m[1]}); }
  if(S.visitDay!==TODAY){ S.visitDay=TODAY; save(); track("visit",{}); }
})();
function track(type,extra){
  if(PREVIEW) return;
  try{ var body=JSON.stringify(Object.assign({type:type,device:S.device,gen:S.gen||null,day:TODAY},extra||{}));
    if(navigator.sendBeacon) navigator.sendBeacon("/api/event",new Blob([body],{type:"application/json"}));
    else fetch("/api/event",{method:"POST",headers:{"content-type":"application/json"},body:body,keepalive:true}).catch(function(){});
  }catch(e){}
}
function inviteUrl(){ return SITE+"/?ref="+S.device.slice(0,10); }

/* ---------- 연속 출석: 보호막 + 이틀 기한 ---------- */
var GRACE_DAYS=2, MAX_SHIELDS=2;
function streakStatus(){
  if(!S.last||!S.streak) return {kind:"new"};
  var gap=DAY-dayNo(S.last);
  if(gap<=0) return {kind:"today"};
  if(gap===1) return {kind:"ok"};
  var missed=gap-1, sh=S.shields||0, cover=Math.min(sh,missed), rest=missed-cover;
  if(rest===0) return {kind:"shield",missed:missed,use:cover};
  if(rest<=GRACE_DAYS) return {kind:"grace",missed:missed,use:cover,deadline:isoOf(dayNo(S.last)+1+GRACE_DAYS+cover)};
  return {kind:"broken",missed:missed,was:S.streak};
}
var STATUS=streakStatus();
function applyStreak(){
  var st=STATUS, note="";
  if(st.kind==="new"||st.kind==="broken"){ if(st.kind==="broken") note="지난 기록 "+st.was+"일은 최고 기록에 남아 있습니다. 오늘부터 다시 시작합니다."; S.streak=1; }
  else if(st.kind==="ok"){ S.streak+=1; }
  else if(st.kind==="shield"){ S.shields-=st.use; S.streak+=1; note="쉬신 "+st.missed+"일은 보호막 "+st.use+"개가 지켜 드렸습니다."; }
  else if(st.kind==="grace"){ S.shields=(S.shields||0)-st.use; S.streak+=1; note="돌아오셨군요. 연속 기록이 그대로 이어졌습니다."; }
  if(S.streak%7===0){ S.shields=Math.min(MAX_SHIELDS,(S.shields||0)+1); note+=(note?" ":"")+"7일을 채워 보호막 1개를 받으셨습니다."; }
  S.best=Math.max(S.best||0,S.streak); S.last=TODAY; S.note=note;
}
var MILES=[3,7,14,30,50,100,200,365,500,1000];
function streakTitle(st){ return st>=365?"One Year Club":st>=100?"Hundred Days":st>=30?"Monthly Master":st>=7?"Golden Week":st>=3?"Three-Day Streak":"Day One"; }
function nextMile(st){ for(var i=0;i<MILES.length;i++) if(MILES[i]>st) return MILES[i]; return null; }
function dayTitle(s,t){ var r=s/t; return r===1?["Perfect Morning","오늘의 만점"]:r>=.8?["Brilliant","훌륭합니다"]:r>=.6?["Great","아주 좋습니다"]:r>=.4?["Good","좋습니다"]:["Warm-up","몸풀기 완료"]; }

/* ---------- 공통 ---------- */
var app=document.getElementById("app"), hero=document.getElementById("hero");
document.getElementById("dateLine").textContent=EN_DATE+" · "+KO_DATE;
document.getElementById("koLine").textContent=LINE.ko;
document.getElementById("enLine").textContent=LINE.en;
function setRise(x){ hero.style.setProperty("--rise",String(x)); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];}); }
var sizeBtn=document.getElementById("sizeBtn");
function applySize(){ var big=!!S.big; document.documentElement.classList.toggle("big",big); sizeBtn.setAttribute("aria-pressed",String(big)); sizeBtn.textContent=big?"보통 글씨":"큰 글씨"; }
sizeBtn.addEventListener("click",function(){ S.big=!S.big; save(); applySize(); });
applySize();
function updateBadge(){ var b=document.getElementById("streakBadge"); if(S.streak&&STATUS.kind!=="broken"){ b.hidden=false; document.getElementById("badgeNum").textContent=S.streak+"일 연속"; } else b.hidden=true; }
updateBadge();
function shieldIcon(on){ return '<svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1.5 L18 4.5 V10.5 C18 15.5 14.5 19 10 20.5 C5.5 19 2 15.5 2 10.5 V4.5 Z" fill="'+(on?'#5E9C72':'none')+'" stroke="'+(on?'#5E9C72':'var(--line)')+'" stroke-width="1.5"/>'+(on?'<path d="M6.5 11 L9 13.5 L13.8 8.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>':'')+'</svg>'; }
function statusNotice(){
  var st=STATUS;
  if(st.kind==="grace"){ var dl=st.deadline===TODAY?"오늘":shortDate(st.deadline)+"까지"; return '<div class="notice grace">'+shieldIcon(false)+'<div><strong>연속 '+S.streak+'일 기록이 잠시 쉬고 있습니다</strong>'+dl+' 문제를 풀면 기록이 그대로 이어집니다. 쉬어 간 날은 세지 않습니다.</div></div>'; }
  if(st.kind==="shield") return '<div class="notice shield">'+shieldIcon(true)+'<div><strong>보호막이 연속 '+S.streak+'일을 지키고 있습니다</strong>쉬신 '+st.missed+'일은 보호막으로 채워집니다. 오늘 풀면 '+(S.streak+1)+'일째가 됩니다.</div></div>';
  if(st.kind==="broken") return '<div class="notice"><div><strong>지난 '+st.was+'일 기록은 최고 기록에 남아 있습니다</strong>오늘부터 새로 시작합니다. 7일을 채우면 하루 쉬어도 지켜 주는 보호막을 받습니다.</div></div>';
  return '';
}

/* ---------- 나무 ---------- */
var STAGES=[{d:1,ko:"씨앗",en:"Seed"},{d:3,ko:"새싹",en:"Sprout"},{d:7,ko:"어린 나무",en:"Sapling"},{d:14,ko:"푸른 나무",en:"Young Tree"},{d:30,ko:"꽃나무",en:"Blossom Tree"},{d:60,ko:"열매 나무",en:"Fruit Tree"},{d:100,ko:"큰 나무",en:"Grand Tree"},{d:365,ko:"아침 정원",en:"Morning Garden"}];
function stageIndex(days){ var k=0; STAGES.forEach(function(t,i){ if(days>=t.d) k=i; }); return k; }
function circles(list,fill,op){ return list.map(function(c){ return '<circle cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" fill="'+fill+'" fill-opacity="'+(op||1)+'"/>'; }).join(''); }
function treeSVG(k){
  var trunk="#8A6A52", L1="#A9D3A6", L2="#7DB683", L3="#5A9A6C", pink="#F2A7BB", fruit="#F0A15A";
  var g='<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="tree-svg" role="img" aria-label="'+STAGES[k].ko+'"><circle cx="150" cy="52" r="26" fill="#FFD9B8" fill-opacity=".7"/><ellipse cx="100" cy="176" rx="78" ry="12" fill="#C9DDB8" fill-opacity=".8"/>';
  if(k===0){ g+='<ellipse cx="100" cy="170" rx="22" ry="7" fill="#B59A7E"/><ellipse cx="100" cy="164" rx="7" ry="9" fill="#7A5A40" transform="rotate(-20 100 164)"/>'; }
  else if(k===1){ g+='<path d="M100 172 C100 160 100 150 101 140" stroke="'+L3+'" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M101 146 C88 140 84 130 86 124 C96 126 102 136 101 146Z" fill="'+L2+'"/><path d="M101 142 C112 136 118 128 117 121 C106 122 100 132 101 142Z" fill="'+L1+'"/>'; }
  else if(k===2){ g+='<path d="M100 172 L100 110" stroke="'+trunk+'" stroke-width="4" stroke-linecap="round"/><path d="M100 140 L84 126 M100 128 L116 114" stroke="'+trunk+'" stroke-width="2.5" stroke-linecap="round"/>'+circles([[82,122,10],[118,110,11],[100,104,13],[90,112,9],[110,124,8]],L2)+circles([[96,100,7],[114,106,6]],L1); }
  else {
    var big=k>=6, w=big?9:k>=4?7:6, top=big?92:104, s=big?1.32:k>=4?1.15:1;
    g+='<path d="M100 174 L100 '+top+'" stroke="'+trunk+'" stroke-width="'+w+'" stroke-linecap="round"/><path d="M100 140 L76 118 M100 128 L126 108 M100 118 L90 98" stroke="'+trunk+'" stroke-width="'+(w/2)+'" stroke-linecap="round"/>';
    var sc=function(c,r){ return [100+(c[0]-100)*s,112+(c[1]-112)*s,r===undefined?c[2]*s:r]; };
    var can=[[100,86,26],[74,104,20],[126,100,22],[88,74,18],[116,72,18],[62,90,14],[138,86,15],[100,62,16]].map(function(c){ return sc(c); });
    g+=circles(can,L3)+circles(can.map(function(c){return [c[0]-3,c[1]-4,c[2]*.78];}),L2)+circles(can.slice(0,5).map(function(c){return [c[0]-6,c[1]-8,c[2]*.38];}),L1,.9);
    if(k===4||k>=6) g+=circles([[78,92],[112,80],[128,98],[96,70],[66,104],[140,84],[104,98]].map(function(c){ return sc(c,3); }),pink);
    if(k>=5) g+=circles([[86,100],[120,90],[106,74],[70,88]].map(function(c){ return sc(c,4); }),fruit);
    if(k===7) g+='<path d="M34 174 L34 152" stroke="'+trunk+'" stroke-width="3" stroke-linecap="round"/>'+circles([[34,146,10],[28,152,7],[40,152,7]],L2)+circles([[156,170,3],[166,172,3],[146,172,2.6],[60,172,2.6]],pink)+circles([[161,166,2.2],[52,170,2]],"#F6D06B");
  }
  return g+'</svg>';
}
function weekHTML(){ var out=''; for(var i=6;i>=0;i--){ var d=kst(-i), dt=new Date(d+"T00:00:00Z"); out+='<div>'+KO_DOW.at(dt.getUTCDay())+'<b class="'+(S.done[d]?'on':'')+(i===0?' today':'')+'"></b></div>'; } return out; }
function skillsHTML(){
  var keys=[["Proverbs","속담·우리말"],["Spelling","맞춤법"],["Knowledge","상식"],["Brain Math","두뇌 계산"],["Memory Lane","추억"]], tot={}, ok={};
  Object.keys(S.done).forEach(function(d){ var r=S.done[d]; if(!r.cats) return; r.cats.forEach(function(c,k){ tot[c]=(tot[c]||0)+1; if(r.oks[k]) ok[c]=(ok[c]||0)+1; }); });
  return keys.map(function(kv){ var t=tot[kv[0]]||0, p=t?Math.round((ok[kv[0]]||0)/t*100):0; return '<div class="row"><span>'+kv[1]+'<em>'+kv[0]+'</em></span><span class="bar"><i style="width:'+p+'%"></i></span><span class="pct">'+(t?p+'%':'-')+'</span></div>'; }).join('');
}

/* ---------- 화면 1: 소개 + 세대 고르기 ---------- */
function renderGen(){
  setRise(.2);
  var h='<div class="section-title" style="margin-top:4px"><h2>굿모님은 이런 곳입니다</h2><span>What is GoodMonim</span></div><div class="panel"><div class="intro">';
  h+='<div class="item"><span class="num">i</span><div><h3>매일 아침 5문제, 1분</h3><p>속담, 맞춤법, 상식, 두뇌 계산. 앱 설치도 회원가입도 없습니다.</p></div></div>';
  h+='<div class="item"><span class="num">ii</span><div><h3>연속 기록을 지켜 드립니다</h3><p>7일마다 보호막을 받고, 하루이틀 쉬어도 기록이 이어집니다.</p></div></div>';
  h+='<div class="item"><span class="num">iii</span><div><h3>나의 아침 나무가 자랍니다</h3><p>푼 날이 쌓일수록 씨앗이 새싹, 꽃나무, 큰 나무로 자랍니다.</p></div></div>';
  h+='<div class="item"><span class="num">iv</span><div><h3>우리 세대를 대표합니다</h3><p>뉴비, 만렙, 명인, 전설 4개 리그로 겨루다가, 참여가 많아진 세대는 독립 리그로 나갑니다.</p></div></div>';
  h+='</div><div class="growrow" aria-label="나무가 자라는 모습">'+[0,1,4,6].map(function(k){ return '<figure>'+treeSVG(k)+'<figcaption>'+STAGES[k].ko+'</figcaption></figure>'; }).join('')+'</div></div>';
  h+='<div class="section-title"><h2>어느 세대로 참여하시겠어요?</h2><span>Choose your generation</span></div><p class="lead">고른 세대의 리그에 함께 들어갑니다. 이름과 정확한 나이는 묻지 않습니다.</p><div class="gens">';
  GENS.forEach(function(g){ h+='<button class="gen" type="button" data-gen="'+esc(g)+'"><strong>'+esc(GEN_KO[g])+'<small>'+esc(g)+'</small></strong><em>'+esc(GEN_EN[g])+'</em></button>'; });
  app.innerHTML=h+'</div>';
  app.querySelectorAll(".gen").forEach(function(b){ b.addEventListener("click",function(){ S.gen=b.getAttribute("data-gen"); save(); run={i:0,picks:[],answered:false}; renderQuiz(); window.scrollTo(0,0); }); });
}

/* ---------- 화면 2: 문제 ---------- */
function renderQuiz(){
  var set=todaySet(S.gen), n=set.qs.length, q=set.qs[run.i];
  setRise(.2+.8*(run.i/n));
  var bars=''; for(var k=0;k<n;k++){ var c=k<run.picks.length?(run.picks[k]===set.qs[k].a?"ok":"no"):(k===run.i?"on":""); bars+='<span class="'+c+'"></span>'; }
  var h=(run.i===0?statusNotice():'')+'<div class="panel"><div class="progress" aria-hidden="true">'+bars+'</div>';
  h+='<div class="qmeta"><span class="cat">'+esc(set.en[run.i])+' <small>· '+esc(set.ko[run.i])+'</small></span><span class="num">'+(run.i+1)+' / '+n+'</span></div>';
  h+='<p class="q" id="qtext">'+esc(q.q)+'</p><div class="opts" role="group" aria-labelledby="qtext">';
  q.o.forEach(function(o,j){ h+='<button class="opt" type="button" data-j="'+j+'"><b>'+["i","ii","iii","iv"].at(j)+'</b><span>'+esc(o)+'</span></button>'; });
  app.innerHTML=h+'</div><div id="after"></div></div>';
  var opts=app.querySelectorAll(".opt");
  opts.forEach(function(b){ b.addEventListener("click",function(){
    if(run.answered) return; run.answered=true;
    var j=Number(b.getAttribute("data-j")); run.picks.push(j);
    opts.forEach(function(x){ x.disabled=true; var jj=Number(x.getAttribute("data-j")); if(jj===q.a) x.classList.add("right"); else if(jj===j) x.classList.add("wrong"); });
    var ok=j===q.a, last=run.i===n-1;
    document.getElementById("after").innerHTML='<div class="explain '+(ok?'ok':'no')+'"><strong>'+(ok?'정답입니다':'아쉽습니다. 정답은 '+esc(q.o[q.a]))+'</strong>'+esc(q.e)+'</div><button class="primary" type="button" id="next">'+(last?'오늘의 결과 보기':'다음 문제')+'</button>';
    app.querySelectorAll(".progress span")[run.i].className=ok?"ok":"no";
    var nx=document.getElementById("next"); nx.focus();
    nx.addEventListener("click",function(){ if(last) finish(set); else { run.i++; run.answered=false; renderQuiz(); } });
  }); });
}

function finish(set){
  var oks=run.picks.map(function(p,k){ return p===set.qs[k].a; }), score=oks.filter(Boolean).length;
  if(!S.done[TODAY]&&STATUS.kind!=="today"){ applyStreak(); STATUS={kind:"today"}; }
  S.done[TODAY]={score:score,total:set.qs.length,picks:run.picks.slice(),cats:set.en.slice(),oks:oks};
  save(); updateBadge();
  if(!PREVIEW){
    var body=JSON.stringify({device:S.device,day:TODAY,gen:S.gen,oks:oks.map(Number),streak:S.streak,ref:S.ref||null});
    var send=function(n){ fetch("/api/play",{method:"POST",headers:{"content-type":"application/json"},body:body}).then(function(r){ if(!r.ok&&n>0) setTimeout(function(){send(n-1);},2000); else loadStats(); }).catch(function(){ if(n>0) setTimeout(function(){send(n-1);},2000); }); };
    send(2);
  }
  renderResult(); window.scrollTo(0,0);
}

/* ---------- 서버 집계 ---------- */
var STATS=null;
function loadStats(){
  if(PREVIEW) return;
  fetch("/api/stats?day="+TODAY+"&gen="+encodeURIComponent(S.gen||"")).then(function(r){ return r.ok?r.json():null; }).then(function(j){ if(j){ STATS=j; fillStats(); } }).catch(function(){});
}
function fillStats(){
  var box=document.getElementById("rankBox"); if(!box||!STATS) return;
  var total=STATS.total||0, L=STATS.leagues||[];
  var mine=L.find(function(l){ return l.gens.indexOf(S.gen)>=0; });
  var open=L.filter(function(l){ return l.n>=MIN_SAMPLE; }).sort(function(a,b){ return b.acc-a.acc; });
  var h='';
  if((STATS.newSplits||[]).indexOf(S.gen)>=0) h+='<div class="notice shield" style="margin-bottom:12px">'+shieldIcon(true)+'<div><strong>축하합니다! 이번 주부터 '+esc(genFull(S.gen))+' 독립 리그가 열렸습니다</strong>7일 연속 하루 '+MIN_SAMPLE+'명 넘게 참여해 주신 덕분입니다.</div></div>';
  if(!open.length){
    h+='<div class="pending"><b>'+total+'명</b>이 오늘 함께 풀었습니다.<br>리그마다 '+MIN_SAMPLE+'명이 모이면 순위를 공개합니다.'+(mine?' 지금 <strong>'+esc(mine.name)+' 리그('+esc(mine.ages)+')</strong>는 '+mine.n+'명입니다.':'')+' 가족과 친구를 초대해 우리 리그 순위를 열어 보세요.</div>';
  } else {
    h+='<div class="rank">';
    open.forEach(function(x){ var me=mine&&x.name===mine.name, p=Math.round(x.acc*100); h+='<div class="row'+(me?' me':'')+'"><span>'+esc(x.name)+' 리그<em class="tag">'+esc(x.ages)+(x.independent?' · 독립':'')+'</em></span><span class="bar"><i style="width:'+p+'%"></i></span><span class="pct">'+p+'%</span></div>'; });
    h+='</div>';
    if(mine&&mine.n<MIN_SAMPLE) h+='<p class="note">'+esc(mine.name)+' 리그('+esc(mine.ages)+')는 지금 '+mine.n+'명입니다. '+MIN_SAMPLE+'명이 모이면 순위에 오릅니다.</p>';
    h+='<p class="note">공통 5문제 평균 정답률 · 오늘 참여 '+total+'명</p>';
  }
  h+='<p class="note">처음에는 뉴비(10·20대), 만렙(30·40대), 명인(50·60대), 전설(70대 이상) 4개 리그로 겨룹니다. 한 세대가 7일 연속 하루 '+MIN_SAMPLE+'명을 넘기면 다음 주 월요일부터 그 세대만의 독립 리그가 열립니다.</p>';
  box.innerHTML=h;
  (STATS.q||[]).forEach(function(rate,k){ var el=document.getElementById("qr"+k); if(el&&rate&&rate.n>=MIN_SAMPLE) el.textContent="정답률 "+Math.round(rate.ok/rate.n*100)+"%"; });
}

/* ---------- 화면 3: 결과 ---------- */
function okList(r){ return r.oks||[]; }
function shareText(r){
  var m=okList(r).map(function(x){return x?"●":"○";}).join("");
  return "Good Morning from GoodMonim\n"+EN_DATE+"\n\n오늘의 두뇌 퀴즈 "+m+" "+r.score+"/"+r.total+"\n"+(S.streak||1)+"-Day Streak · 연속 "+(S.streak||1)+"일째\n"+genFull(S.gen)+" 대표 · Proudly playing for Team "+GEN_EN[S.gen]+"\n\n"+LINE.en+"\n"+LINE.ko+"\n\n"+inviteUrl();
}
function inviteText(){ return "Good Morning\n오늘 아침, 두뇌 퀴즈 함께 풀어요.\nJoin me for today's morning quiz.\n\n5문제 · 1분 · 앱 설치 없이\n"+S.gen+" 대표로 참여 중입니다. 우리 세대에 힘을 보태 주세요.\n\n"+inviteUrl(); }
var THEMES=[{id:"dawn",ko:"새벽",sw:"linear-gradient(135deg,#FFB79C,#B7A6F2)"},{id:"mist",ko:"아침 안개",sw:"linear-gradient(135deg,#DCEBFA,#F3E3F2)"},{id:"midnight",ko:"미드나잇",sw:"linear-gradient(135deg,#141C45,#5B3E95)"}];

function renderResult(){
  var r=S.done[TODAY], st=S.streak||1, set=todaySet(S.gen), nm=nextMile(st), sh=S.shields||0, dt=dayTitle(r.score,r.total);
  setRise(1);
  var h='<div class="section-title c-streak" style="margin-top:4px"><h2>연속 출석</h2><span>Day Streak</span></div><div class="panel c-streak">';
  if(S.note) h+='<div class="notice shield" style="margin-bottom:16px">'+shieldIcon(true)+'<div>'+esc(S.note)+'</div></div>';
  h+='<div class="streak-hero"><div class="n">'+st+'<small>일 연속</small></div><div class="t">'+esc(streakTitle(st))+'<span>'+(nm?nm+'일 기념까지 '+(nm-st)+'일':'최고 단계입니다')+'</span></div></div>';
  h+='<div class="shields"><span class="ic">'+shieldIcon(sh>=1)+shieldIcon(sh>=2)+'</span><span><b>보호막 '+sh+'개</b> · 하루 빠져도 연속 기록을 지켜 줍니다</span></div>';
  h+='<div class="streak-facts"><div><b>'+(S.best||st)+'일</b>최고 연속 기록</div><div><b>'+Object.keys(S.done).length+'일</b>지금까지 푼 날</div></div>';
  h+='<ul class="rules"><li>7일 연속마다 보호막 1개를 받습니다 (최대 2개)</li><li>빠진 날은 보호막이 자동으로 채웁니다</li><li>보호막이 없어도 이틀 안에 돌아오면 기록이 이어집니다</li></ul></div>';

  var dots=okList(r).map(function(x){return '<i class="'+(x?'ok':'')+'"></i>';}).join('');
  h+='<div class="section-title c-result"><h2>오늘의 결과</h2><span>Today’s Quiz</span></div><div class="panel c-result"><div class="score-row"><div><div class="score-cap">'+esc(dt[0])+'</div><div class="score-num">'+r.score+'<small> / '+r.total+'</small></div></div><div class="marks" aria-label="'+r.total+'문제 중 '+r.score+'개 정답">'+dots+'</div></div><p class="daytitle">'+esc(dt[1])+'</p>';
  h+='<ol class="review">'+set.qs.map(function(q,k){ var ok=r.oks[k]; return '<li class="'+(ok?'ok':'no')+'"><span class="mk">'+(ok?'O':'X')+'</span><span class="tx">'+esc(q.q)+'<em>정답: '+esc(q.o[q.a])+'</em></span><span class="rt" id="qr'+k+'"></span></li>'; }).join('')+'</ol></div>';

  var mo=moneyOn(DAY,S.gen)||tipFor(S.gen), tm=moneyOn(DAY+1,S.gen), again=tm?nextSame(tm,DAY+1,S.gen):null;
  h+='<a class="tip" href="'+mo.url+'" target="_blank" rel="noopener"><span class="tip-flag">오늘의 돈 정보 · 올해 '+dayOfYear()+'번째</span><span class="tip-site">'+esc(mo.site)+' · 공식 사이트</span><strong>'+esc(mo.t)+'</strong><span class="tip-d">'+esc(mo.d)+'</span><span class="tip-go">공식 사이트에서 바로 확인하기 →</span></a><p class="note tip-note">조회는 모두 무료입니다. 굿모님은 신청을 대신 받거나 개인정보를 묻지 않습니다. "수수료를 내면 찾아 준다"는 문자는 열지 마세요.</p>';
  if(tm){
    var canInstall=window.GM_installCard&&window.GM_installCard()!=="";
    h+='<div class="tomorrow"><div class="tm-top"><span class="tm-lock"><svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><rect x="1" y="7" width="12" height="8" rx="2" fill="currentColor"/><path d="M4 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>내일 아침 공개</span><span class="tm-cd">공개까지 <b id="tmCount">'+untilMidnight()+'</b></span></div>';
    h+='<strong class="tm-hook">'+esc(tm.hook)+'</strong>';
    h+='<p class="tm-sub">어디서, 어떻게 받는지는 <b>내일 아침 굿모님에서만</b> 열립니다.'+(again?' 놓치면 이 정보는 <b>'+again+'일 뒤</b>에야 다시 돌아옵니다.':'')+'</p>';
    h+='<p class="tm-streak">내일 오시면 <b>연속 '+((S.streak||1)+1)+'일</b>째'+(((S.streak||1)+1)%7===0?' · 보호막 1개를 받습니다':'')+'</p>';
    if(canInstall) h+='<button class="tm-btn" type="button" id="tmInstall">내일 아침 잊지 않게 바탕화면에 추가</button>';
    h+='</div>';
  }
  var days=Object.keys(S.done).length, si=stageIndex(days), nx=STAGES[si+1];
  h+='<div class="section-title c-tree"><h2>나의 아침 나무</h2><span>My Morning Tree</span></div><div class="panel c-tree"><div class="tree-wrap"><div id="treeBox">'+treeSVG(si)+'</div><div><div class="stage-en" id="stEn">'+STAGES[si].en+'</div><div class="stage-ko" id="stKo">'+STAGES[si].ko+'</div><div class="stage-sub">'+days+'일째 가꾸는 중'+(nx?' · '+esc(nx.ko)+'까지 '+(nx.d-days)+'일':' · 마지막 단계입니다')+'</div>'+(nx?'<div class="meter"><i style="width:'+Math.round((days-STAGES[si].d)/(nx.d-STAGES[si].d)*100)+'%"></i></div>':'')+'</div></div>';
  h+='<div class="ladder">'+STAGES.map(function(t,k){ return '<span class="'+(k<si?'done':k===si?'now':'')+'">'+t.d+'일 '+t.ko+'</span>'; }).join('')+'</div>';
  if(PREVIEW) h+='<div class="preview"><label for="stageRange">미리보기 · 성장 단계</label><input type="range" id="stageRange" min="0" max="'+(STAGES.length-1)+'" value="'+si+'"></div>';
  h+='</div>';

  h+='<div class="section-title c-log"><h2>나의 두뇌 기록</h2><span>My Brain Log</span></div><div class="panel c-log"><div class="week">'+weekHTML()+'</div><div class="skills">'+skillsHTML()+'</div><p class="note">이 기기에 쌓인 내 기록입니다. 푼 날이 늘수록 분야별 정답률이 정확해집니다.</p></div>';
  h+='<div class="section-title c-league"><h2>오늘의 리그 대항전</h2><span>League Match</span></div><div id="rankBox"><div class="pending">오늘의 집계를 불러오는 중입니다.</div></div>';


  h+='<div class="section-title c-share"><h2>공유 카드</h2><span>Share &amp; invite</span></div>';
  h+='<div class="kinds" role="group" aria-label="카드 종류"><button class="kind" type="button" data-k="brag" aria-pressed="'+(S.kind!=="invite")+'">자랑 카드</button><button class="kind" type="button" data-k="invite" aria-pressed="'+(S.kind==="invite")+'">초대 카드</button></div>';
  h+='<div class="themes" role="group" aria-label="카드 디자인">'+THEMES.map(function(t){ return '<button class="theme" type="button" data-t="'+t.id+'" aria-pressed="'+(S.theme===t.id)+'"><i style="background:'+t.sw+'"></i>'+t.ko+'</button>'; }).join('')+'</div>';
  h+='<img class="shot" id="cardImg" alt="굿모님 공유 카드"><p class="lead" id="cardHelp" style="margin:12px 0 0;text-align:center"></p>';
  h+='<button class="primary" type="button" id="shareBtn">카카오톡으로 보내기</button><button class="ghost" type="button" id="copyBtn">문구와 링크 복사하기</button><div class="status" id="status" role="status"></div>';

  if(PREVIEW){
    h+='<div class="section-title"><h2>미리보기 도구</h2><span>Preview</span></div><div class="sim"><button type="button" data-sim="ok">어제까지 22일 연속</button><button type="button" data-sim="shield">하루 빠짐 · 보호막 있음</button><button type="button" data-sim="grace">이틀 빠짐 · 보호막 없음</button><button type="button" data-sim="broken">사흘 빠짐 · 기록 끊김</button></div><button class="ghost" type="button" id="againBtn">오늘 문제 다시 풀기</button>';
  }
  h+='<button class="ghost" type="button" id="genBtn">내일부터 세대 바꾸기</button>';
  app.innerHTML=h;
  var ti=document.getElementById("tmInstall"); if(ti&&window.GM_openInstall) ti.addEventListener("click",window.GM_openInstall);
  if(window.GM_tmTimer) clearInterval(window.GM_tmTimer); window.GM_tmTimer=setInterval(function(){ var c=document.getElementById("tmCount"); if(c) c.textContent=untilMidnight(); },30000);
  if(PREVIEW) document.getElementById("rankBox").innerHTML='<div class="pending">미리보기 화면입니다. 실제 사이트에서는 뉴비(10·20대), 만렙(30·40대), 명인(50·60대), 전설(70대 이상) 4개 리그로 시작하고, 리그마다 30명이 모이면 순위가 열립니다.</div>'; else if(STATS) fillStats(); else loadStats();
  paint();

  app.querySelectorAll(".kind").forEach(function(b){ b.addEventListener("click",function(){ S.kind=b.getAttribute("data-k"); save(); app.querySelectorAll(".kind").forEach(function(x){ x.setAttribute("aria-pressed",String(x===b)); }); setStatus(""); paint(); }); });
  app.querySelectorAll(".theme").forEach(function(b){ b.addEventListener("click",function(){ S.theme=b.getAttribute("data-t"); save(); app.querySelectorAll(".theme").forEach(function(x){ x.setAttribute("aria-pressed",String(x===b)); }); paint(); }); });
  document.getElementById("shareBtn").addEventListener("click",function(){ shareNow(r); });
  document.getElementById("copyBtn").addEventListener("click",function(){
    var txt=S.kind==="invite"?inviteText():shareText(r);
    try{ navigator.clipboard.writeText(txt).then(function(){ setStatus("복사했습니다. 단톡방에 붙여 넣으세요."); track("copy",{kind:S.kind||"brag"}); },function(){ setStatus("복사가 막혀 있습니다. 카드 사진을 길게 눌러 보내 주세요."); }); }catch(e){ setStatus("복사가 막혀 있습니다. 카드 사진을 길게 눌러 보내 주세요."); }
  });
  document.getElementById("genBtn").addEventListener("click",function(){ S.nextGen=true; save(); setStatus("내일 문제를 열면 세대를 다시 고를 수 있습니다."); });
  if(PREVIEW){
    var rg=document.getElementById("stageRange"); if(rg) rg.addEventListener("input",function(e){ var k=Number(e.target.value); document.getElementById("treeBox").innerHTML=treeSVG(k); document.getElementById("stEn").textContent=STAGES[k].en; document.getElementById("stKo").textContent=STAGES[k].ko; });
    app.querySelectorAll("[data-sim]").forEach(function(b){ b.addEventListener("click",function(){ var cfg={ok:[1,22,0],shield:[2,22,1],grace:[3,22,0],broken:[4,22,0]}[b.getAttribute("data-sim")]; delete S.done[TODAY]; S.last=isoOf(DAY-cfg[0]); S.streak=cfg[1]; S.shields=cfg[2]; S.best=Math.max(S.best||0,cfg[1]); S.note=""; save(); STATUS=streakStatus(); updateBadge(); run={i:0,picks:[],answered:false}; renderQuiz(); window.scrollTo(0,0); }); });
    document.getElementById("againBtn").addEventListener("click",function(){ delete S.done[TODAY]; save(); STATUS={kind:"today"}; run={i:0,picks:[],answered:false}; renderQuiz(); window.scrollTo(0,0); });
  }
  function paint(){
    var inv=S.kind==="invite";
    document.getElementById("cardHelp").textContent=inv?"아직 안 풀어 본 가족과 친구에게 보내세요.":"정답은 가려져 있습니다. 사진을 길게 눌러 저장할 수도 있습니다.";
    document.getElementById("shareBtn").textContent=inv?"카카오톡으로 초대하기":"카카오톡으로 자랑하기";
    (inv?drawInvite(S.theme):drawCard(r,S.theme)).then(function(u){ var im=document.getElementById("cardImg"); if(im) im.src=u; });
  }
}
function setStatus(t){ var s=document.getElementById("status"); if(s) s.textContent=t; }

/* ---------- 공유: 카카오 → 휴대폰 공유창 → 복사 ---------- */
function dataUrlToFile(u,name){ var b=atob(u.split(",")[1]), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return new File([a],name,{type:"image/png"}); }
function shareNow(r){
  var inv=S.kind==="invite", txt=inv?inviteText():shareText(r), img=document.getElementById("cardImg"), url=inviteUrl();
  track(inv?"share_invite":"share_brag",{});
  if(window.Kakao&&CFG.kakaoKey){
    try{
      if(!Kakao.isInitialized()) Kakao.init(CFG.kakaoKey);
      Kakao.Share.sendDefault({objectType:"feed",content:{title:inv?"Good Morning · 오늘 아침, 함께 풀어요":"Good Morning · "+genFull(S.gen)+" 대표 "+r.score+"/"+r.total+" · 연속 "+(S.streak||1)+"일",description:"5문제 · 1분 · 앱 설치 없이. 굿모님 아침 두뇌 퀴즈",imageUrl:SITE+"/og.jpg",link:{mobileWebUrl:url,webUrl:url}},buttons:[{title:"나도 풀어보기",link:{mobileWebUrl:url,webUrl:url}}]});
      return;
    }catch(e){}
  }
  if(navigator.share){
    var data={text:txt};
    try{ var f=dataUrlToFile(img.src,"goodmonim.png"); if(navigator.canShare&&navigator.canShare({files:[f]})) data.files=[f]; else data.url=url; }catch(e){ data.url=url; }
    navigator.share(data).then(function(){ setStatus("보냈습니다."); }).catch(function(){});
    return;
  }
  try{ navigator.clipboard.writeText(txt).then(function(){ setStatus("이 기기에서는 바로 보내기가 안 됩니다. 문구를 복사했으니 단톡방에 붙여 넣으세요."); }); }catch(e){ setStatus("카드 사진을 길게 눌러 저장해서 보내 주세요."); }
}

/* ---------- 카드 그리기 ---------- */
var fontsReady=null, KO_SAMPLE=LINES.map(function(l){return l.ko;}).join('')+GENS.join('')+'뉴비성장캐만렙직전베테랑명인고수전설'+'대표로 참여했습니다연속일째오늘아침함께풀어요지금순위위힘을보태주세요에서바로시작0123456789';
function loadFonts(){
  if(fontsReady) return fontsReady;
  if(!(document.fonts&&document.fonts.load)) return (fontsReady=Promise.resolve());
  fontsReady=Promise.all([document.fonts.load('italic 600 160px "Cormorant Garamond"'),document.fonts.load('600 150px "Cormorant Garamond"'),document.fonts.load('italic 500 40px "Cormorant Garamond"'),document.fonts.load('700 46px "Wanted Sans Variable"',KO_SAMPLE),document.fonts.load('500 30px "Wanted Sans Variable"',KO_SAMPLE),document.fonts.load('600 26px "Wanted Sans Variable"',KO_SAMPLE+'GOODMONIM.CO.KRTODAY’S BRAIN QUIZDAY STREAKAN INVITATION')]).catch(function(){});
  return fontsReady;
}
function runs(g,parts,x,y){ g.textAlign="left"; parts.forEach(function(p){ g.font=p[1]; g.fillStyle=p[2]; g.fillText(p[0],x,y); x+=g.measureText(p[0]).width; }); }
function spaced(g,text,x,y,gap,align){ var w=0,i,ch=Array.from(text); for(i=0;i<ch.length;i++) w+=g.measureText(ch[i]).width+(i<ch.length-1?gap:0); var cx=align==="right"?x-w:x; g.textAlign="left"; for(i=0;i<ch.length;i++){ g.fillText(ch[i],cx,y); cx+=g.measureText(ch[i]).width+gap; } }
function wrapKo(g,text,maxW){ var lines=[],cur=""; text.split(" ").forEach(function(w){ var t=cur?cur+" "+w:w; if(g.measureText(t).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=t; }); if(cur) lines.push(cur); return lines; }
function themeOf(theme){ return {
  dawn:{base:"#F3EEF6",blobs:[[160,240,760,"rgba(255,170,140,.85)"],[980,300,700,"rgba(176,156,240,.80)"],[720,1250,900,"rgba(150,196,242,.80)"],[120,1100,520,"rgba(255,214,190,.70)"]],ink:"#161B33",muted:"rgba(22,27,51,.62)",rule:"rgba(22,27,51,.22)",gold:"#B8873A",btn:"#161B33",btnInk:"#FFFFFF"},
  mist:{base:"#F4F7FB",blobs:[[200,200,700,"rgba(214,231,250,.95)"],[960,420,640,"rgba(240,222,240,.90)"],[600,1300,820,"rgba(255,228,212,.85)"]],ink:"#18213C",muted:"rgba(24,33,60,.6)",rule:"rgba(24,33,60,.2)",gold:"#A87C34",btn:"#18213C",btnInk:"#FFFFFF"},
  midnight:{base:"#0D1230",blobs:[[900,200,760,"rgba(74,96,200,.75)"],[120,1180,820,"rgba(120,70,170,.70)"],[1000,1300,520,"rgba(255,150,120,.35)"]],ink:"#F6F1E6",muted:"rgba(246,241,230,.66)",rule:"rgba(246,241,230,.25)",gold:"#E5C27C",btn:"#E5C27C",btnInk:"#0D1230"}
}[theme]; }
function bg(g,T,W,H,sx,sy){ g.fillStyle=T.base; g.fillRect(0,0,W,H); T.blobs.forEach(function(b){ var x=b[0]*sx,y=b[1]*sy,rr=b[2]*Math.max(sx,sy),gr=g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,b[3]); gr.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gr; g.fillRect(0,0,W,H); }); }
function pill(g,x,y,w,h,fill){ var r=h/2; g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fillStyle=fill; g.fill(); }

function drawCard(r,theme){
  return loadFonts().then(function(){
    var W=1080,H=1350,P=96,c=document.createElement("canvas"); c.width=W; c.height=H; var g=c.getContext("2d"), T=themeOf(theme), st=S.streak||1, gold=st>=3, ok=okList(r);
    bg(g,T,W,H,1,1);
    g.strokeStyle=gold?T.gold:T.rule; g.lineWidth=gold?3:1.5; g.strokeRect(40,40,W-80,H-80);
    g.fillStyle=T.muted; g.font='600 24px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,EN_DATE.toUpperCase(),P,128,4); spaced(g,"GOODMONIM",W-P,128,6,"right");
    g.fillStyle=T.ink; g.textAlign="left"; g.font='italic 600 196px "Cormorant Garamond", serif'; g.fillText("Good",P-6,372); g.fillText("Morning",P-6,540);
    g.font='700 48px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; var y=650; wrapKo(g,LINE.ko,W-2*P).forEach(function(l){ g.fillText(l,P,y); y+=70; });
    g.fillStyle=T.muted; g.font='italic 500 42px "Cormorant Garamond", serif'; g.fillText(LINE.en,P,y+4);
    var ry=Math.max(y+70,880); g.strokeStyle=T.rule; g.lineWidth=1.5; g.beginPath(); g.moveTo(P,ry); g.lineTo(W-P,ry); g.stroke();
    g.fillStyle=T.muted; g.font='600 22px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,"TODAY’S BRAIN QUIZ",P,ry+62,5);
    g.fillStyle=T.ink; g.font='600 170px "Cormorant Garamond", serif'; g.textAlign="left"; g.fillText(String(r.score),P-4,ry+222);
    var sw=g.measureText(String(r.score)).width; g.fillStyle=T.muted; g.font='500 64px "Cormorant Garamond", serif'; g.fillText("/ "+r.total,P+sw+10,ry+222);
    ok.forEach(function(v,i){ g.beginPath(); g.arc(P+14+i*44,ry+272,12,0,Math.PI*2); g.lineWidth=2.5; g.strokeStyle=T.ink; if(v){ g.fillStyle=T.ink; g.fill(); } g.stroke(); });
    g.fillStyle=T.muted; g.font='600 22px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,"DAY STREAK",W-P,ry+62,5,"right");
    g.fillStyle=gold?T.gold:T.ink; g.font='600 170px "Cormorant Garamond", serif'; g.textAlign="right"; g.fillText(String(st),W-P,ry+222);
    g.font='italic 600 40px "Cormorant Garamond", serif'; g.fillText(streakTitle(st),W-P,ry+282);
    runs(g,[[GEN_KO[S.gen],'700 40px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.ink],[" "+S.gen+"  ",'500 22px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.muted],["대표로 참여했습니다",'700 32px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.ink]],P,H-128);
    g.fillStyle=T.muted; g.font='italic 500 34px "Cormorant Garamond", serif'; g.fillText("Proudly playing for Team "+GEN_EN[S.gen],P,H-84);
    g.font='600 22px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,"GOODMONIM.CO.KR",W-P,H-128,4,"right");
    return c.toDataURL("image/png");
  });
}
function drawInvite(theme){
  return loadFonts().then(function(){
    var W=1080,H=1350,P=96,c=document.createElement("canvas"); c.width=W; c.height=H; var g=c.getContext("2d"), T=themeOf(theme);
    bg(g,T,W,H,1,1);
    g.strokeStyle=T.gold; g.lineWidth=3; g.strokeRect(40,40,W-80,H-80); g.lineWidth=1; g.strokeRect(54,54,W-108,H-108);
    g.fillStyle=T.muted; g.font='600 24px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,"AN INVITATION",P,136,6); spaced(g,EN_DATE.toUpperCase(),W-P,136,4,"right");
    g.fillStyle=T.ink; g.textAlign="left"; g.font='italic 600 128px "Cormorant Garamond", serif'; g.fillText("Good Morning,",P-4,330);
    g.font='700 72px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; g.fillText("오늘 아침,",P,480); g.fillText("함께 풀어요.",P,575);
    g.fillStyle=T.muted; g.font='italic 500 46px "Cormorant Garamond", serif'; g.fillText("Join me for today’s morning quiz.",P,650);
    var ry=730; g.strokeStyle=T.rule; g.lineWidth=1.5; g.beginPath(); g.moveTo(P,ry); g.lineTo(W-P,ry); g.stroke();
    [["5","Questions","오늘의 문제"],["1","Minute","걸리는 시간"],["0","Apps","설치할 앱"]].forEach(function(rw,i){ var x=P+i*300; g.fillStyle=T.ink; g.font='600 120px "Cormorant Garamond", serif'; g.fillText(rw[0],x,ry+150); var nw=g.measureText(rw[0]).width; g.font='italic 500 40px "Cormorant Garamond", serif'; g.fillText(rw[1],x+nw+12,ry+150); g.fillStyle=T.muted; g.font='500 28px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; g.fillText(rw[2],x,ry+200); });
    runs(g,[[GEN_KO[S.gen],'700 48px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.ink],[" "+S.gen+"  ",'500 24px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.muted],["대표가 보내는 아침 초대장",'700 40px "Wanted Sans Variable", "Pretendard Variable", sans-serif',T.ink]],P,ry+310);
    pill(g,P,H-250,W-2*P,104,T.btn); g.fillStyle=T.btnInk; g.textAlign="center"; g.font='700 40px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; g.fillText("goodmonim.co.kr 에서 바로 시작",W/2,H-184);
    g.textAlign="left"; g.fillStyle=T.muted; g.font='italic 500 34px "Cormorant Garamond", serif'; g.fillText("With love, from Team "+GEN_EN[S.gen],P,H-100);
    g.font='600 22px "Wanted Sans Variable", "Pretendard Variable", sans-serif'; spaced(g,"GOODMONIM",W-P,H-102,6,"right");
    return c.toDataURL("image/png");
  });
}

/* ---------- 시작 ---------- */
function start(){
  if(S.nextGen&&!S.done[TODAY]){ delete S.gen; delete S.nextGen; save(); }
  if(!S.gen) renderGen(); else if(S.done[TODAY]) renderResult(); else renderQuiz();
}
start();
})();
