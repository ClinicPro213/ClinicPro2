// sw.js - استراتيجية Network First
const CACHE_NAME = 'clinicpro-v5';
const STATIC_CACHE = 'clinicpro-static-v5';

// الملفات المهمة التي يجب تخزينها مؤقتاً
const STATIC_FILES = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then(async (cache) => {
            console.log('[SW] Caching static files...');
            for (const file of STATIC_FILES) {
                try {
                    await cache.add(file);
                    console.log('[SW] Cached:', file);
                } catch (err) {
                    console.error('[SW] Failed to cache:', file, err);
                }
            }
        })
    );
    self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        Promise.all([
            // حذف الكاش القديم
            caches.keys().then(keys => {
                return Promise.all(
                    keys.filter(key => key !== STATIC_CACHE && key !== CACHE_NAME)
                        .map(key => {
                            console.log('[SW] Deleting old cache:', key);
                            return caches.delete(key);
                        })
                );
            }),
            // السيطرة على الصفحات فوراً
            self.clients.claim()
        ])
    );
});

// استراتيجية الجلب: Network First ثم Cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // للملفات المحلية (HTML, CSS, JS) - استخدم Network First
    if (event.request.mode === 'navigate' || 
        url.pathname.endsWith('.html') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.js')) {
        
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // نجح الاتصال - خزن النسخة الجديدة وارجعها
                    console.log('[SW] Network success:', url.pathname);
                    return caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(async () => {
                    // فشل الاتصال - استخدم الكاش
                    console.log('[SW] Network failed, using cache:', url.pathname);
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // إذا كان طلب صفحة وليس ملف، ارجع index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('File not found in cache', { status: 404 });
                })
        );
        return;
    }
    
    // للملفات الأخرى (صور، إلخ) - استخدم Cache First
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).catch(() => {
                return new Response('', { status: 200 });
            });
        })
    );
});

// الاستماع لعودة الاتصال
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
