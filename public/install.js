/* 굿모님 홈 화면 추가: 갤럭시(크롬·삼성 인터넷), 아이폰(사파리·크롬), 카카오톡 안에서 열었을 때까지 */
(function(){
"use strict";
var UA = navigator.userAgent || "";
var isIOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
var isKakao = /KAKAOTALK/i.test(UA);
var isInApp = isKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(UA);
var isSamsung = /SamsungBrowser/i.test(UA);
var isAndroid = /Android/i.test(UA);
var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
var PREVIEW = !!window.GM_FORCE_PREVIEW || /[?&]preview=1/.test(location.search);
var deferred = null;

function track(type){
  if(PREVIEW) return;
  try{ var S=JSON.parse(localStorage.getItem("goodmonim.v3")||"{}");
    var body=JSON.stringify({type:type,device:S.device||null,gen:S.gen||null,day:new Date(Date.now()+9*3600e3).toISOString().slice(0,10)});
    if(navigator.sendBeacon) navigator.sendBeacon("/api/event",new Blob([body],{type:"application/json"}));
  }catch(e){}
}

if("serviceWorker" in navigator && !PREVIEW && (location.protocol === "https:" || location.hostname === "localhost")){
  window.addEventListener("load", function(){ navigator.serviceWorker.register("/sw.js").catch(function(){}); });
}
window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); deferred = e; });
window.addEventListener("appinstalled", function(){ track("install_done"); hideCard(); try{ localStorage.setItem("gm.installed","1"); }catch(e){} });
if(standalone && /[?&]src=home/.test(location.search)) track("home_launch");

function later(){ try{ return Number(localStorage.getItem("gm.installLater")||0) > Date.now(); }catch(e){ return false; } }
function installedBefore(){ try{ return localStorage.getItem("gm.installed")==="1"; }catch(e){ return false; } }

/* 결과 화면에 넣는 안내 카드 */
window.GM_installCard = function(){
  if(standalone || later() || installedBefore()) return "";
  return '<div class="install" id="installCard"><img src="/icon-192.png" alt=""><div><strong>내일 아침, 아이콘 한 번에 바로</strong><span>휴대폰 바탕화면에 굿모님을 놓아 드립니다. 앱 설치가 아니라 저장 공간을 거의 쓰지 않습니다.</span></div>'
    + '<button class="primary" type="button" id="installBtn">바탕화면에 굿모님 추가하기</button><button class="later" type="button" id="installLater">다음에 할게요</button></div>';
};
window.GM_bindInstall = function(){
  var b=document.getElementById("installBtn"), l=document.getElementById("installLater");
  if(b) b.addEventListener("click", startInstall);
  if(l) l.addEventListener("click", function(){ try{ localStorage.setItem("gm.installLater", String(Date.now()+3*864e5)); }catch(e){} hideCard(); });
};
function hideCard(){ var c=document.getElementById("installCard"); if(c) c.remove(); }

function startInstall(){
  track("install_click");
  if(deferred){
    deferred.prompt();
    deferred.userChoice.then(function(r){ if(r && r.outcome==="accepted"){ track("install_done"); hideCard(); } deferred=null; }).catch(function(){});
    return;
  }
  if(isInApp) return sheet(inAppSteps());
  if(isIOS) return sheet(iosSteps());
  if(isSamsung) return sheet(samsungSteps());
  return sheet(androidSteps());
}

/* 단계 안내 시트 */
var SHARE='<span class="ico" aria-label="공유 버튼"><svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V1.5M4.5 5 8 1.5 11.5 5"/><path d="M5 8H2.5v8.5h11V8H11"/></svg></span>';
var PLUS='<span class="ico" aria-label="더하기"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="1.5" y="1.5" width="13" height="13" rx="3"/><path d="M8 5v6M5 8h6"/></svg></span>';
var MENU='<span class="ico" aria-label="메뉴 버튼"><svg width="16" height="14" viewBox="0 0 16 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2h12M2 7h12M2 12h12"/></svg></span>';
var DOTS='<span class="ico" aria-label="점 세 개 버튼"><svg width="6" height="16" viewBox="0 0 6 16" fill="currentColor"><circle cx="3" cy="2.5" r="1.6"/><circle cx="3" cy="8" r="1.6"/><circle cx="3" cy="13.5" r="1.6"/></svg></span>';
function iosSteps(){ return {t:"아이폰 바탕화면에 추가하기", p:"세 번만 누르면 됩니다.", s:["화면 아래(또는 위)의 공유 버튼 "+SHARE+"을 누르세요","목록을 조금 올려 "+PLUS+" <strong>홈 화면에 추가</strong>를 누르세요","오른쪽 위 <strong>추가</strong>를 누르면 끝입니다"]}; }
function samsungSteps(){ return {t:"갤럭시 바탕화면에 추가하기", p:"삼성 인터넷에서는 이렇게 하시면 됩니다.", s:["화면 아래 오른쪽 메뉴 "+MENU+"를 누르세요","<strong>현재 페이지 추가</strong>를 누르세요","<strong>홈 화면</strong>을 고르면 끝입니다"]}; }
function androidSteps(){ return {t:"바탕화면에 추가하기", p:"크롬에서는 이렇게 하시면 됩니다.", s:["오른쪽 위 "+DOTS+" 버튼을 누르세요","<strong>홈 화면에 추가</strong>를 누르세요","<strong>설치</strong> 또는 <strong>추가</strong>를 누르면 끝입니다"]}; }
function inAppSteps(){
  return {t:"먼저 기본 브라우저로 열어 주세요", p:"카카오톡 안에서는 바탕화면 추가가 되지 않습니다. 아래 버튼을 누르면 "+(isIOS?"사파리로":"인터넷 앱으로")+" 열리고, 거기서 바로 추가할 수 있습니다.", s:[], btn:"기본 브라우저로 열기", go:function(){
    var url=location.origin+"/?install=1";
    if(isKakao){ location.href="kakaotalk://web/openExternal?url="+encodeURIComponent(url); return; }
    if(isAndroid){ location.href="intent://"+location.host+"/?install=1#Intent;scheme=https;end"; return; }
    location.href=url;
  }};
}
function sheet(o){
  var bg=document.createElement("div"); bg.className="sheet-bg"; bg.setAttribute("role","dialog"); bg.setAttribute("aria-modal","true"); bg.setAttribute("aria-label",o.t);
  var h='<div class="sheet"><h3>'+o.t+'</h3><p>'+o.p+'</p>';
  if(o.s.length) h+='<ol>'+o.s.map(function(x,i){ return '<li><b>'+(i+1)+'</b><span>'+x+'</span></li>'; }).join('')+'</ol>';
  h+='<button class="primary" type="button" id="sheetMain">'+(o.btn||"알겠습니다")+'</button></div>';
  bg.innerHTML=h; document.body.appendChild(bg);
  var close=function(){ bg.remove(); };
  bg.addEventListener("click", function(e){ if(e.target===bg) close(); });
  document.getElementById("sheetMain").addEventListener("click", function(){ if(o.go) o.go(); close(); });
  document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){ close(); document.removeEventListener("keydown",esc); } });
  document.getElementById("sheetMain").focus();
}

/* 카카오톡에서 "기본 브라우저로 열기"를 누르고 넘어온 경우: 바로 안내 */
if(/[?&]install=1/.test(location.search) && !standalone){
  window.addEventListener("load", function(){ setTimeout(function(){ if(deferred) startInstall(); else if(isIOS) sheet(iosSteps()); else if(isSamsung) sheet(samsungSteps()); else sheet(androidSteps()); }, 600); });
}
window.GM_openInstall = startInstall;
})();
