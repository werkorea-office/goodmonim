/* 굿모님 출제 엔진
   - 원칙 1: 가장 오래전에 나온 문제부터 낸다 (한 번도 안 나온 문제가 최우선).
   - 원칙 2: 문제는 '추가만' 한다. 각 문제에는 처음 낼 수 있는 날(s)이 붙어 있어,
             나중에 문제를 늘려도 지난날의 출제 기록이 바뀌지 않는다.
   - 원칙 3: 계산 문제는 숫자 조합을 미리 정해 두고 돌아가며 내서, 1년 안에 같은 문제가 없다.
   - 배포 전에 scripts/validate-bank.mjs 가 1년치를 미리 돌려 보고, 반복이 있으면 배포를 막는다. */
(function(root){
var LAUNCH="2026-11-07", EPOCH="2026-11-14";
function dayNo(iso){ return Math.floor(Date.parse(iso+"T00:00:00Z")/864e5); }
var D_LAUNCH=dayNo(LAUNCH), D_EPOCH=dayNo(EPOCH);
var KO_DOW=["일","월","화","수","목","금","토"];
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; var t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function fmt(n){ return Number(n).toLocaleString("ko-KR"); }
function shuffleQ(q,opts,e,R){ var order=[0,1,2,3].map(function(i){ return [R(),i]; }).sort(function(a,b){ return a[0]-b[0]; }).map(function(x){ return x[1]; }); return {q:q,o:order.map(function(i){ return opts[i]; }),a:order.indexOf(0),e:e}; }
function numOpts(q,ans,dis,e,R,unit){
  unit=unit||""; var seen={}, list=[ans]; seen[ans]=1;
  dis.forEach(function(v){ if(v>0&&!seen[v]){ seen[v]=1; list.push(v); } });
  var b=1; while(list.length<4){ var v=ans+(b%2?1:-1)*Math.ceil(b/2)*(ans>=1000?100:1); if(v>0&&!seen[v]){ seen[v]=1; list.push(v); } b++; }
  return shuffleQ(q,list.slice(0,4).map(function(v){ return fmt(v)+unit; }),e,R);
}

/* ---------- 문제 묶음 (예전 문제 + 추가 문제) ---------- */
var BANK=root.GM_BANK||{A:[],B:[],C:[],BONUS:{},GENS:[]}, B2=root.GM_BANK2||{A:[],B:[],C:[],BONUS:{}};
function withSince(list,s){ return list.map(function(q){ return {q:q.q,o:q.o,a:q.a,e:q.e,s:s}; }); }
function pool(cat,gen){
  if(cat==="BONUS") return withSince(BANK.BONUS[gen]||[],D_LAUNCH).concat(B2.BONUS&&B2.BONUS[gen]||[]);
  return withSince(BANK[cat]||[],D_LAUNCH).concat(B2[cat]||[]);
}
/* 예전 방식으로 낸 기록 (출시일 ~ 새 엔진 시작 전날) */
function legacyLast(cat,n){
  var last={}, mod=(cat==="A"||cat==="B")?28:cat==="C"?42:5;
  for(var d=D_LAUNCH; d<D_EPOCH; d++){
    if(cat==="C"){ last[d%mod]=d; last[(d+21)%mod]=d; } else last[d%mod]=d;
  }
  return last;
}
/* 가장 오래전에 나온 문제부터: 시작일부터 오늘까지 출제 기록을 그대로 다시 계산 */
var CACHE={};
function schedule(cat,gen,upto){
  var key=cat+"|"+(gen||"")+"|"+upto; if(CACHE[key]) return CACHE[key];
  var items=pool(cat,gen), n=items.length, last=new Array(n), L=legacyLast(cat,n), seq=[];
  for(var i=0;i<n;i++) last[i]=(L[i]!=null && i<((cat==="BONUS")?5:(cat==="C"?42:28)))?L[i]:-1e9;
  for(var d=D_EPOCH; d<=upto; d++){
    var best=-1;
    for(var j=0;j<n;j++){ var it=items[j]; if(it.s>d || (it.r!=null && d>=it.r)) continue; if(best<0 || last[j]<last[best]) best=j; }
    if(best<0){ seq.push(null); continue; }
    last[best]=d; seq.push(best);
  }
  var out={items:items,seq:seq}; CACHE[key]=out; return out;
}
function pick(cat,gen,day){ var s=schedule(cat,gen,day), idx=s.seq[day-D_EPOCH]; return idx==null?null:s.items[idx]; }

/* ---------- 계산 문제: 미리 정한 숫자 조합을 겹치지 않게 돌아가며 ---------- */
function range(a,b,step){ var r=[]; for(var x=a;x<=b;x+=(step||1)) r.push(x); return r; }
function cross(){ var args=[].slice.call(arguments), out=[[]]; args.forEach(function(arr){ var nx=[]; out.forEach(function(p){ arr.forEach(function(v){ nx.push(p.concat([v])); }); }); out=nx; }); return out; }
function coprimeStep(n){ var p=[97,89,83,79,73,71,67,61,59,53,47,43,41,37,31,29]; for(var i=0;i<p.length;i++){ if(n%p[i]!==0) return p[i]; } return 1; }
function tupleAt(list,k,salt){ var n=list.length, step=coprimeStep(n); return list[((k*step)+salt)%n]; }
var FRUIT=["귤","사과","배","감","복숭아","자두"];
var BRAIN=[
  {t:cross(range(2,15),range(2,12)), f:function(p,R){ var a=p[0],d=p[1],s=[a,a+d,a+2*d,a+3*d],ans=a+4*d; return numOpts(s.join(", ")+", 다음 숫자는?",ans,[ans+1,ans-2,ans+d],"앞의 숫자에 "+d+"씩 더합니다. "+s[3]+" + "+d+" = "+ans,R); }},
  {t:cross(range(1,9),[2,3],range(1,4)), f:function(p,R){ var a=p[0],m=p[1],c=p[2],s=[a]; for(var i=0;i<3;i++) s.push(s[i]*m+c); var ans=s[3]*m+c; return numOpts(s.join(", ")+", 다음 숫자는?",ans,[s[3]*m,ans+c,ans-1],"앞의 숫자에 "+m+"를 곱하고 "+c+"를 더합니다. "+s[3]+" × "+m+" + "+c+" = "+ans,R); }},
  {t:(function(){ var r=[]; range(1,8).forEach(function(x){ range(x,x+7).forEach(function(y){ r.push([x,y]); }); }); return r; })(), f:function(p,R){ var f=[p[0],p[1]]; for(var i=0;i<4;i++) f.push(f[f.length-1]+f[f.length-2]); var ans=f[f.length-1]+f[f.length-2]; return numOpts(f.join(", ")+", 다음 숫자는?",ans,[ans-1,ans+2,f[f.length-1]*2],"앞의 두 숫자를 더합니다. "+f[f.length-2]+" + "+f[f.length-1]+" = "+ans,R); }},
  {t:cross(range(1,20),range(1,4)), f:function(p,R){ var s=[p[0]], g=p[1]; for(var i=0;i<4;i++) s.push(s[i]+g+i); var ans=s[4]+g+4; return numOpts(s.join(", ")+", 다음 숫자는?",ans,[ans-1,ans+1,s[4]+g+3+2],"더하는 수가 "+g+", "+(g+1)+", "+(g+2)+"…처럼 1씩 커집니다. "+s[4]+" + "+(g+4)+" = "+ans,R); }},
  {t:(function(){ var r=[]; range(1,9).forEach(function(a){ range(2,4).forEach(function(p){ range(a+5,a+12).forEach(function(b){ r.push([a,p,b]); }); }); }); return r; })(), f:function(p,R){ var a=p[0],d=p[1],b=p[2], s=[a,b,a+d,b+d,a+2*d,b+2*d], ans=a+3*d; return numOpts(s.join(", ")+", 다음 숫자는?",ans,[b+3*d,ans+1,ans-1],"홀수 번째 숫자끼리 "+d+"씩 커집니다. "+(a+2*d)+" + "+d+" = "+ans,R); }},
  {t:cross(range(50,120),range(3,9)), f:function(p,R){ var s0=p[0],d=p[1], s=[s0,s0-d,s0-2*d,s0-3*d], ans=s0-4*d; return numOpts(s.join(", ")+", 다음 숫자는?",ans,[ans+1,ans-1,ans-d],"앞의 숫자에서 "+d+"씩 뺍니다. "+s[3]+" − "+d+" = "+ans,R); }}
];
function ampm(h,m){ var hh=((h%24)+24)%24, ap=hh<12?"오전":"오후", h12=hh%12===0?12:hh%12; return ap+" "+h12+"시"+(m?" "+m+"분":""); }
var LIFE=[
  {t:range(11,99).map(function(k){ return [k]; }), f:function(p,R){ var price=p[0]*100, ans=10000-price; return numOpts(fmt(price)+"원짜리 물건을 사고 1만 원을 냈습니다. 거스름돈은?",ans,[ans+100,ans-100,ans+1000],"10,000 − "+fmt(price)+" = "+fmt(ans)+"원",R,"원"); }},
  {t:cross(range(7,18),[0,15,30,45],[35,45,50,55,65,70,75,80,85,95,100,110]), f:function(p,R){ var h=p[0],m=p[1],a=p[2], tot=h*60+m+a, ah=Math.floor(tot/60), am=tot%60;
      var opts=[ampm(ah,am),ampm(ah,(am+10)%60),ampm(ah+1,am),ampm(ah-1,am)]; return shuffleQ(ampm(h,m)+"에 출발해 "+a+"분 걸렸습니다. 도착 시각은?",opts,ampm(h,m)+"에서 "+a+"분(= "+Math.floor(a/60)+"시간 "+(a%60)+"분) 뒤는 "+ampm(ah,am)+"입니다.",R); }},
  {t:cross(range(0,6),range(8,40)), f:function(p,R){ var w=p[0],n=p[1],aw=(w+n)%7; var opts=[aw,(aw+1)%7,(aw+6)%7,(aw+3)%7].map(function(k){ return KO_DOW[k]+"요일"; });
      return shuffleQ("오늘이 "+KO_DOW[w]+"요일이면 "+n+"일 뒤는 무슨 요일?",opts,"7일마다 같은 요일이 돌아옵니다. "+n+"일 = 7×"+Math.floor(n/7)+" + "+(n%7)+"일이라 "+KO_DOW[aw]+"요일입니다.",R); }},
  {t:cross(range(0,FRUIT.length-1),range(3,20),range(2,4),range(2,4)), f:function(p,R){ var name=FRUIT[p[0]],unit=p[1]*100,k=p[2],t=p[3],c=unit*k,ans=c*t; return numOpts(name+" "+k+"개에 "+fmt(c)+"원이면 "+(k*t)+"개는 얼마?",ans,[ans-c,ans+c,ans+unit],(k*t)+"개는 "+k+"개 묶음이 "+t+"개입니다. "+fmt(c)+" × "+t+" = "+fmt(ans)+"원",R,"원"); }},
  {t:cross(range(10,90),[10,20,30,50]), f:function(p,R){ var price=p[0]*1000,r=p[1],ans=price*(100-r)/100; return numOpts(fmt(price)+"원짜리 옷을 "+r+"% 할인하면 얼마?",ans,[price*r/100,ans+1000,ans-1000],fmt(price)+"원의 "+r+"%는 "+fmt(price*r/100)+"원이라 "+fmt(price)+" − "+fmt(price*r/100)+" = "+fmt(ans)+"원",R,"원"); }},
  {t:cross(range(1945,1995),range(3,17)), f:function(p,R){ var y=p[0],g=p[1]; return numOpts(y+"년생과 "+(y+g)+"년생은 몇 살 차이일까요?",g,[g+1,g-1,g+2],(y+g)+" − "+y+" = "+g+"살 차이입니다.",R,"살"); }}
];
function famQ(fam,n,salt){ var t=n%fam.length, k=Math.floor(n/fam.length), T=fam[t]; return T.f(tupleAt(T.t,k,salt), rng(n*7919+salt*31+13)); }

/* ---------- 예전 계산 문제 (새 엔진 시작 전날까지 그대로 재현) ---------- */
function legacyMath(day){
  var R=rng(day*7919+13), pickN=function(a,b){ return a+Math.floor(R()*(b-a+1)); }, type=day%7, q, ans, e, unit="", dis=[];
  if(type===0){ var a=pickN(1,3), r=pickN(2,3), s=[a,a*r,a*r*r,a*r*r*r]; ans=a*r*r*r*r; q=s.join(", ")+", 다음 숫자는?"; e="앞의 숫자에 "+r+"를 곱합니다. "+s[3]+" × "+r+" = "+ans; dis=[ans-r, ans+a*r, s[3]+r*r]; }
  else if(type===1){ var a1=pickN(2,9), d=pickN(3,9), s1=[a1,a1+d,a1+2*d,a1+3*d]; ans=a1+4*d; q=s1.join(", ")+", 다음 숫자는?"; e="앞의 숫자에 "+d+"씩 더합니다. "+s1[3]+" + "+d+" = "+ans; dis=[ans+1, ans-2, ans+d]; }
  else if(type===2){ var x=pickN(1,4), y=pickN(x,6), f=[x,y]; for(var i=0;i<4;i++) f.push(f[f.length-1]+f[f.length-2]); ans=f[f.length-1]+f[f.length-2]; q=f.join(", ")+", 다음 숫자는?"; e="앞의 두 숫자를 더합니다. "+f[f.length-2]+" + "+f[f.length-1]+" = "+ans; dis=[ans-1, ans+2, f[f.length-1]*2]; }
  else if(type===3){ var w=pickN(0,6), n=pickN(8,20), aw=(w+n)%7; q="오늘이 "+KO_DOW[w]+"요일이면 "+n+"일 뒤는 무슨 요일?"; e="7일마다 같은 요일이 돌아옵니다. "+n+"일 = 7×"+Math.floor(n/7)+" + "+(n%7)+"일이라 "+KO_DOW[aw]+"요일입니다.";
    var opts=[aw,(aw+1)%7,(aw+6)%7,(aw+3)%7].map(function(k){ return KO_DOW[k]+"요일"; }); return shuffleQ(q,opts,e,R); }
  else if(type===4){ var p=pickN(3,20)*100, k=pickN(2,4), t=pickN(2,4), c=p*k; ans=c*t; q="귤 "+k+"개에 "+fmt(c)+"원이면 "+(k*t)+"개는 얼마?"; e=(k*t)+"개는 "+k+"개 묶음이 "+t+"개입니다. "+fmt(c)+" × "+t+" = "+fmt(ans)+"원"; unit="원"; dis=[ans-c, ans+c, ans+p]; }
  else if(type===5){ var h=pickN(1,5); ans=h*30; q="시계가 정확히 "+h+"시일 때 두 바늘 사이의 작은 각도는?"; e="한 시간 칸은 30도입니다. "+h+"칸이니 "+ans+"도입니다."; unit="도"; dis=[ans+30, ans+60, ans===30?45:ans-30]; }
  else { var m=pickN(6,15); ans=m*(m+1)/2; q="1부터 "+m+"까지 모두 더하면?"; e="(1 + "+m+") × "+m+" ÷ 2 = "+ans; dis=[ans-m, ans+m, ans+1]; }
  var seen={}; seen[ans]=1; var list=[ans]; dis.forEach(function(v){ if(v>0&&!seen[v]){ seen[v]=1; list.push(v); } }); var bump=1; while(list.length<4){ var v2=ans+bump*(bump%2?1:-1)*3; if(v2>0&&!seen[v2]){ seen[v2]=1; list.push(v2); } bump++; }
  return shuffleQ(q, list.slice(0,4).map(function(v){ return fmt(v)+unit; }), e, R);
}

/* 출시 첫 주(예전 방식)에 이미 낸 계산 문제와 같은 숫자 조합은 목록에서 뺀다 */
(function(){ var used={}; for(var d=D_LAUNCH; d<D_EPOCH; d++) used[legacyMath(d).q]=1;
  [BRAIN,LIFE].forEach(function(fam){ fam.forEach(function(T){ T.t=T.t.filter(function(p){ return !used[T.f(p,rng(1)).q]; }); }); }); })();

/* ---------- 하루치 문제 ---------- */
function setFor(day,gen){
  if(day<D_EPOCH){
    var A=BANK.A,B=BANK.B,C=BANK.C, qs=[A[day%A.length],B[day%B.length],C[day%C.length],legacyMath(day),C[(day+21)%C.length]];
    var en=["Proverbs","Spelling","Knowledge","Brain Math","Knowledge"], ko=["속담·우리말","맞춤법","상식","두뇌 계산","상식"], bp=BANK.BONUS[gen]||[];
    if(bp.length){ qs.push(bp[day%bp.length]); en.push("Memory Lane"); ko.push(gen+" 추억 문제"); }
    return {qs:qs,en:en,ko:ko};
  }
  var n=day-D_EPOCH, strip=function(x){ return x?{q:x.q,o:x.o,a:x.a,e:x.e}:null; };
  var qs=[strip(pick("A",null,day)),strip(pick("B",null,day)),strip(pick("C",null,day)),famQ(BRAIN,n,0),famQ(LIFE,n,5)];
  var en=["Proverbs","Spelling","Knowledge","Brain Math","Everyday Math"], ko=["속담·우리말","맞춤법","상식","두뇌 계산","생활 계산"];
  var bq=gen?strip(pick("BONUS",gen,day)):null;
  if(bq){ qs.push(bq); en.push("Memory Lane"); ko.push(gen+" 추억 문제"); }
  return {qs:qs,en:en,ko:ko};
}
root.GM_ENGINE={setFor:setFor,dayNo:dayNo,EPOCH:EPOCH,LAUNCH:LAUNCH,_pool:pool,_schedule:schedule,_BRAIN:BRAIN,_LIFE:LIFE};
})(typeof window!=="undefined"?window:globalThis);
