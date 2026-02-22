const CACHE_NAME = 'the-great-commute-v7';

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

// Fetch: Cache First, 없으면 Network
self.addEventListener('fetch', (event) => {
  // chrome-extension 등 외부 요청 무시
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // 유효한 응답만 캐싱 (opaque 응답 제외)
          if (
            !response ||
            response.status !== 200 ||
            response.type !== 'basic'
          ) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // 오프라인 폴백: HTML 요청은 캐시된 index.html 반환
          if (event.request.destination === 'document') {
            return caches.match('/the-great-commute/index.html');
          }
        });
    })
  );
});
