/* 굿모님 서비스 워커: 홈 화면 설치 + 전파가 약할 때도 첫 화면이 열리게 */
const V = "gm-v15";
const CORE = ["/", "/app.js", "/bank.js", "/bank2.js", "/engine.js", "/push.js", "/money.js", "/family.js", "/config.js", "/icon-192.png", "/fonts/wanted/WantedSansVariable.css", "/fonts/pretendard/pretendardvariable-dynamic-subset.css"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/") || u.pathname.startsWith("/admin") || u.pathname === "/manifest.webmanifest") return;
  if (u.pathname.startsWith("/fonts/") || /\.(png|jpg|woff2)$/.test(u.pathname)) {
    // 글꼴·그림: 저장본 우선
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; })));
    return;
  }
  // 화면·문제: 항상 최신 우선, 안 되면 저장본
  e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
});

/* 아침 알림 받기 */
self.addEventListener("push", e => {
  let m = {}; try { m = e.data ? e.data.json() : {}; } catch (x) { m = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(m.title || "굿모님", { body: m.body || "오늘의 문제가 열렸어요", icon: "/icon-192.png?v=3", badge: "/icon-192.png?v=3", tag: m.tag || "gm", data: { url: m.url || "/?src=push" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/?src=push";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) { c.navigate(url).catch(()=>{}); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
