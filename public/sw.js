// sw.js - نسخة تعمل بشكل مؤكد
const CACHE_NAME = 'my-site-cache-v1';

// قائمة بجميع الملفات التي تريد تخزينها
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js',
    '/manifest.json'
];

// خطوة 1: تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', event => {
    console.log('[SW] جاري التثبيت...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] جاري تخزين الملفات...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] تم تخزين جميع الملفات');
                return self.skipWaiting();
            })
    );
});

// خطوة 2: تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] جاري التفعيل...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] حذف الكاش القديم:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => {
            console.log('[SW] جاهز للعمل بدون إنترنت');
            return self.clients.claim();
        })
    );
});

// خطوة 3: التحكم في طلبات الشبكة (الأهم!)
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // للملفات المحلية فقط
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // إذا وجد الملف في الكاش، أرجع مباشرة
                    if (cachedResponse) {
                        console.log('[SW] من الكاش:', url.pathname);
                        return cachedResponse;
                    }
                    
                    // إذا لم يوجد، حاول من الشبكة
                    return fetch(event.request)
                        .then(networkResponse => {
                            // خزن النسخة الجديدة
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        })
                        .catch(error => {
                            console.log('[SW] فشل الجلب:', url.pathname);
                            // إذا كان طلب صفحة، أرجع offline.html
                            if (event.request.mode === 'navigate') {
                                return caches.match('/offline.html');
                            }
                            return new Response('غير متصل', { status: 404 });
                        });
                })
        );
    } else {
        // للموارد الخارجية (مثل Font Awesome) تجاهل الأخطاء
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response('', { status: 200 });
            })
        );
    }
});
