/* 아침 알림 켜기/끄기 — 매일 아침 7시 1번, 안 푼 날 밤 9시 1번만 보냅니다 */
(function(){
var KEY=(window.GM_CONFIG||{}).vapidPublic||"", PREVIEW=!!window.GM_FORCE_PREVIEW;
var UA=navigator.userAgent, isIOS=/iPhone|iPad|iPod/.test(UA)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
var standalone=(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
var supported=!PREVIEW && KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
function st(){ try{ return JSON.parse(localStorage.getItem("goodmonim.v3")||"{}"); }catch(e){ return {}; } }
function on(){ try{ return localStorage.getItem("gm.push")==="1"; }catch(e){ return false; } }
function setOn(v){ try{ if(v) localStorage.setItem("gm.push","1"); else localStorage.removeItem("gm.push"); }catch(e){} }
function track(type){ try{ var S=st(); var b=JSON.stringify({type:type,device:S.device||null,gen:S.gen||null,day:new Date(Date.now()+9*3600e3).toISOString().slice(0,10)}); navigator.sendBeacon&&navigator.sendBeacon("/api/event",new Blob([b],{type:"application/json"})); }catch(e){} }
function keyBytes(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
function save(sub){ var S=st(); return fetch("/api/push/subscribe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sub:sub.toJSON(),device:S.device||null,sync:S.sync||null,gen:S.gen||null})}); }
function subscribe(){
  return Notification.requestPermission().then(function(p){
    if(p!=="granted") throw new Error("denied");
    return navigator.serviceWorker.ready;
  }).then(function(reg){
    return reg.pushManager.getSubscription().then(function(s){ return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(KEY)}); });
  }).then(function(sub){ return save(sub).then(function(){ setOn(true); track("push_on"); }); });
}
function unsubscribe(){
  return navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription(); }).then(function(s){
    if(!s) return; var ep=s.endpoint; return s.unsubscribe().then(function(){ return fetch("/api/push/unsubscribe",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({endpoint:ep})}); });
  }).then(function(){ setOn(false); track("push_off"); });
}
/* 결과 화면 '내일 아침 공개' 카드 안에 들어가는 버튼 */
window.GM_pushCard=function(){
  if(PREVIEW) return "";
  if(!supported){
    if(isIOS && !standalone) return '<p class="tm-push-note">바탕화면에 추가하면 <b>매일 아침 7시 알림</b>도 받을 수 있어요.</p>';
    return "";
  }
  if(Notification.permission==="denied") return "";
  if(Notification.permission==="granted" && on()) return '<p class="tm-push-note">🔔 매일 아침 7시에 알려 드리고 있어요.</p>';
  return '<button class="tm-btn tm-push" type="button" id="pushOn">🔔 매일 아침 7시 알림 받기</button><p class="tm-push-note">아침 1번, 안 푼 날 밤 9시 1번만 보냅니다.</p>';
};
window.GM_bindPush=function(){
  var b=document.getElementById("pushOn"); if(!b) return;
  b.addEventListener("click",function(){
    b.disabled=true; b.textContent="알림을 켜는 중…";
    subscribe().then(function(){ b.outerHTML='<p class="tm-push-note"><b>알림을 켰어요.</b> 내일 아침 7시에 알려 드릴게요.</p>'; })
      .catch(function(){ b.disabled=false; b.textContent="🔔 매일 아침 7시 알림 받기"; if(Notification.permission==="denied") b.outerHTML='<p class="tm-push-note">알림이 막혀 있어요. 휴대폰 설정에서 굿모님 알림을 허용해 주세요.</p>'; });
  });
};
/* 아래쪽 '알림 끄기' 링크 */
document.addEventListener("DOMContentLoaded",function(){
  var f=document.getElementById("pushOff"); if(!f) return;
  if(supported && on() && Notification.permission==="granted"){ f.hidden=false; f.addEventListener("click",function(e){ e.preventDefault(); unsubscribe().then(function(){ f.textContent="알림을 껐습니다"; }); }); }
});
/* 켜 둔 사람은 하루 한 번 구독 정보를 새로 맞춰 둠 (세대·기록 번호 변경, 브라우저가 구독을 바꾼 경우) */
if(supported && on() && Notification.permission==="granted"){
  var t=new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
  try{ if(localStorage.getItem("gm.pushSync")!==t){ navigator.serviceWorker.ready.then(function(reg){ return reg.pushManager.getSubscription().then(function(s){ return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(KEY)}); }); }).then(function(s){ return save(s); }).then(function(){ localStorage.setItem("gm.pushSync",t); }).catch(function(){}); } }catch(e){}
}
if(/[?&]src=push\b/.test(location.search)) track("push_click");
})();
