const CACHE_NAME = 'clinicpro-v2';
const OFFLINE_URL = '/offline.html';

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/styles.css',
    '/js/app.js'
];

self.addEventListener('install', event => {
    console.log('[SW] جاري التثبيت...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await cache.addAll(FILES_TO_CACHE);
                console.log('[SW] تم تخزين جميع الملفات');
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] جاري التفعيل...');
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            }),
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    if (url.origin === location.origin) {
        const request = event.request;
        
        if (request.mode === 'navigate') {
            event.respondWith(
                fetch(request)
                    .then(response => {
                        return caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, response.clone());
                                return response;
                            });
                    })
                    .catch(async () => {
                        const cached = await caches.match(request);
                        if (cached) return cached;
                        return caches.match(OFFLINE_URL);
                    })
            );
        } else {
            event.respondWith(
                caches.match(request)
                    .then(cachedResponse => {
                        if (cachedResponse) return cachedResponse;
                        return fetch(request).then(response => {
                            return caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, response.clone());
                                    return response;
                                });
                        });
                    })
                    .catch(() => {
                        return new Response('ملف غير متوفر', { status: 503 });
                    })
            );
        }
    }
});
