// إصدار Service Worker آمن للمتصفحات المختلفة
const CACHE_NAME = 'clinicpro-v1';

// الكشف إذا كان المتصفح iOS
const isIOS = () => {
    return /iPhone|iPad|iPod/.test(navigator.userAgent);
};

// تثبيت Service Worker - فقط للمتصفحات غير iOS
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    
    if (isIOS()) {
        console.log('[SW] iOS detected - skipping installation');
        return;
    }
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/index.html',
                '/manifest.json'
            ]).catch(err => console.log('Cache error:', err));
        }).then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    
    if (isIOS()) {
        console.log('[SW] iOS detected - skipping activation');
        return;
    }
    
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// معالجة الطلبات - فقط للمتصفحات غير iOS
self.addEventListener('fetch', event => {
    // لا تفعل شيء على iOS
    if (isIOS()) {
        return;
    }
    
    const url = new URL(event.request.url);
    
    // تجاهل API
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // تجاهل CDN
    if (url.hostname.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});
