// sw.js - نسخة كاملة تدعم المزامنة التلقائية
const CACHE_NAME = 'clinicpro-v2';
const SYNC_QUEUE_NAME = 'clinicpro-sync-queue';

// الكشف عن نوع المتصفح
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
let syncInProgress = false;

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(self.skipWaiting());
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // تنظيف الكاش القديم
            caches.keys().then(keys => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME).map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
                );
            }),
            // تهيئة قاعدة البيانات
            initDatabase()
        ])
    );
});

// تهيئة IndexedDB
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClinicProDB', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // جدول العمليات المعلقة
            if (!db.objectStoreNames.contains('pendingOps')) {
                const store = db.createObjectStore('pendingOps', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            // جدول البيانات المحفوظة مؤقتاً
            if (!db.objectStoreNames.contains('offlineData')) {
                const offlineStore = db.createObjectStore('offlineData', { 
                    keyPath: 'id' 
                });
                offlineStore.createIndex('type', 'type', { unique: false });
            }
        };
    });
}

// استقبال الرسائل من التطبيق
self.addEventListener('message', async (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SAVE_OFFLINE':
            await saveOfflineOperation(data);
            break;
        case 'SYNC_NOW':
            await syncPendingOperations();
            break;
        case 'GET_PENDING_COUNT':
            const count = await getPendingCount();
            event.source.postMessage({ type: 'PENDING_COUNT', count });
            break;
    }
});

// حفظ عملية عند عدم الاتصال
async function saveOfflineOperation(operation) {
    try {
        const db = await getDB();
        const tx = db.transaction('pendingOps', 'readwrite');
        
        const pendingOp = {
            id: Date.now() + Math.random(),
            ...operation,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };
        
        await tx.store.add(pendingOp);
        await tx.done;
        
        console.log('[SW] Saved offline operation:', pendingOp.type);
        
        // محاولة المزامنة فوراً إذا كان متصلاً
        if (navigator.onLine && !isIOS()) {
            setTimeout(() => syncPendingOperations(), 100);
        }
    } catch (error) {
        console.error('[SW] Error saving offline operation:', error);
    }
}

// الحصول على عدد العمليات المعلقة
async function getPendingCount() {
    try {
        const db = await getDB();
        const tx = db.transaction('pendingOps', 'readonly');
        const count = await tx.store.count();
        await tx.done;
        return count;
    } catch (error) {
        console.error('[SW] Error getting pending count:', error);
        return 0;
    }
}

// مزامنة العمليات المعلقة مع السيرفر
async function syncPendingOperations() {
    if (syncInProgress) {
        console.log('[SW] Sync already in progress, skipping...');
        return;
    }
    
    if (!navigator.onLine) {
        console.log('[SW] No internet connection, waiting...');
        return;
    }
    
    if (isIOS()) {
        console.log('[SW] iOS detected, using fallback sync');
        return;
    }
    
    syncInProgress = true;
    console.log('[SW] Starting sync...');
    
    try {
        const db = await getDB();
        const tx = db.transaction('pendingOps', 'readonly');
        const pendingOps = await tx.store.getAll();
        await tx.done;
        
        if (pendingOps.length === 0) {
            console.log('[SW] No pending operations');
            syncInProgress = false;
            return;
        }
        
        console.log(`[SW] Syncing ${pendingOps.length} operations...`);
        
        const successful = [];
        const failed = [];
        
        for (const op of pendingOps) {
            try {
                const response = await attemptSync(op);
                
                if (response && response.ok) {
                    successful.push(op.id);
                    console.log(`[SW] ✅ Synced: ${op.type}`);
                } else {
                    op.retryCount++;
                    failed.push(op);
                    console.log(`[SW] ❌ Failed: ${op.type}, retry ${op.retryCount}`);
                }
            } catch (error) {
                op.retryCount++;
                failed.push(op);
                console.error(`[SW] Error syncing ${op.type}:`, error);
            }
        }
        
        // حذف العمليات الناجحة
        if (successful.length > 0) {
            await deleteOperations(successful);
        }
        
        // تحديث العمليات الفاشلة
        if (failed.length > 0) {
            await updateFailedOperations(failed);
        }
        
        // إعلام الواجهة بنتيجة المزامنة
        await notifyClients({
            type: 'SYNC_COMPLETE',
            success: successful.length,
            failed: failed.length,
            total: pendingOps.length
        });
        
        console.log(`[SW] Sync complete: ${successful.length} success, ${failed.length} failed`);
        
    } catch (error) {
        console.error('[SW] Sync error:', error);
    } finally {
        syncInProgress = false;
    }
}

// محاولة مزامنة عملية واحدة
async function attemptSync(operation) {
    // تحويل العملية إلى الطلب المناسب
    const endpoint = getEndpointForOperation(operation.type);
    const method = getMethodForOperation(operation.type);
    
    return fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-Sync-Id': operation.id.toString(),
            'X-Offline-Sync': 'true'
        },
        body: JSON.stringify(operation.data)
    });
}

// تحديد النقطة النهائية حسب نوع العملية
function getEndpointForOperation(type) {
    const endpoints = {
        'add_patient': '/api/patients',
        'update_patient': '/api/patients/update',
        'delete_patient': '/api/patients/delete',
        'add_treatment': '/api/treatments',
        'update_treatment': '/api/treatments/update',
        'delete_treatment': '/api/treatments/delete',
        'add_image': '/api/images',
        'delete_image': '/api/images/delete'
    };
    return endpoints[type] || '/api/sync';
}

// تحديد الطريقة حسب نوع العملية
function getMethodForOperation(type) {
    if (type.includes('delete')) return 'DELETE';
    if (type.includes('update')) return 'PUT';
    return 'POST';
}

// حذف العمليات الناجحة
async function deleteOperations(ids) {
    const db = await getDB();
    const tx = db.transaction('pendingOps', 'readwrite');
    
    for (const id of ids) {
        await tx.store.delete(id);
    }
    
    await tx.done;
}

// تحديث العمليات الفاشلة
async function updateFailedOperations(operations) {
    const db = await getDB();
    const tx = db.transaction('pendingOps', 'readwrite');
    
    for (const op of operations) {
        await tx.store.put(op);
    }
    
    await tx.done;
}

// إعلام جميع نوافذ التطبيق
async function notifyClients(message) {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage(message);
    });
}

// الاستماع لعودة الاتصال بالإنترنت
self.addEventListener('online', () => {
    console.log('[SW] Internet connection restored, syncing...');
    setTimeout(() => syncPendingOperations(), 1000);
});

// مزامنة دورية كل 5 دقائق
setInterval(() => {
    if (navigator.onLine && !isIOS()) {
        syncPendingOperations();
    }
}, 5 * 60 * 1000);

// دالة مساعدة للحصول على قاعدة البيانات
function getDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ClinicProDB', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('pendingOps')) {
                const store = db.createObjectStore('pendingOps', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            
            if (!db.objectStoreNames.contains('offlineData')) {
                db.createObjectStore('offlineData', { keyPath: 'id' });
            }
        };
    });
}
