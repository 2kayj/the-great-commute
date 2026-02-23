const CACHE_NAME = 'the-great-commute-v9';

const APP_SHELL = [
  '/the-great-commute/',
  '/the-great-commute/index.html',
  '/the-great-commute/manifest.json',
];

// Install: app shell 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network First (네트워크 우선, 실패 시 캐시 폴백)
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 유효한 응답은 캐시에 업데이트
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 서빙
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // HTML 요청은 캐시된 index.html 반환
          if (event.request.destination === 'document') {
            return caches.match('/the-great-commute/index.html');
          }
        });
      })
  );
});
