// 바탕화면에 추가할 때 이 사람의 기록 번호를 시작 주소에 넣어 둡니다 (아이폰은 사파리와 아이콘 저장소가 따로라서)
const BASE = {"name": "굿모님 아침 두뇌 퀴즈", "short_name": "굿모님", "description": "매일 아침 5문제, 1분. 세대 리그와 연속 출석.", "id": "/", "start_url": "/?src=home", "scope": "/", "display": "standalone", "orientation": "portrait", "background_color": "#F6F7FA", "theme_color": "#F6F7FA", "lang": "ko", "icons": [{"src": "/icon-192.png?v=3", "sizes": "192x192", "type": "image/png", "purpose": "any"}, {"src": "/icon-512.png?v=3", "sizes": "512x512", "type": "image/png", "purpose": "any"}, {"src": "/icon-maskable-512.png?v=3", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]};
export async function onRequestGet({ request }){
  const m = (request.headers.get("cookie")||"").match(/(?:^|;\s*)gm_r=([a-z0-9]{12})/);
  const body = Object.assign({}, BASE, { start_url: m ? "/?src=home&r=" + m[1] : BASE.start_url });
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-store" } });
}
