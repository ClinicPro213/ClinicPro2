// sw.js - نسخة تعمل على https
const CACHE_NAME = 'clinicpro-v1';
const OFFLINE_URL = '/offline.html';

// قائمة الملفات التي سيتم تخزينها
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', event => {
    console.log('[SW] جاري التثبيت...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                console.log('[SW] جاري تخزين الملفات...');
                for (const file of FILES_TO_CACHE) {
                    try {
                        await cache.add(file);
                        console.log('[SW] تم تخزين:', file);
                    } catch (err) {
                        console.error('[SW] فشل تخزين:', file, err);
                    }
                }
            })
            .then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] جاري التفعيل...');
    event.waitUntil(
        Promise.all([
            // حذف الكاش القديم
            caches.keys().then(keys => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            }),
            // السيطرة على الصفحات المفتوحة
            self.clients.claim()
        ])
    );
});

// التحكم في طلبات الشبكة
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // فقط للملفات من نفس الموقع
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // وجدنا الملف في الكاش
                        return cachedResponse;
                    }
                    // لم نجده، نجلب من الشبكة
                    return fetch(event.request)
                        .then(networkResponse => {
                            // نخزن النسخة الجديدة
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        })
                        .catch(() => {
                            // إذا فشل كل شيء وكانت الصفحة، أرجع offline.html
                            if (event.request.mode === 'navigate') {
                                return caches.match(OFFLINE_URL);
                            }
                            return new Response('غير متصل', { status: 503 });
                        });
                })
        );
    }
});
