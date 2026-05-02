const CACHE_NAME = 'clinicpro-v3';
const urlsToCache = ['/', '/index.html', '/offline.html', '/css/styles.css', '/css/fontawesome.css', '/js/app.js'];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('[SW] جاري التثبيت...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker والتحكم بالصفحة فوراً
self.addEventListener('activate', event => {
    console.log('[SW] جاري التفعيل...');
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys => {
                return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
            }),
            self.clients.claim()
        ])
    );
});

// استراتيجية: الشبكة أولاً ✅
self.addEventListener('fetch', event => {
    const request = event.request;
    
    event.respondWith(
        fetch(request)
            .then(response => {
                // نجح الاتصال بالشبكة → خزن النسخة الجديدة وأعدها للمستخدم
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // فشل الاتصال (لا يوجد إنترنت) → استخدم النسخة المخزنة
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('[SW] استخدام نسخة مخزنة:', request.url);
                        return cachedResponse;
                    }
                    // إذا لم توجد نسخة مخزنة وكانت الصفحة، أظهر offline.html
                    if (request.mode === 'navigate') {
                        return caches.match('/offline.html');
                    }
                    return new Response('غير متصل', { status: 503 });
                });
            })
    );
});
