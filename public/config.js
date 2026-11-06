/* 운영 설정: 카카오 JavaScript 키를 넣으면 카카오톡 공유 버튼이 켜집니다. */
window.GM_CONFIG = {
  siteUrl: "https://goodmonim.co.kr",
  kakaoKey: ""   // 예: "abcdef1234..." (카카오 개발자 사이트 > 내 애플리케이션 > 앱 키 > JavaScript 키)
};
(function(){ if(!window.GM_CONFIG.kakaoKey) return; var s=document.createElement("script"); s.src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"; s.crossOrigin="anonymous"; document.head.appendChild(s); })();
