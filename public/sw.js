// إصدار ثابت يتم تحديثه تلقائياً
const APP_VERSION = Date.now(); // هذا يجعل كل تحديث فريداً
const CACHE_NAME = `clinicpro-v${APP_VERSION}`;
const STATIC_CACHE = `clinicpro-static-${APP_VERSION}`;
const DYNAMIC_CACHE = `clinicpro-dynamic-${APP_VERSION}`;

// الملفات التي سيتم تخزينها مؤقتاً
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// تثبيت Service Worker - مسح كل الكاش القديم فوراً
self.addEventListener('install', event => {
  console.log('[SW] Installing new version...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // مسح جميع الكاشات القديمة فوراً
      return caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            }
          })
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker - السيطرة على جميع الصفحات فوراً
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Now controlling all clients');
      return self.clients.claim();
    })
  );
});

// استراتيجية Network First - دائماً نجلب أحدث إصدار
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // تجاهل طلبات الـ API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // استراتيجية Network First (نجلب من الشبكة أولاً)
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // تخزين الملفات الجديدة في الكاش
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(error => {
        // إذا فشل الاتصال، استخدم الكاش
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا كان طلب HTML ولم يكن في الكاش
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('غير متصل بالإنترنت', { status: 503 });
        });
      })
  );
});
