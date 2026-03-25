const CACHE_NAME = "clinicpro-v2";

// تثبيت
self.addEventListener("install", event => {
  self.skipWaiting();
});

// تفعيل
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// جلب الطلبات من الشبكة أولاً
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
