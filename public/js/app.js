// ============ كشف الأخطاء (مبسط لـ iOS) ============
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Error:', message, source, lineno, colno, error);
    var errorDiv = document.getElementById('dashboardAlert');
    if (errorDiv) {
        errorDiv.innerHTML = '❌ خطأ: ' + message;
        errorDiv.style.display = 'block';
        setTimeout(function() { errorDiv.style.display = 'none'; }, 5000);
    }
    return false;
};

// ============ التحقق من المتصفح (متوافق مع iOS 15) ============
(function() {
    var ua = navigator.userAgent;
    var isAndroid = (ua.indexOf('Android') > -1);
    var isIOS = (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1);
    
    // اختبار localStorage
    var localStorageWorks = true;
    try {
        localStorage.setItem('test', '1');
        localStorage.removeItem('test');
    } catch(e) {
        localStorageWorks = false;
        alert('⚠️ يرجى تعطيل وضع التصفح الخاص (Private Browsing) لتشغيل التطبيق');
    }
    
    if (isIOS) {
        console.log('🍎 iOS detected - PWA disabled');
        // تعطيل Service Worker بالكامل
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                }
            }).catch(function(e) { console.log('SW error:', e); });
            navigator.serviceWorker.register = function() {
                return Promise.reject('SW disabled on iOS');
            };
        }
        // إزالة manifest
        var manifest = document.querySelector('link[rel="manifest"]');
        if (manifest) manifest.remove();
        
        // منع beforeinstallprompt
        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            return false;
        });
    } 
    else if (isAndroid) {
        console.log('🤖 Android detected - PWA enabled');
        if (!document.querySelector('link[rel="manifest"]')) {
            var link = document.createElement('link');
            link.rel = 'manifest';
            link.href = '/manifest.json';
            document.head.appendChild(link);
        }
        
        var deferredPrompt;
        window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(function() {
                var installBtn = document.createElement('div');
                installBtn.id = 'androidInstallBtn';
                installBtn.innerHTML = '<button style="position:fixed;bottom:20px;left:20px;background:#10b981;color:white;border:none;padding:12px 20px;border-radius:50px;z-index:10000;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2)"><i class="fas fa-download"></i> تثبيت التطبيق</button>';
                installBtn.onclick = async function() {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        var result = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                        installBtn.remove();
                    }
                };
                document.body.appendChild(installBtn);
                setTimeout(function() { if(installBtn) installBtn.remove(); }, 30000);
            }, 2000);
        });
    }
})();

// ============ دوال مساعدة ============
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(id, msg, type) {
    var a = document.getElementById(id);
    if (a) {
        a.textContent = msg;
        a.className = 'alert alert-' + type;
        a.style.display = 'block';
        setTimeout(function() { a.style.display = 'none'; }, 4000);
    }
}

function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.style.display = 'none';
}

function showLogin() {
    var loginPage = document.getElementById('loginPage');
    var registerPage = document.getElementById('registerPage');
    var dashboard = document.getElementById('dashboard');
    var adminPage = document.getElementById('adminPage');
    if (loginPage) loginPage.style.display = 'block';
    if (registerPage) registerPage.style.display = 'none';
    if (dashboard) dashboard.style.display = 'none';
    if (adminPage) adminPage.style.display = 'none';
}

function showRegister() {
    var loginPage = document.getElementById('loginPage');
    var registerPage = document.getElementById('registerPage');
    var dashboard = document.getElementById('dashboard');
    if (loginPage) loginPage.style.display = 'none';
    if (registerPage) registerPage.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
}

function logout() {
    try {
        localStorage.clear();
    } catch(e) { console.log('Clear error:', e); }
    currentUser = null;
    showLogin();
}

// ============ دالة fetch آمنة مع timeout ============
function fetchWithTimeout(url, options, timeout) {
    timeout = timeout || 8000;
    return new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
            reject(new Error('Request timeout'));
        }, timeout);
        
        fetch(url, options).then(function(response) {
            clearTimeout(timer);
            resolve(response);
        }).catch(function(err) {
            clearTimeout(timer);
            reject(err);
        });
    });
}
// ============ نظام الإشعارات ============

// هيكل الإشعار
// {
//     id: string,
//     userId: string, // للمستخدم المستهدف، "all" للجميع
//     title: string,
//     body: string,
//     type: 'info' | 'success' | 'warning' | 'danger',
//     createdAt: string,
//     read: boolean,
//     readAt: string | null
// }

// ============ نظام الإشعارات (متكامل مع السيرفر) ============

// ============ إدارة الدخل والإحصائيات ============

let currentIncomeFilter = 'all';
let allIncomeTreatments = [];

// عرض صفحة الدخل
async function showIncomePage() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('incomePage').style.display = 'block';
    document.getElementById('incomeUserName').textContent = currentUser.fullName || currentUser.username;
    
    await loadIncomeData();
}

// إغلاق صفحة الدخل
function closeIncomePage() {
    document.getElementById('incomePage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// تحميل بيانات الدخل
async function loadIncomeData() {
    try {
        // جلب جميع المعالجات من السيرفر
        const response = await fetch('/api/treatments/user/' + currentUser.id);
        
        if (response.ok) {
            allIncomeTreatments = await response.json();
        } else {
            // استخدام البيانات المحلية
            const localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
            allIncomeTreatments = localTreatments;
        }
        
        // حساب الإجماليات
        calculateIncomeTotals(allIncomeTreatments);
        
        // عرض الجدول حسب التصفية الحالية
        filterIncome(currentIncomeFilter);
        
    } catch (error) {
        console.error('Error loading income data:', error);
        // استخدام البيانات المحلية
        const localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        allIncomeTreatments = localTreatments;
        calculateIncomeTotals(allIncomeTreatments);
        filterIncome(currentIncomeFilter);
    }
}

// حساب الإجماليات
function calculateIncomeTotals(treatments) {
    let totalCost = 0;
    let totalPaid = 0;
    
    for (const t of treatments) {
        const cost = t.cost || 0;
        let paid = t.paid || 0;
        
        // محاولة استخراج المدفوع من notes
        if (!paid && t.notes) {
            const match = t.notes.match(/المدفوع:\s*([\d.]+)/);
            if (match) paid = parseFloat(match[1]);
        }
        
        totalCost += cost;
        totalPaid += paid;
    }
    
    const totalRemaining = totalCost - totalPaid;
    
    document.getElementById('totalIncome').textContent = totalCost.toLocaleString();
    document.getElementById('totalPaidIncome').textContent = totalPaid.toLocaleString();
    document.getElementById('totalRemainingIncome').textContent = totalRemaining.toLocaleString();
}

// تصفية المعالجات حسب الفترة
function filterIncome(filter) {
    currentIncomeFilter = filter;
    
    // تحديث ألوان الأزرار
    document.getElementById('filterAll').style.background = '#64748b';
    document.getElementById('filterMonth').style.background = '#64748b';
    document.getElementById('filterYear').style.background = '#64748b';
    document.getElementById('filterToday').style.background = '#64748b';
    
    let activeBtn;
    if (filter === 'all') activeBtn = 'filterAll';
    else if (filter === 'month') activeBtn = 'filterMonth';
    else if (filter === 'year') activeBtn = 'filterYear';
    else activeBtn = 'filterToday';
    
    document.getElementById(activeBtn).style.background = '#3b82f6';
    
    // تصفية المعالجات
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let filteredTreatments = [...allIncomeTreatments];
    
    if (filter === 'today') {
        filteredTreatments = allIncomeTreatments.filter(t => {
            const tDate = new Date(t.treatmentDate);
            return tDate >= today;
        });
    } else if (filter === 'month') {
        filteredTreatments = allIncomeTreatments.filter(t => {
            const tDate = new Date(t.treatmentDate);
            return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
        });
    } else if (filter === 'year') {
        filteredTreatments = allIncomeTreatments.filter(t => {
            const tDate = new Date(t.treatmentDate);
            return tDate.getFullYear() === currentYear;
        });
    }
    
    // عرض المعالجات في الجدول
    renderIncomeTable(filteredTreatments);
    
    // تحديث الملخصات
    updateIncomeSummaries(filteredTreatments);
}

// عرض جدول المعالجات
async function renderIncomeTable(treatments) {
    const tbody = document.getElementById('incomeTableBody');
    
    if (!treatments || treatments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">📭 لا توجد معالجات</td></tr>';
        return;
    }
    
    // جلب أسماء المرضى
    let html = '';
    
    for (const t of treatments) {
        // جلب اسم المريض
        let patientName = 'غير معروف';
        const patient = allPatients.find(p => p._id === t.patientId);
        if (patient) patientName = patient.name;
        
        const cost = t.cost || 0;
        let paid = t.paid || 0;
        
        if (!paid && t.notes) {
            const match = t.notes.match(/المدفوع:\s*([\d.]+)/);
            if (match) paid = parseFloat(match[1]);
        }
        
        const remaining = cost - paid;
        const date = new Date(t.treatmentDate).toLocaleDateString('ar-EG');
        const treatmentName = t.treatmentType || t.toothNumber ? `السن ${t.toothNumber}` : 'معالجة';
        
        html += `
            <tr style="border-bottom:1px solid #e2e8f0">
                <td style="padding:12px">${escapeHtml(patientName)}</td>
                <td style="padding:12px">${escapeHtml(treatmentName)}</td>
                <td style="padding:12px;color:#1e40af;font-weight:bold">${cost.toLocaleString()} ريال</td>
                <td style="padding:12px;color:#10b981;font-weight:bold">${paid.toLocaleString()} ريال</td>
                <td style="padding:12px;color:${remaining > 0 ? '#ef4444' : '#10b981'};font-weight:bold">${remaining.toLocaleString()} ريال</td>
                <td style="padding:12px;color:#64748b">${date}</td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
}

// تحديث الملخصات الشهرية والسنوية
function updateIncomeSummaries(treatments) {
    // حساب ملخص اليوم
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthTotal = 0, monthPaid = 0;
    let yearTotal = 0, yearPaid = 0;
    
    for (const t of allIncomeTreatments) {
        const cost = t.cost || 0;
        let paid = t.paid || 0;
        
        if (!paid && t.notes) {
            const match = t.notes.match(/المدفوع:\s*([\d.]+)/);
            if (match) paid = parseFloat(match[1]);
        }
        
        const tDate = new Date(t.treatmentDate);
        
        // حساب السنة
        if (tDate.getFullYear() === currentYear) {
            yearTotal += cost;
            yearPaid += paid;
        }
        
        // حساب الشهر
        if (tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth) {
            monthTotal += cost;
            monthPaid += paid;
        }
    }
    
    document.getElementById('monthTotal').textContent = monthTotal.toLocaleString() + ' ريال';
    document.getElementById('monthPaid').textContent = monthPaid.toLocaleString() + ' ريال';
    document.getElementById('monthRemaining').textContent = (monthTotal - monthPaid).toLocaleString() + ' ريال';
    
    document.getElementById('yearTotal').textContent = yearTotal.toLocaleString() + ' ريال';
    document.getElementById('yearPaid').textContent = yearPaid.toLocaleString() + ' ريال';
    document.getElementById('yearRemaining').textContent = (yearTotal - yearPaid).toLocaleString() + ' ريال';
}

// إضافة API جديد في server.js لجلب معالجات المستخدم
// أضف هذا في server.js:

/*
app.get('/api/treatments/user/:userId', async (req, res) => {
    try {
        const treatments = await Treatment.find({ userId: req.params.userId }).sort({ treatmentDate: -1 });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});
*/
// جلب إشعارات المستخدم من السيرفر
async function fetchUserNotifications() {
    if (!currentUser) return [];
    
    try {
        var response = await fetch('/api/notifications/user/' + currentUser.id);
        var data = await response.json();
        
        if (data.success) {
            // حفظ في localStorage للتخزين المؤقت
            try {
                localStorage.setItem('cached_notifications_' + currentUser.id, JSON.stringify(data.notifications));
                localStorage.setItem('cached_unread_count_' + currentUser.id, data.unreadCount);
            } catch(e) {}
            
            return data.notifications;
        }
    } catch (e) {
        console.log('⚠️ Cannot fetch notifications from server, using cache');
        // استخدام البيانات المخزنة مؤقتاً
        try {
            var cached = localStorage.getItem('cached_notifications_' + currentUser.id);
            return cached ? JSON.parse(cached) : [];
        } catch(e) {
            return [];
        }
    }
    return [];
}

// الحصول على إشعارات المستخدم الحالي
async function getUserNotifications() {
    if (!currentUser) return [];
    return await fetchUserNotifications();
}

// الحصول على عدد الإشعارات غير المقروءة
async function getUnreadCount() {
    if (!currentUser) return 0;
    
    if (navigator.onLine) {
        try {
            var response = await fetch('/api/notifications/unread-count/' + currentUser.id);
            var data = await response.json();
            if (data.success) {
                try {
                    localStorage.setItem('cached_unread_count_' + currentUser.id, data.count);
                } catch(e) {}
                return data.count;
            }
        } catch(e) {
            console.log('⚠️ Cannot get unread count from server');
        }
    }
    
    // استخدام القيمة المخزنة
    try {
        return parseInt(localStorage.getItem('cached_unread_count_' + currentUser.id)) || 0;
    } catch(e) {
        return 0;
    }
}

// تحديث شارة الإشعارات
async function updateNotificationBadge() {
    var badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    var count = await getUnreadCount();
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// عرض صفحة الإشعارات
async function showNotificationsPage() {
    if (!currentUser) return;
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('notificationsPage').style.display = 'block';
    document.getElementById('notificationsUserName').textContent = currentUser.fullName || currentUser.username;
    await renderNotifications();
    updateNotificationBadge();
}

function closeNotificationsPage() {
    document.getElementById('notificationsPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// عرض الإشعارات
async function renderNotifications() {
    var container = document.getElementById('notificationsList');
    if (!container) return;
    
    var notifications = await fetchUserNotifications();
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="empty-notifications"><i class="fas fa-bell-slash"></i><p>لا توجد إشعارات</p></div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < notifications.length; i++) {
        var n = notifications[i];
        var unreadClass = n.read ? 'read' : 'unread';
        var typeIcon = '';
        if (n.type === 'info') typeIcon = '📘';
        else if (n.type === 'success') typeIcon = '✅';
        else if (n.type === 'warning') typeIcon = '⚠️';
        else if (n.type === 'danger') typeIcon = '🔴';
        else typeIcon = '📢';
        
        var date = new Date(n.createdAt);
        var formattedDate = date.toLocaleDateString('ar-EG') + ' ' + date.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
        
        html += '<div class="notification-item ' + unreadClass + '" onclick="markNotificationRead(\'' + n.id + '\')">';
        html += '<div class="notification-header">';
        html += '<div class="notification-title">';
        if (!n.read) html += '<span class="notification-unread-dot"></span>';
        html += '<span class="notification-badge ' + n.type + '">' + typeIcon + ' ' + getNotificationTypeName(n.type) + '</span>';
        html += '<strong>' + escapeHtml(n.title) + '</strong>';
        html += '</div>';
        html += '<div class="notification-date">' + formattedDate + '</div>';
        html += '</div>';
        html += '<div class="notification-body">' + escapeHtml(n.body) + '</div>';
        if (n.sentByName) {
            html += '<div style="font-size:11px; color:#64748b; margin-top:8px;"><i class="fas fa-user"></i> من: ' + escapeHtml(n.sentByName) + '</div>';
        }
        html += '</div>';
    }
    container.innerHTML = html;
}

function getNotificationTypeName(type) {
    var types = {
        'info': 'معلومات',
        'success': 'نجاح',
        'warning': 'تنبيه',
        'danger': 'هام'
    };
    return types[type] || 'إشعار';
}

// تعيين إشعار كمقروء
async function markNotificationRead(notificationId) {
    if (!currentUser) return;
    
    if (navigator.onLine) {
        try {
            await fetch('/api/notifications/' + notificationId + '/read/' + currentUser.id, {
                method: 'PUT'
            });
        } catch(e) {
            console.log('Error marking as read:', e);
        }
    }
    
    // تحديث الواجهة
    await renderNotifications();
    updateNotificationBadge();
}

// تعيين كل الإشعارات كمقروءة
async function markAllNotificationsRead() {
    if (!currentUser) return;
    
    if (navigator.onLine) {
        try {
            await fetch('/api/notifications/read-all/' + currentUser.id, {
                method: 'PUT'
            });
        } catch(e) {
            console.log('Error marking all as read:', e);
        }
    }
    
    await renderNotifications();
    updateNotificationBadge();
    showAlert('dashboardAlert', '✅ تم تعيين جميع الإشعارات كمقروءة', 'success');
}

// ============ وظائف المدير لإرسال الإشعارات ============

// فتح نافذة إرسال الإشعار
async function openSendNotificationModal() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('adminAlert', 'غير مصرح لك بهذه العملية', 'error');
        return;
    }
    
    // تحميل قائمة المستخدمين
    await loadUsersListForNotification();
    document.getElementById('notificationRecipient').value = 'all';
    document.getElementById('specificUserDiv').style.display = 'none';
    document.getElementById('notificationTitle').value = '';
    document.getElementById('notificationBody').value = '';
    document.getElementById('notificationType').value = 'info';
    document.getElementById('sendNotificationModal').style.display = 'flex';
}

// تحميل المستخدمين للقائمة
async function loadUsersListForNotification() {
    var select = document.getElementById('notificationUserId');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- اختر مستخدم --</option>';
    
    try {
        var response = await fetch('/api/admin/users-list');
        var users = await response.json();
        
        for (var i = 0; i < users.length; i++) {
            var u = users[i];
            select.innerHTML += '<option value="' + u._id + '">' + escapeHtml(u.fullName) + ' (@' + u.username + ')</option>';
        }
    } catch(e) {
        console.log('Error loading users:', e);
        select.innerHTML = '<option value="">-- خطأ في تحميل المستخدمين --</option>';
    }
}

// إرسال الإشعار
async function sendNotification() {
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('adminAlert', 'غير مصرح لك بهذه العملية', 'error');
        return;
    }
    
    var recipient = document.getElementById('notificationRecipient').value;
    var userIds = [];
    
    if (recipient === 'specific') {
        var userId = document.getElementById('notificationUserId').value;
        if (!userId) {
            showAlert('adminAlert', 'الرجاء اختيار مستخدم', 'error');
            return;
        }
        userIds = [userId];
    }
    
    var title = document.getElementById('notificationTitle').value.trim();
    var body = document.getElementById('notificationBody').value.trim();
    var type = document.getElementById('notificationType').value;
    
    if (!title || !body) {
        showAlert('adminAlert', 'الرجاء إدخال عنوان ومحتوى الإشعار', 'error');
        return;
    }
    
    try {
        var response = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                body: body,
                type: type,
                targetUsers: recipient,
                userIds: userIds,
                senderId: currentUser.id
            })
        });
        
        var result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('adminAlert', '✅ تم إرسال الإشعار إلى ' + result.recipientCount + ' مستخدم', 'success');
            closeModal('sendNotificationModal');
            
            // تحديث الإشعارات للمستخدم الحالي إذا كان من المستلمين
            if (recipient === 'all') {
                updateNotificationBadge();
            }
        } else {
            showAlert('adminAlert', result.message || 'فشل إرسال الإشعار', 'error');
        }
    } catch(e) {
        console.error('Error sending notification:', e);
        showAlert('adminAlert', 'خطأ في الاتصال بالخادم', 'error');
    }
}

// تحديث شارة الإشعارات بشكل دوري
setInterval(async function() {
    if (currentUser && document.visibilityState === 'visible') {
        await updateNotificationBadge();
    }
}, 30000);

        
        




// ============ المتغيرات ============
var currentUser = null;
var allPatients = [];
var currentPatientId = null;
var allAdminUsers = [];
var allAdminPatients = [];

// ============ OFFLINE SYSTEM ============
function savePatientOffline(patientData) {
    var offlinePatients = [];
    try {
        offlinePatients = JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
    } catch(e) { console.log('Parse error:', e); }
    var newPatient = {
        name: patientData.name,
        phone: patientData.phone,
        age: patientData.age,
        address: patientData.address,
        notes: patientData.notes,
        _id: 'offline_' + Date.now(),
        createdAt: new Date().toISOString(),
        offline: true,
        pendingSync: true
    };
    offlinePatients.push(newPatient);
    try {
        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(offlinePatients));
    } catch(e) { console.log('Save error:', e); }
    return newPatient;
}

function getOfflinePatients() {
    if (!currentUser) return [];
    try {
        return JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
    } catch(e) {
        return [];
    }
}

function saveTreatmentOffline(treatmentData) {
    var offlineTreatments = [];
    try {
        offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    } catch(e) { console.log('Parse error:', e); }
    offlineTreatments.push({
        patientId: treatmentData.patientId,
        toothNumber: treatmentData.toothNumber,
        treatmentType: treatmentData.treatmentType,
        cost: treatmentData.cost,
        paid: treatmentData.paid,
        notes: treatmentData.notes,
        treatmentDate: treatmentData.treatmentDate,
        _id: 'offline_tx_' + Date.now(),
        offline: true,
        pendingSync: true
    });
    try {
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTreatments));
    } catch(e) { console.log('Save error:', e); }
}

function getOfflineTreatmentsForPatient(patientId) {
    if (!currentUser) return [];
    try {
        var treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        var result = [];
        for (var i = 0; i < treatments.length; i++) {
            if (treatments[i].patientId === patientId) {
                result.push(treatments[i]);
            }
        }
        return result;
    } catch(e) {
        return [];
    }
}

function saveOfflineAuth(user, password) {
    try {
        localStorage.setItem('offlineAuth', JSON.stringify({
            userId: user.id,
            username: user.username,
            password: password,
            userData: user,
            savedAt: new Date().toISOString()
        }));
    } catch(e) { console.log('Save auth error:', e); }
}

function getOfflineAuth() {
    try {
        var data = localStorage.getItem('offlineAuth');
        return data ? JSON.parse(data) : null;
    } catch(e) {
        return null;
    }
}

function saveCompleteOfflineData(user, patients, treatments) {
    try {
        localStorage.setItem('offline_data_' + user.id, JSON.stringify({
            user: user,
            patients: patients,
            treatments: treatments,
            savedAt: new Date().toISOString()
        }));
    } catch(e) { console.log('Save complete error:', e); }
}

function getCompleteOfflineData(userId) {
    try {
        var data = localStorage.getItem('offline_data_' + userId);
        return data ? JSON.parse(data) : null;
    } catch(e) {
        return null;
    }
}

function saveAllDataToLocal() {
    if (!currentUser) return;
    try {
        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(allPatients));
        localStorage.setItem('offline_data_' + currentUser.id, JSON.stringify({ user: currentUser, patients: allPatients, savedAt: new Date().toISOString() }));
        console.log('💾 All data saved to localStorage');
    } catch(e) { console.log('Save error:', e); }
}

function checkConnectionStatus() {
    if (!navigator.onLine) {
        document.body.classList.add('offline-mode');
        showAlert('dashboardAlert', '📴 وضع عدم الاتصال - البيانات تحفظ محلياً', 'warning');
    } else {
        document.body.classList.remove('offline-mode');
    }
}

// ============ صفحة الاشتراك ============
function showSubscriptionPage() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('subscriptionPage').style.display = 'block';
    document.getElementById('subUserName').textContent = currentUser.fullName || currentUser.username;
}

function closeSubscriptionPage() {
    document.getElementById('subscriptionPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function copyToClipboard(number, method) {
    navigator.clipboard.writeText(number).then(function() {
        var notification = document.getElementById('copyNotification');
        notification.textContent = '✅ تم نسخ رقم ' + method + ' بنجاح: ' + number;
        notification.style.display = 'block';
        setTimeout(function() { notification.style.display = 'none'; }, 3000);
    }).catch(function(e) {
        console.log('Clipboard error:', e);
        alert('اضغط مع الاستمرار ثم اختر نسخ: ' + number);
    });
}

function sendPaymentWhatsApp() {
    var message = '*طلب تفعيل اشتراك ClinicPro*\n\n👤 *اسم المستخدم:* ' + (currentUser.fullName || currentUser.username) + '\n👨‍⚕️ *اسم العيادة:* ' + (currentUser.clinicName || 'غير محدد') + '\n📞 *رقم الهاتف:* ' + (currentUser.phone || 'غير مسجل') + '\n💰 *المبلغ:* 3,000 ريال يمني\n🦷 *ClinicPro*\n\nتم إيداع المبلغ وسأرفق صورة الإيداع';
    window.open('https://wa.me/967773041464?text=' + encodeURIComponent(message), '_blank');
}

function sendPaymentTelegram() {
    var message = 'طلب تفعيل اشتراك ClinicPro\n\nاسم المستخدم: ' + (currentUser.fullName || currentUser.username) + '\nاسم العيادة: ' + (currentUser.clinicName || 'غير محدد') + '\nرقم الهاتف: ' + (currentUser.phone || 'غير مسجل') + '\nالمبلغ: 3,000 ريال يمني\n\nتم إيداع المبلغ وسأرفق صورة الإيداع';
    window.open('https://t.me/moatazdent?text=' + encodeURIComponent(message), '_blank');
}

// ============ زر التواصل ============
function contactWhatsApp() {
    if (!currentUser) return;
    window.open('https://wa.me/967773041464?text=' + encodeURIComponent('مرحباً، أنا ' + (currentUser.fullName || currentUser.username) + ' من عيادة ' + (currentUser.clinicName || 'عيادة الأسنان')), '_blank');
}

function contactTelegram() {
    window.open('https://t.me/moatazdent', '_blank');
}

// ============ نظام الاشتراك ============
function showSubscriptionAlert() {
    var alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv && currentUser && currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        alertDiv.classList.add('show');
        try {
            localStorage.setItem('subscriptionAlertShown', 'true');
        } catch(e) {}
    }
}

function closeSubscriptionAlert() {
    var alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) {
        alertDiv.classList.remove('show');
        try {
            localStorage.setItem('subscriptionAlertClosed', Date.now().toString());
        } catch(e) {}
    }
}

function sendSubscriptionRequest() {
    if (!currentUser) return;
    showSubscriptionPage();
    var alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) alertDiv.classList.remove('show');
    try {
        localStorage.setItem('subscriptionRequested', Date.now().toString());
    } catch(e) {}
}

function checkPatientLimit() {
    if (!currentUser) return;
    var subBtn = document.getElementById('subscriptionBtn');
    if (currentUser.role === 'admin' || currentUser.isSubscribed) {
        var alertDiv = document.getElementById('subscriptionAlert');
        if (alertDiv) alertDiv.classList.remove('show');
        if (subBtn) subBtn.style.display = 'none';
        return;
    }
    if (subBtn) {
        subBtn.style.display = 'flex';
        console.log('✅ زر الاشتراك ظاهر للمستخدم المجاني');
    }
    var patientCount = allPatients.length;
    var remaining = Math.max(0, 5 - patientCount);
    var remainingSlots = document.getElementById('remainingSlots');
    if (remainingSlots) remainingSlots.textContent = remaining;
    if (patientCount >= 5) {
        var closedTime = null;
        try {
            closedTime = localStorage.getItem('subscriptionAlertClosed');
        } catch(e) {}
        if (!closedTime || (Date.now() - parseInt(closedTime)) > 24 * 60 * 60 * 1000) showSubscriptionAlert();
        var addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.5';
            addBtn.title = 'لقد وصلت للحد الأقصى. اشترك لإضافة المزيد';
        }
    } else {
        var addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
        }
        if (patientCount >= 4) showAlert('dashboardAlert', '⚠️ تنبيه: لديك ' + patientCount + ' من 5 مرضى مجانيين. يمكنك إضافة ' + remaining + ' مريض آخر مجاناً.', 'warning');
    }
}

async function addPatientWithLimitCheck(data) {
    if (currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        showAlert('dashboardAlert', '⚠️ لقد وصلت للحد الأقصى (5 مرضى). يرجى الاشتراك لإضافة المزيد من المرضى.', 'error');
        showSubscriptionAlert();
        closeModal('patientModal');
        return;
    }
    await addPatient(data);
}


    
// ============ رسم مخطط أسنان احترافي (2D مع تحديد يدوي) ============
function drawTeeth() {
    var container = document.getElementById('teethContainer');
    if (!container) return;
    
    // مخطط الأسنان حسب نظام FDI
    // الفك العلوي (الأيمن إلى الأيسر)
    var upperJaw = [
        { num: 18, name: 'ضرس العقل', pos: 'يمين' },
        { num: 17, name: 'الضرس الثاني', pos: 'يمين' },
        { num: 16, name: 'الضرس الأول', pos: 'يمين' },
        { num: 15, name: 'الضاحك الثاني', pos: 'يمين' },
        { num: 14, name: 'الضاحك الأول', pos: 'يمين' },
        { num: 13, name: 'الناب', pos: 'يمين' },
        { num: 12, name: 'القاطع الجانبي', pos: 'يمين' },
        { num: 11, name: 'القاطع المركزي', pos: 'يمين' },
        { num: 21, name: 'القاطع المركزي', pos: 'يسار' },
        { num: 22, name: 'القاطع الجانبي', pos: 'يسار' },
        { num: 23, name: 'الناب', pos: 'يسار' },
        { num: 24, name: 'الضاحك الأول', pos: 'يسار' },
        { num: 25, name: 'الضاحك الثاني', pos: 'يسار' },
        { num: 26, name: 'الضرس الأول', pos: 'يسار' },
        { num: 27, name: 'الضرس الثاني', pos: 'يسار' },
        { num: 28, name: 'ضرس العقل', pos: 'يسار' }
    ];
    
    // الفك السفلي
    var lowerJaw = [
        { num: 48, name: 'ضرس العقل', pos: 'يمين' },
        { num: 47, name: 'الضرس الثاني', pos: 'يمين' },
        { num: 46, name: 'الضرس الأول', pos: 'يمين' },
        { num: 45, name: 'الضاحك الثاني', pos: 'يمين' },
        { num: 44, name: 'الضاحك الأول', pos: 'يمين' },
        { num: 43, name: 'الناب', pos: 'يمين' },
        { num: 42, name: 'القاطع الجانبي', pos: 'يمين' },
        { num: 41, name: 'القاطع المركزي', pos: 'يمين' },
        { num: 31, name: 'القاطع المركزي', pos: 'يسار' },
        { num: 32, name: 'القاطع الجانبي', pos: 'يسار' },
        { num: 33, name: 'الناب', pos: 'يسار' },
        { num: 34, name: 'الضاحك الأول', pos: 'يسار' },
        { num: 35, name: 'الضاحك الثاني', pos: 'يسار' },
        { num: 36, name: 'الضرس الأول', pos: 'يسار' },
        { num: 37, name: 'الضرس الثاني', pos: 'يسار' },
        { num: 38, name: 'ضرس العقل', pos: 'يسار' }
    ];
    
    var html = `
        <div class="teeth-legend">
            <div class="legend-title">📋 نظام الترقيم FDI</div>
            <div class="legend-items">
                <span class="legend-item"><span class="legend-color upper"></span> الفك العلوي</span>
                <span class="legend-item"><span class="legend-color lower"></span> الفك السفلي</span>
                <span class="legend-item"><span class="legend-color selected"></span> السن المحدد</span>
            </div>
        </div>
        
        <div class="jaw-container upper-jaw">
            <div class="jaw-title">🦷 الفك العلوي (الأسنان العلوية)</div>
            <div class="teeth-grid" id="upperTeeth">
    `;
    
    // عرض الأسنان العلوية
    for (var i = 0; i < upperJaw.length; i++) {
        var tooth = upperJaw[i];
        html += `
            <div class="tooth-card" data-tooth="${tooth.num}" onclick="selectTooth(${tooth.num})">
                <div class="tooth-num">${tooth.num}</div>
                <div class="tooth-name">${tooth.name}</div>
                <div class="tooth-pos">${tooth.pos}</div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
        
        <div class="jaw-container lower-jaw">
            <div class="jaw-title">🦷 الفك السفلي (الأسنان السفلية)</div>
            <div class="teeth-grid" id="lowerTeeth">
    `;
    
    // عرض الأسنان السفلية
    for (var i = 0; i < lowerJaw.length; i++) {
        var tooth = lowerJaw[i];
        html += `
            <div class="tooth-card" data-tooth="${tooth.num}" onclick="selectTooth(${tooth.num})">
                <div class="tooth-num">${tooth.num}</div>
                <div class="tooth-name">${tooth.name}</div>
                <div class="tooth-pos">${tooth.pos}</div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// دالة تحديد السن
function selectTooth(toothNumber) {
    // إزالة التحديد من جميع الأسنان
    document.querySelectorAll('.tooth-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // تحديد السن المختار
    var selectedCard = document.querySelector(`.tooth-card[data-tooth="${toothNumber}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        
        // تمرير إلى السن المحدد
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // تعبئة حقل رقم السن
        var toothInput = document.getElementById('toothNumber');
        if (toothInput) {
            toothInput.value = toothNumber;
        }
        
        // عرض اسم السن
        var toothName = selectedCard.querySelector('.tooth-name')?.innerText || '';
        console.log(`✅ تم تحديد السن ${toothNumber} - ${toothName}`);
        
        // إشعار للمستخدم
        showAlert('dashboardAlert', `🦷 تم تحديد السن ${toothNumber}`, 'success');
    }
}

function calcRemaining() {
    var costInput = document.getElementById('treatmentCostInput');
    var paidInput = document.getElementById('treatmentPaidInput');
    var remainingSpan = document.getElementById('remainingSpan');
    if (!costInput || !paidInput || !remainingSpan) return;
    var cost = parseFloat(costInput.value) || 0;
    var paid = parseFloat(paidInput.value) || 0;
    var remaining = cost - paid;
    remainingSpan.textContent = remaining;
    if (remaining < 0) {
        remainingSpan.style.color = '#10b981';
    } else if (remaining > 0) {
        remainingSpan.style.color = '#ef4444';
    } else {
        remainingSpan.style.color = '#64748b';
    }
}

function showTreatmentModal(pid) {
    currentPatientId = pid;
    drawTeeth();
    var modal = document.getElementById('treatmentModal');
    if (modal) modal.style.display = 'flex';
}

// ============ حفظ المعالجة ============
async function saveTreatmentNow() {
    if (!currentPatientId) {
        showAlert('dashboardAlert', 'خطأ: لم يتم تحديد المريض', 'error');
        return;
    }
    var tooth = document.getElementById('toothNumber').value;
    if (!tooth) {
        showAlert('dashboardAlert', 'اختر السن أولاً', 'error');
        return;
    }
    var type = document.getElementById('treatmentTypeSelect').value;
    if (!type) {
        showAlert('dashboardAlert', 'اختر نوع المعالجة', 'error');
        return;
    }
    var notes = document.getElementById('treatmentNotesInput').value;
    var cost = parseFloat(document.getElementById('treatmentCostInput').value) || 0;
    var paid = parseFloat(document.getElementById('treatmentPaidInput').value) || 0;
    
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === currentPatientId) {
            patient = allPatients[i];
            break;
        }
    }
    
    var treatmentData = {
        patientId: currentPatientId,
        userId: currentUser.id,
        toothNumber: parseInt(tooth),
        treatmentType: type,
        cost: cost,
        paid: paid,
        notes: 'التكلفة: ' + cost + ' | المدفوع: ' + paid + ' | المتبقي: ' + (cost-paid) + '\n' + notes,
        treatmentDate: new Date().toISOString(),
        patientName: patient ? patient.name : 'غير معروف',
        offline: true,
        pendingSync: true,
        _id: 'offline_tx_' + Date.now()
    };
    
    var offlineTx = [];
    try {
        offlineTx = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    } catch(e) { console.log('Parse error:', e); }
    offlineTx.push(treatmentData);
    try {
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTx));
    } catch(e) { console.log('Save error:', e); }
    
    showAlert('dashboardAlert', '📴 تم حفظ معالجة السن ' + tooth + ' محلياً - ستتم المزامنة لاحقاً', 'warning');
    closeModal('treatmentModal');
    
    var detailsModal = document.getElementById('patientDetailsModal');
    if (detailsModal && detailsModal.style.display === 'flex') {
        await showPatientFullDetails(currentPatientId);
    }
    
    if (navigator.onLine) {
        setTimeout(async function() {
            await syncAllOfflineData();
        }, 500);
    }
    saveAllDataToLocal();
}

async function saveAndShareNow() {
    await saveTreatmentNow();
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === currentPatientId) {
            patient = allPatients[i];
            break;
        }
    }
    if (patient) {
        var tooth = document.getElementById('toothNumber').value;
        var type = document.getElementById('treatmentTypeSelect').value;
        var cost = document.getElementById('treatmentCostInput').value;
        var paid = document.getElementById('treatmentPaidInput').value;
        var notes = document.getElementById('treatmentNotesInput').value;
        var message = '*🦷 تقرير المعالجة*\n\n👤 المريض: ' + patient.name + '\n🦷 السن: ' + tooth + '\n💊 نوع المعالجة: ' + type + '\n💰 التكلفة: ' + cost + ' ريال\n💵 المدفوع: ' + paid + ' ريال\n⚠️ المتبقي: ' + (cost - paid) + ' ريال\n' + (notes ? '📝 ملاحظات: ' + notes + '\n' : '') + '🦷 ClinicPro';
        var phone = patient.phone || '967773041464';
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank');
    }
}

// ============ إدارة المرضى ============
async function loadPatients() {
    try {
        var r = await fetchWithTimeout('/api/patients/' + currentUser.id, 8000);
        if (r.ok) {
            var serverPatients = await r.json();
            var offlinePatients = [];
            try {
                offlinePatients = JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
            } catch(e) { console.log('Parse error:', e); }
            var pendingOffline = [];
            for (var i = 0; i < offlinePatients.length; i++) {
                if (offlinePatients[i].pendingSync === true) {
                    pendingOffline.push(offlinePatients[i]);
                }
            }
            allPatients = pendingOffline.concat(serverPatients);
            
            // إزالة المكررات
            var uniqueNames = {};
            var uniquePatients = [];
            for (var i = 0; i < allPatients.length; i++) {
                var p = allPatients[i];
                if (!uniqueNames[p.name]) {
                    uniqueNames[p.name] = true;
                    uniquePatients.push(p);
                }
            }
            allPatients = uniquePatients;
            
            renderPatients(allPatients);
            document.getElementById('totalPatients').textContent = allPatients.length;
            saveAllDataToLocal();
            checkPatientLimit();
        }
    } catch (e) {
        console.error('Error loading patients:', e);
        try {
            allPatients = JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
        } catch(e2) { allPatients = []; }
        renderPatients(allPatients);
    }
}

function renderPatients(pts) {
    var g = document.getElementById('patientsGrid');
    if (!g) return;
    if (!pts || !pts.length) {
        g.innerHTML = '<div style="text-align:center;padding:50px">لا يوجد مرضى. أضف مريضاً جديداً</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        var isPending = (p.pendingSync === true || p.offline === true);
        var pendingBadge = '';
        if (isPending) {
            pendingBadge = '<span style="background:#f59e0b;font-size:10px;padding:2px 6px;border-radius:20px;margin-right:8px">📴 مؤقت - ينتظر المزامنة</span>';
        }
        
        html += '<div class="patient-card" onclick="showPatientFullDetails(\'' + p._id + '\')">';
        html += '<div class="patient-header">';
        html += '<h3>' + escapeHtml(p.name) + ' ' + pendingBadge + '</h3>';
        html += '<div class="patient-actions" onclick="event.stopPropagation()">';
        html += '<button onclick="editPatient(\'' + p._id + '\')"><i class="fas fa-edit"></i></button>';
        html += '<button onclick="showTreatmentModal(\'' + p._id + '\')"><i class="fas fa-stethoscope"></i></button>';
        html += '<button onclick="deletePatient(\'' + p._id + '\')"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
        html += '<div class="patient-body">';
        html += '<p><i class="fas fa-phone"></i> ' + escapeHtml(p.phone || 'غير محدد') + '</p>';
        html += '<p><i class="fas fa-calendar"></i> العمر: ' + p.age + ' سنة</p>';
        if (isPending) {
            html += '<p style="color:#f59e0b;"><i class="fas fa-sync-alt"></i> في انتظار المزامنة مع الخادم</p>';
        }
        html += '</div></div>';
    }
    g.innerHTML = html;
}

async function addPatient(data) {
    if (currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        showAlert('dashboardAlert', '⚠️ لقد وصلت للحد الأقصى (5 مرضى). يرجى الاشتراك لإضافة المزيد من المرضى.', 'error');
        showSubscriptionAlert();
        closeModal('patientModal');
        return;
    }
    
    // التحقق من وجود المريض
    var exists = false;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i].name === data.name) {
            exists = true;
            break;
        }
    }
    if (exists) {
        showAlert('dashboardAlert', '⚠️ هذا المريض موجود بالفعل', 'error');
        closeModal('patientModal');
        return;
    }
    
    var newPatient = {
        name: data.name,
        phone: data.phone,
        age: data.age,
        address: data.address,
        notes: data.notes,
        _id: 'offline_' + Date.now(),
        createdAt: new Date().toISOString(),
        offline: true,
        pendingSync: true
    };
    
    var offlinePatients = getOfflinePatients();
    offlinePatients.unshift(newPatient);
    try {
        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(offlinePatients));
    } catch(e) { console.log('Save error:', e); }
    
    allPatients = [newPatient].concat(allPatients);
    renderPatients(allPatients);
    document.getElementById('totalPatients').textContent = allPatients.length;
    checkPatientLimit();
    closeModal('patientModal');
    
    if (navigator.onLine) {
        try {
            var r = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: data.name, phone: data.phone, age: data.age, address: data.address, notes: data.notes, userId: currentUser.id })
            });
            if (r.ok) {
                var result = await r.json();
                var updated = getOfflinePatients();
                var idx = -1;
                for (var i = 0; i < updated.length; i++) {
                    if (updated[i]._id === newPatient._id) {
                        idx = i;
                        break;
                    }
                }
                if (idx !== -1) {
                    updated[idx]._id = result.patient._id;
                    updated[idx].offline = false;
                    updated[idx].pendingSync = false;
                    localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(updated));
                }
                await loadPatients();
                showAlert('dashboardAlert', '✅ تم إضافة المريض ومزامنته', 'success');
            } else {
                showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً - سيتم المزامنة لاحقاً', 'warning');
            }
        } catch (e) {
            showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً', 'warning');
        }
    } else {
        showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً - سيتم المزامنة عند استعادة الاتصال', 'warning');
    }
    saveAllDataToLocal();
}

async function updatePatient(id, data) {
    try {
        var r = await fetch('/api/patients/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (r.ok) {
            showAlert('dashboardAlert', 'تم التحديث', 'success');
            closeModal('patientModal');
            await loadPatients();
            saveAllDataToLocal();
        }
    } catch (e) {
        showAlert('dashboardAlert', 'خطأ', 'error');
    }
}

async function deletePatient(id) {
    if (confirm('هل أنت متأكد؟')) {
        await fetch('/api/patients/' + id, { method: 'DELETE' });
        await loadPatients();
        await loadStats();
        saveAllDataToLocal();
    }
}

async function loadStats() {
    try {
        var r = await fetch('/api/user/' + currentUser.id);
        var d = await r.json();
        document.getElementById('totalPatients').textContent = d.patientCount || 0;
        var remaining = (currentUser.role === 'admin' || currentUser.isSubscribed) ? 'غير محدود' : Math.max(0, 5 - (d.patientCount || 0));
        document.getElementById('remainingSlots').textContent = remaining;
    } catch (e) { console.log('Stats error:', e); }
}

function searchPatients() {
    var q = document.getElementById('searchInput').value.toLowerCase();
    if (!q) {
        renderPatients(allPatients);
        return;
    }
    var filtered = [];
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i].name.toLowerCase().indexOf(q) !== -1) {
            filtered.push(allPatients[i]);
        }
    }
    renderPatients(filtered);
}

function showAddPatientModal() {
    document.getElementById('modalTitle').textContent = 'إضافة مريض';
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    document.getElementById('patientModal').style.display = 'flex';
}

function editPatient(id) {
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === id) {
            patient = allPatients[i];
            break;
        }
    }
    if (patient) {
        document.getElementById('modalTitle').textContent = 'تعديل مريض';
        document.getElementById('patientId').value = patient._id;
        document.getElementById('patientName').value = patient.name;
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientAge').value = patient.age;
        document.getElementById('patientAddress').value = patient.address || '';
        document.getElementById('patientNotes').value = patient.notes || '';
        document.getElementById('patientModal').style.display = 'flex';
    }
}

async function showPatientFullDetails(pid) {
    try {
        var patient = null;
        for (var i = 0; i < allPatients.length; i++) {
            if (allPatients[i]._id === pid) {
                patient = allPatients[i];
                break;
            }
        }
        if (!patient) {
            showAlert('dashboardAlert', 'المريض غير موجود', 'error');
            return;
        }
        var isOfflinePatient = (patient.pendingSync === true || patient.offline === true);
        
        var localTreatments = [];
        try {
            localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        } catch(e) { console.log('Parse error:', e); }
        
        var treatments = [];
        for (var i = 0; i < localTreatments.length; i++) {
            if (localTreatments[i].patientId === pid) {
                treatments.push(localTreatments[i]);
            }
        }
        
        var serverTreatments = [];
        if (navigator.onLine) {
            try {
                var r = await fetch('/api/treatments/patient/' + pid);
                if (r.ok) serverTreatments = await r.json();
            } catch (e) { console.log('Fetch treatments error:', e); }
        }
        
        // دمج المعالجات
        var allTreatmentsMap = {};
        for (var i = 0; i < treatments.length; i++) {
            allTreatmentsMap[treatments[i]._id] = treatments[i];
        }
        for (var i = 0; i < serverTreatments.length; i++) {
            if (!allTreatmentsMap[serverTreatments[i]._id]) {
                allTreatmentsMap[serverTreatments[i]._id] = serverTreatments[i];
            }
        }
        
        var allTreatments = [];
        for (var key in allTreatmentsMap) {
            allTreatments.push(allTreatmentsMap[key]);
        }
        allTreatments.sort(function(a, b) {
            return new Date(b.treatmentDate) - new Date(a.treatmentDate);
        });
        
        var totalCost = 0;
        var totalPaid = 0;
        var treatmentsHtml = '';
        
        for (var i = 0; i < allTreatments.length; i++) {
            var t = allTreatments[i];
            var cost = t.cost || 0;
            var paid = 0;
            if (t.notes && !t.paid) {
                var match = t.notes.match(/المدفوع:\s*([\d.]+)/);
                if (match) paid = parseFloat(match[1]);
            } else {
                paid = t.paid || 0;
            }
            totalCost += cost;
            totalPaid += paid;
            var isOffline = (t.offline === true || t.pendingSync === true);
            var offlineBadge = isOffline ? '<span style="background:#f59e0b; font-size:10px; padding:2px 6px; border-radius:20px; margin-right:8px;">📴 مؤقت</span>' : '';
            var bgStyle = isOffline ? 'background:#fef3c7;' : '';
            treatmentsHtml += '<div style="padding:12px; border-bottom:1px solid #e2e8f0; ' + bgStyle + '"><strong>🦷 السن ' + t.toothNumber + '</strong> - ' + t.treatmentType + offlineBadge + '<br>💰 ' + cost + ' ريال | 💵 ' + paid + ' ريال<br><small>📅 ' + new Date(t.treatmentDate).toLocaleDateString('ar-EG') + '</small></div>';
        }
        
        var remaining = totalCost - totalPaid;
        var remainingColor = remaining > 0 ? '#ef4444' : '#10b981';
        
        var modalHtml = '<div class="modal-content" style="max-width:650px;">';
        modalHtml += '<div class="modal-header"><h3>' + escapeHtml(patient.name) + (isOfflinePatient ? '<span style="background:#f59e0b;font-size:12px;padding:2px 8px;border-radius:20px;margin-right:10px">📴 مؤقت</span>' : '') + '</h3><button class="close-btn" onclick="closeModal(\'patientDetailsModal\')">&times;</button></div>';
        modalHtml += '<div class="modal-body">';
        modalHtml += '<div style="background:#f1f5f9; padding:15px; border-radius:15px; margin-bottom:20px;">';
        modalHtml += '<p><strong>📞 الهاتف:</strong> ' + escapeHtml(patient.phone || 'غير محدد') + '</p>';
        modalHtml += '<p><strong>📅 العمر:</strong> ' + patient.age + ' سنة</p>';
        modalHtml += '<p><strong>📍 العنوان:</strong> ' + escapeHtml(patient.address || 'غير محدد') + '</p>';
        modalHtml += '</div>';
        modalHtml += '<div class="patient-images-section"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><h4>📸 صور المريض</h4><button class="btn" style="width:auto; padding:6px 12px; font-size:12px;" onclick="openAddImageModal(\'' + patient._id + '\')"><i class="fas fa-plus"></i> إضافة صورة</button></div><div id="imagesContainer_' + patient._id + '"></div></div>';
        modalHtml += '<h4>🦷 سجل المعالجات (' + allTreatments.length + ')</h4>';
        modalHtml += '<div style="max-height:300px; overflow-y:auto; margin-bottom:20px;">' + (treatmentsHtml || '<p style="text-align:center;padding:20px;">لا توجد معالجات مسجلة</p>') + '</div>';
        modalHtml += '<div style="background:#e0f2fe; padding:15px; border-radius:15px; margin-bottom:20px;">';
        modalHtml += '<p><strong>💰 إجمالي التكلفة:</strong> ' + totalCost + ' ريال</p>';
        modalHtml += '<p><strong>💵 إجمالي المدفوع:</strong> ' + totalPaid + ' ريال</p>';
        modalHtml += '<p><strong style="color:' + remainingColor + ';">⚠️ المتبقي:</strong> ' + remaining + ' ريال</p>';
        modalHtml += '</div>';
        modalHtml += '<div style="display:flex; gap:10px; flex-wrap:wrap;">';
        modalHtml += '<button class="btn" onclick="closeModal(\'patientDetailsModal\'); editPatient(\'' + patient._id + '\')" style="flex:1;">تعديل</button>';
        modalHtml += '<button class="btn btn-secondary" onclick="closeModal(\'patientDetailsModal\'); showTreatmentModal(\'' + patient._id + '\')" style="flex:1;">إضافة معالجة</button>';
        modalHtml += '<button class="btn btn-whatsapp" onclick="sharePatientWithImages(\'' + patient._id + '\')" style="flex:1;">مشاركة مع الصور</button>';
        modalHtml += '</div></div></div>';
        
        var modal = document.getElementById('patientDetailsModal');
        if (!modal) {
            var d = document.createElement('div');
            d.id = 'patientDetailsModal';
            d.className = 'modal';
            document.body.appendChild(d);
            modal = d;
        }
        modal.innerHTML = modalHtml;
        modal.style.display = 'flex';
        renderPatientImages(pid);
    } catch (error) {
        console.error('Error showing patient details:', error);
        showAlert('dashboardAlert', 'خطأ في جلب بيانات المريض', 'error');
    }
}

// ============ صفحة الادمن ============
async function loadAdminUsers() {
    try {
        var r = await fetch('/api/admin/users');
        allAdminUsers = await r.json();
        renderAdminUsers(allAdminUsers);
    } catch (e) { console.log('Load admin users error:', e); }
}

function renderAdminUsers(users) {
    var c = document.getElementById('adminUsersList');
    if (!c) return;
    if (!users || !users.length) {
        c.innerHTML = '<div style="padding:50px">لا يوجد مستخدمين</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        html += '<div class="patient-card"><div class="patient-header"><h3>' + escapeHtml(u.fullName) + '</h3><div class="patient-actions"><button onclick="toggleUserSubscription(\'' + u._id + '\',' + (!u.isSubscribed) + ')" style="background:' + (u.isSubscribed ? '#ef4444' : '#10b981') + '">' + (u.isSubscribed ? 'تعطيل' : 'تفعيل') + '</button></div></div><div class="patient-body"><p>@' + u.username + '</p><p>' + u.clinicName + '</p><p>المرضى: ' + (u.patientCount || 0) + '</p><p>الحالة: ' + (u.isSubscribed ? '✅ مشترك' : '📊 مجاني') + '</p></div></div>';
    }
    c.innerHTML = html;
}

async function loadAllPatients() {
    try {
        var r = await fetch('/api/admin/patients');
        allAdminPatients = await r.json();
        renderAdminPatients(allAdminPatients);
    } catch (e) { console.log('Load all patients error:', e); }
}

function renderAdminPatients(pts) {
    var c = document.getElementById('adminPatientsList');
    if (!c) return;
    if (!pts || !pts.length) {
        c.innerHTML = '<div style="padding:50px">لا يوجد مرضى</div>';
        return;
    }
    var html = '';
    for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        html += '<div class="patient-card" onclick="showAdminPatientDetails(\'' + p._id + '\')"><div class="patient-header"><h3>' + escapeHtml(p.name) + '</h3></div><div class="patient-body"><p>📞 ' + (p.phone || 'غير محدد') + '</p><p>📅 ' + p.age + ' سنة</p><p>👨‍⚕️ ' + (p.doctorName || 'غير معروف') + '</p></div></div>';
    }
    c.innerHTML = html;
}

async function showAdminPatientDetails(pid) {
    try {
        var r = await fetch('/api/patients/' + pid + '/details');
        var d = await r.json();
        alert('المريض: ' + d.patient.name + '\nالهاتف: ' + d.patient.phone + '\nالعمر: ' + d.patient.age + '\nالمعالجات: ' + (d.treatments ? d.treatments.length : 0));
    } catch (e) { console.log('Show admin patient error:', e); }
}

async function toggleUserSubscription(uid, act) {
    await fetch('/api/admin/users/' + uid + '/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSubscribed: act })
    });
    await loadAdminUsers();
}

function searchAdminUsers() {
    var q = document.getElementById('adminUserSearch').value.toLowerCase();
    if (!q) {
        renderAdminUsers(allAdminUsers);
        return;
    }
    var filtered = [];
    for (var i = 0; i < allAdminUsers.length; i++) {
        var u = allAdminUsers[i];
        if (u.fullName.toLowerCase().indexOf(q) !== -1 || u.username.toLowerCase().indexOf(q) !== -1) {
            filtered.push(u);
        }
    }
    renderAdminUsers(filtered);
}

function searchAdminPatients() {
    var q = document.getElementById('adminPatientSearch').value.toLowerCase();
    if (!q) {
        renderAdminPatients(allAdminPatients);
        return;
    }
    var filtered = [];
    for (var i = 0; i < allAdminPatients.length; i++) {
        var p = allAdminPatients[i];
        if (p.name.toLowerCase().indexOf(q) !== -1 || (p.phone && p.phone.indexOf(q) !== -1)) {
            filtered.push(p);
        }
    }
    renderAdminPatients(filtered);
}

function refreshAdminUsers() {
    loadAdminUsers();
}

function refreshAdminPatients() {
    loadAllPatients();
}

function showAdminPage() {
    // ✅ التحقق من صلاحيات المدير - هذا هو الحل
    if (!currentUser || currentUser.role !== 'admin') {
        showAlert('dashboardAlert', '⚠️ غير مصرح لك بالدخول إلى لوحة المدير', 'error');
        return;
    }
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    document.getElementById('adminUserName').textContent = currentUser.fullName;
    loadAdminUsers();
    loadUsersForNotification();
    loadUsersListForNotification();
    loadAllPatients();
    showAdminTab('users');
}

function showDashboard() {
    document.getElementById('adminPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function showAdminTab(tab) {
    var us = document.getElementById('adminUsersSection');
    var ps = document.getElementById('adminPatientsSection');
    var ub = document.getElementById('tabUsersBtn');
    var pb = document.getElementById('tabPatientsBtn');
    if (tab === 'users') {
        us.style.display = 'block';
        ps.style.display = 'none';
        ub.style.background = '#3b82f6';
        pb.style.background = '#64748b';
    } else {
        us.style.display = 'none';
        ps.style.display = 'block';
        ub.style.background = '#64748b';
        pb.style.background = '#3b82f6';
    }
}

function checkAndShowAdminButton() {
    var adminBtn = document.getElementById('adminBtn');
    if (currentUser && currentUser.role === 'admin') {
        adminBtn.style.display = 'block';
    } else if (adminBtn) {
        adminBtn.style.display = 'none';
    }
}

async function syncAllDataWithServer() {
    if (!navigator.onLine || !currentUser) {
        showAlert('dashboardAlert', 'لا يوجد اتصال بالإنترنت. سيتم المزامنة عند استعادة الاتصال.', 'warning');
        return false;
    }
    showAlert('dashboardAlert', '🔄 جاري المزامنة...', 'success');
    await loadPatients();
    showAlert('dashboardAlert', '✅ تمت المزامنة', 'success');
    return true;
}

// ============ المصادقة ============


    async function register() {
    var data = {
        fullName: document.getElementById('regFullName').value.trim(),
        username: document.getElementById('regUsername').value.trim(),
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        age: parseInt(document.getElementById('regAge').value),
        clinicName: document.getElementById('regClinicName').value.trim(),
        address: document.getElementById('regAddress').value.trim()
    };
    
    // التحقق من الحقول المطلوبة
    if (!data.fullName || data.fullName.length < 3) {
        showAlert('registerAlert', 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل', 'error');
        return;
    }
    
    if (!data.username || data.username.length < 3) {
        showAlert('registerAlert', 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل', 'error');
        return;
    }
    
    // التحقق من كلمة المرور
    const passwordRegex = /^[A-Za-z0-9]{6,}$/;
    if (!data.password || !passwordRegex.test(data.password)) {
        showAlert('registerAlert', 'كلمة المرور يجب أن تكون 6 خانات على الأقل وتحتوي على حروف إنجليزية وأرقام فقط', 'error');
        return;
    }
    
    // التحقق من رقم الهاتف
    const phoneRegex = /^7[0-9]{8}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
        showAlert('registerAlert', 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بالرقم 7 (مثال: 712345678)', 'error');
        return;
    }
    
    // التحقق من اسم المستخدم
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(data.username)) {
        showAlert('registerAlert', 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط', 'error');
        return;
    }
    
    // التحقق من العمر
    if (!data.age || data.age < 18 || data.age > 100) {
        showAlert('registerAlert', 'العمر يجب أن يكون بين 18 و 100 سنة', 'error');
        return;
    }
    
    // التحقق من اسم العيادة
    if (!data.clinicName || data.clinicName.length < 2) {
        showAlert('registerAlert', 'اسم العيادة مطلوب', 'error');
        return;
    }
    
    if (navigator.onLine) {
        try {
            var response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            var result = await response.json();
            
            if (response.ok && result.success) {
                // ✅ تسجيل الدخول التلقائي
                currentUser = result.user;
                
                // حفظ البيانات في localStorage
                try {
                    localStorage.setItem('userId', currentUser.id);
                    saveOfflineAuth(currentUser, data.password);
                } catch(e) { console.log('Save error:', e); }
                
                // إخفاء صفحات التسجيل والدخول
                document.getElementById('registerPage').style.display = 'none';
                document.getElementById('loginPage').style.display = 'none';
                
                // ✅ تحميل لوحة التحكم مباشرة
                await loadDashboard();
                
                showAlert('dashboardAlert', '✅ تم إنشاء الحساب وتسجيل الدخول بنجاح', 'success');
            } else {
                showAlert('registerAlert', result.message || 'فشل إنشاء الحساب', 'error');
            }
        } catch (e) {
            console.log('Registration error:', e);
            showAlert('registerAlert', 'خطأ في الاتصال بالخادم', 'error');
        }
    } else {
        showAlert('registerAlert', 'لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت للتسجيل', 'error');
    }
    }

async function login() {
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showAlert('loginAlert', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    if (navigator.onLine) {
        try {
            // إرسال طلب تسجيل الدخول بشكل صحيح
            var response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            var result = await response.json();
            
            if (response.ok && result.success) {
                currentUser = result.user;
                try {
                    localStorage.setItem('userId', currentUser.id);
                    saveOfflineAuth(currentUser, password);
                } catch(storageError) {
                    console.log('⚠️ تعذر حفظ البيانات في localStorage');
                }
                
                // جلب المرضى من السيرفر
                try {
                    var patientsRes = await fetch('/api/patients/' + currentUser.id);
                    if (patientsRes.ok) {
                        var patients = await patientsRes.json();
                        allPatients = patients;
                        saveCompleteOfflineData(currentUser, allPatients, []);
                        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(allPatients));
                    }
                } catch(e) {
                    console.log('Error loading patients:', e);
                }
                
                await loadDashboard();
                showAlert('dashboardAlert', '✅ تم تسجيل الدخول بنجاح', 'success');
            } else {
                showAlert('loginAlert', result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            }
        } catch (e) {
            console.log('خطأ في الاتصال:', e.message);
            showAlert('loginAlert', 'لا يمكن الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت', 'error');
            // محاولة تسجيل الدخول محلياً
            await tryLocalLogin(username, password);
        }
    } else {
        // وضع عدم الاتصال
        await tryLocalLogin(username, password);
    }
}

async function tryLocalLogin(username, password) {
    try {
        var savedAuth = getOfflineAuth();
        if (savedAuth && savedAuth.username === username && savedAuth.password === password) {
            var offlineData = getCompleteOfflineData(savedAuth.userId);
            if (offlineData) {
                currentUser = offlineData.user;
                allPatients = offlineData.patients || [];
                try {
                    localStorage.setItem('userId', currentUser.id);
                } catch(e) { console.log('Save error:', e); }
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('registerPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('userNameDisplay').textContent = currentUser.fullName;
                renderPatients(allPatients);
                document.getElementById('totalPatients').textContent = allPatients.length;
                document.getElementById('remainingSlots').textContent = currentUser.role === 'admin' ? 'غير محدود' : Math.max(0, 5 - allPatients.length);
                var badge = document.getElementById('subscriptionBadge');
                if (currentUser.role === 'admin') {
                    badge.innerHTML = '👑 مدير';
                    badge.className = 'subscription-badge subscription-active';
                } else if (currentUser.isSubscribed) {
                    badge.innerHTML = '✨ مشترك';
                    badge.className = 'subscription-badge subscription-active';
                } else {
                    badge.innerHTML = '📊 مجاني';
                    badge.className = 'subscription-badge subscription-inactive';
                }
                if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
                showAlert('dashboardAlert', '📴 وضع عدم الاتصال - تعمل بنسخة محفوظة', 'warning');
                document.body.classList.add('offline-mode');
                return true;
            }
        }
        showAlert('loginAlert', 'لا توجد بيانات محفوظة أو فشل الاتصال بالخادم', 'error');
        return false;
    } catch (e) {
        console.log('خطأ في تسجيل الدخول المحلي:', e);
        showAlert('loginAlert', 'حدث خطأ في تسجيل الدخول', 'error');
        return false;
    }
}

async function loadDashboard() {
    var uid = null;
    try {
        uid = localStorage.getItem('userId');
    } catch(e) {
        console.log('⚠️ Safari: لا يمكن قراءة localStorage');
        if (window.tempUser) {
            uid = window.tempUser.id;
            currentUser = window.tempUser;
            allPatients = window.tempPatients || [];
        }
    }
    if (!uid && !currentUser) {
        showLogin();
        return;
    }
    if (currentUser && !uid) uid = currentUser.id;
    
    var savedData = null;
    try {
        var dataStr = localStorage.getItem('offline_data_' + uid);
        if (dataStr) savedData = JSON.parse(dataStr);
    } catch(e) {
        console.log('⚠️ Safari: خطأ في قراءة البيانات المخزنة');
    }
    
    if (savedData) {
        currentUser = savedData.user;
        allPatients = savedData.patients || [];
        renderPatients(allPatients);
        document.getElementById('totalPatients').textContent = allPatients.length;
        document.getElementById('remainingSlots').textContent = currentUser.role === 'admin' ? 'غير محدود' : Math.max(0, 5 - allPatients.length);
        document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
        var badge = document.getElementById('subscriptionBadge');
        if (currentUser.role === 'admin') {
            badge.innerHTML = '👑 مدير';
            badge.className = 'subscription-badge subscription-active';
        } else if (currentUser.isSubscribed) {
            badge.innerHTML = '✨ مشترك';
            badge.className = 'subscription-badge subscription-active';
        } else {
            badge.innerHTML = '📊 مجاني';
            badge.className = 'subscription-badge subscription-inactive';
        }
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
        var subBtn = document.getElementById('subscriptionBtn');
        if (subBtn) {
            if (currentUser.role === 'admin' || currentUser.isSubscribed) {
                subBtn.style.display = 'none';
            } else {
                subBtn.style.display = 'flex';
            }
        }
        checkConnectionStatus();
        checkPatientLimit();
    
        updateNotificationBadge();

        
        if (navigator.onLine) {
            try {
                var r = await fetchWithTimeout('/api/user/' + uid, 8000);
                if (r.ok) {
                    var userData = await r.json();
                    currentUser = userData.user;
                    try {
                        localStorage.setItem('offline_data_' + uid, JSON.stringify({ user: currentUser, patients: allPatients, savedAt: new Date().toISOString() }));
                    } catch(e) { console.log('Save error:', e); }
                    document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
                    if (currentUser.role === 'admin') {
                        document.getElementById('subscriptionBadge').innerHTML = '👑 مدير';
                    } else if (currentUser.isSubscribed) {
                        document.getElementById('subscriptionBadge').innerHTML = '✨ مشترك';
                    } else {
                        document.getElementById('subscriptionBadge').innerHTML = '📊 مجاني';
                    }
                    if (subBtn) {
                        if (currentUser.role === 'admin' || currentUser.isSubscribed) {
                            subBtn.style.display = 'none';
                        } else {
                            subBtn.style.display = 'flex';
                        }
                    }
                }
                
                var patientsRes = await fetchWithTimeout('/api/patients/' + uid, 8000);
                if (patientsRes.ok) {
                    var serverPatients = await patientsRes.json();
                    var offlinePatients = [];
                    try {
                        offlinePatients = JSON.parse(localStorage.getItem('offline_patients_' + uid) || '[]');
                    } catch(e) { console.log('Parse error:', e); }
                    var pendingOffline = [];
                    for (var i = 0; i < offlinePatients.length; i++) {
                        if (offlinePatients[i].pendingSync === true) {
                            pendingOffline.push(offlinePatients[i]);
                        }
                    }
                    allPatients = pendingOffline.concat(serverPatients);
                    renderPatients(allPatients);
                    document.getElementById('totalPatients').textContent = allPatients.length;
                    saveAllDataToLocal();
                }
                if (typeof syncPatientImagesToServer === 'function') await syncPatientImagesToServer();
            } catch (e) {
                console.log('⚠️ Safari: فشل الاتصال بالسيرفر - استخدام البيانات المخزنة');
            }
        }
        return;
    }
    
    if (navigator.onLine) {
        try {
            var r = await fetchWithTimeout('/api/user/' + uid, 8000);
            if (r.ok) {
                var userData = await r.json();
                currentUser = userData.user;
                try {
                    localStorage.setItem('offline_data_' + uid, JSON.stringify({ user: currentUser, patients: [], savedAt: new Date().toISOString() }));
                } catch(e) { console.log('Save error:', e); }
                var patientsRes = await fetch('/api/patients/' + uid);
                if (patientsRes.ok) {
                    allPatients = await patientsRes.json();
                    renderPatients(allPatients);
                    saveAllDataToLocal();
                }
            } else {
                showLogin();
                return;
            }
        } catch (e) {
            console.log('⚠️ Safari: فشل الاتصال بالسيرفر');
            showLogin();
            return;
        }
    } else {
        showLogin();
        return;
    }
    
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
    var badge = document.getElementById('subscriptionBadge');
    if (currentUser.role === 'admin') {
        badge.innerHTML = '👑 مدير';
        badge.className = 'subscription-badge subscription-active';
    } else if (currentUser.isSubscribed) {
        badge.innerHTML = '✨ مشترك';
        badge.className = 'subscription-badge subscription-active';
    } else {
        badge.innerHTML = '📊 مجاني';
        badge.className = 'subscription-badge subscription-inactive';
    }
    if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
    var subBtn = document.getElementById('subscriptionBtn');
    if (subBtn) {
        if (currentUser.role === 'admin' || currentUser.isSubscribed) {
            subBtn.style.display = 'none';
        } else {
            subBtn.style.display = 'flex';
        }
    }
    await loadStats();
    checkConnectionStatus();
    // في نهاية loadDashboard() تأكد من وجود
checkAndShowAdminButton();
    checkPatientLimit();
    updateNotificationBadge();
    if (navigator.onLine && typeof syncPatientImagesToServer === 'function') await syncPatientImagesToServer();
}

async function syncAllOfflineData() {
    if (!navigator.onLine || !currentUser) {
        console.log('📴 Cannot sync: offline or no user');
        return false;
    }
    console.log('🔄 بدء المزامنة مع السيرفر...');
    showAlert('dashboardAlert', '🔄 جاري مزامنة البيانات مع الخادم...', 'success');
    var syncedPatients = 0;
    var failedPatients = [];
    var syncedTreatments = 0;
    
    var offlinePatients = [];
    try {
        offlinePatients = JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
    } catch(e) { console.log('Parse error:', e); }
    
    var pendingPatients = [];
    for (var i = 0; i < offlinePatients.length; i++) {
        if (offlinePatients[i].pendingSync === true) {
            pendingPatients.push(offlinePatients[i]);
        }
    }
    console.log('📋 Found ' + pendingPatients.length + ' pending patients to sync');
    
    for (var i = 0; i < pendingPatients.length; i++) {
        var p = pendingPatients[i];
        try {
            var r = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: p.name,
                    phone: p.phone,
                    age: p.age,
                    address: p.address,
                    notes: p.notes,
                    userId: currentUser.id
                })
            });
            if (r.ok) {
                var result = await r.json();
                console.log('✅ Synced patient: ' + p.name + ' -> ID: ' + result.patient._id);
                for (var j = 0; j < allPatients.length; j++) {
                    if (allPatients[j]._id === p._id) {
                        allPatients[j]._id = result.patient._id;
                        allPatients[j].pendingSync = false;
                        allPatients[j].offline = false;
                        break;
                    }
                }
                syncedPatients++;
            } else {
                console.error('❌ Failed to sync patient: ' + p.name);
                failedPatients.push(p);
            }
        } catch (e) {
            console.error('❌ Error syncing patient ' + p.name + ':', e);
            failedPatients.push(p);
        }
    }
    
    if (syncedPatients > 0) {
        var remainingPatients = [];
        for (var i = 0; i < offlinePatients.length; i++) {
            var isFailed = false;
            for (var j = 0; j < failedPatients.length; j++) {
                if (offlinePatients[i]._id === failedPatients[j]._id) {
                    isFailed = true;
                    break;
                }
            }
            if (offlinePatients[i].pendingSync === true && isFailed) {
                remainingPatients.push(offlinePatients[i]);
            } else if (!offlinePatients[i].pendingSync) {
                remainingPatients.push(offlinePatients[i]);
            }
        }
        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(remainingPatients));
        console.log('🗑️ Removed ' + syncedPatients + ' synced patients from local storage');
    }
    
    var offlineTreatments = [];
    try {
        offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    } catch(e) { console.log('Parse error:', e); }
    
    var pendingTreatments = [];
    for (var i = 0; i < offlineTreatments.length; i++) {
        if (offlineTreatments[i].pendingSync === true) {
            pendingTreatments.push(offlineTreatments[i]);
        }
    }
    
    for (var i = 0; i < pendingTreatments.length; i++) {
        var t = pendingTreatments[i];
        try {
            var patientId = t.patientId;
            if (patientId.indexOf('offline_') === 0) {
                var matchedPatient = null;
                for (var j = 0; j < allPatients.length; j++) {
                    if (allPatients[j]._id === patientId || allPatients[j].name === t.patientName) {
                        matchedPatient = allPatients[j];
                        break;
                    }
                }
                if (matchedPatient && matchedPatient._id.indexOf('offline_') !== 0) {
                    patientId = matchedPatient._id;
                } else {
                    console.warn('⚠️ Cannot find patient for treatment, keeping in queue');
                    continue;
                }
            }
            var r = await fetch('/api/treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patientId,
                    userId: currentUser.id,
                    toothNumber: t.toothNumber,
                    treatmentType: t.treatmentType,
                    cost: t.cost,
                    notes: t.notes,
                    treatmentDate: t.treatmentDate
                })
            });
            if (r.ok) syncedTreatments++;
            else console.error('❌ Failed to sync treatment:', await r.text());
        } catch (e) {
            console.error('❌ Error syncing treatment:', e);
        }
    }
    
    if (syncedTreatments > 0) {
        var remainingTreatments = [];
        for (var i = 0; i < offlineTreatments.length; i++) {
            if (!offlineTreatments[i].pendingSync) {
                remainingTreatments.push(offlineTreatments[i]);
            }
        }
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(remainingTreatments));
    }
    
    if (syncedPatients > 0 || syncedTreatments > 0) {
        await loadPatients();
        renderPatients(allPatients);
        saveAllDataToLocal();
        if (failedPatients.length > 0) {
            showAlert('dashboardAlert', '⚠️ تمت المزامنة جزئياً: ' + syncedPatients + ' مريض ناجح، ' + failedPatients.length + ' في انتظار إعادة المحاولة', 'warning');
        } else {
            showAlert('dashboardAlert', '✅ تمت المزامنة: ' + syncedPatients + ' مريض، ' + syncedTreatments + ' معالجة', 'success');
        }
    } else {
        showAlert('dashboardAlert', '✅ لا توجد بيانات جديدة للمزامنة', 'success');
    }
    document.body.classList.remove('offline-mode');
    return syncedPatients > 0 || syncedTreatments > 0;
}

// ============ أحداث ============
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
});
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    register();
});
document.getElementById('patientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var data = {
        name: document.getElementById('patientName').value,
        phone: document.getElementById('patientPhone').value,
        age: parseInt(document.getElementById('patientAge').value),
        address: document.getElementById('patientAddress').value,
        notes: document.getElementById('patientNotes').value
    };
    if (document.getElementById('patientId').value) {
        updatePatient(document.getElementById('patientId').value, data);
    } else {
        addPatient(data);
    }
});

try {
    if (localStorage.getItem('userId')) {
        loadDashboard();
    } else {
        showLogin();
    }
} catch(e) {
    showLogin();
}

window.onload = function() {
    try {
        if (localStorage.getItem('userId')) {
            loadDashboard();
        } else {
            showLogin();
        }
    } catch(e) {
        showLogin();
    }
    checkConnectionStatus();
};



// ============ إدارة صور المرضى ============
function savePatientImageLocally(patientId, imageData, caption) {
    var patientImages = {};
    try {
        patientImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
    } catch(e) { console.log('Parse error:', e); }
    if (!patientImages[patientId]) patientImages[patientId] = [];
    var newImage = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        data: imageData,
        caption: caption || '',
        createdAt: new Date().toISOString(),
        pendingSync: true
    };
    patientImages[patientId].push(newImage);
    localStorage.setItem('patient_images_' + currentUser.id, JSON.stringify(patientImages));
    return newImage;
}

function getPatientImages(patientId) {
    var allImages = {};
    try {
        allImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
    } catch(e) { return []; }
    return allImages[patientId] || [];
}

function deletePatientImage(patientId, imageId) {
    var patientImages = {};
    try {
        patientImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
    } catch(e) { return []; }
    if (patientImages[patientId]) {
        var newImages = [];
        for (var i = 0; i < patientImages[patientId].length; i++) {
            if (patientImages[patientId][i].id !== imageId) {
                newImages.push(patientImages[patientId][i]);
            }
        }
        patientImages[patientId] = newImages;
        localStorage.setItem('patient_images_' + currentUser.id, JSON.stringify(patientImages));
    }
    return patientImages[patientId] || [];
}

// ============ عرض صور المريض (مصغرة مع زر حفظ) ============


              // ============ عرض الصور من السيرفر ============

async function renderPatientImages(patientId) {
    console.log('🎯 جاري تحميل صور المريض من السيرفر:', patientId);
    
    var container = document.getElementById('imagesContainer_' + patientId);
    if (!container) {
        console.log('❌ الحاوية غير موجودة للمريض:', patientId);
        return;
    }
    
    // عرض رسالة تحميل
    container.innerHTML = '<div style="text-align:center;padding:20px;">🔄 جاري تحميل الصور من السيرفر...</div>';
    
    var images = [];
    
    // ✅ جلب الصور من السيرفر فقط
    if (navigator.onLine) {
        try {
            var response = await fetch('/api/patient-images/' + patientId + '/' + currentUser.id);
            
            if (response.ok) {
                var serverImages = await response.json();
                console.log('📸 تم جلب الصور من السيرفر:', serverImages.length);
                images = serverImages;
            } else {
                console.log('❌ فشل جلب الصور من السيرفر، الحالة:', response.status);
                container.innerHTML = `
                    <div style="text-align:center;padding:30px;color:#ef4444;background:#fef2f2;border-radius:12px;">
                        ❌ فشل تحميل الصور من السيرفر<br>
                        <small>الرمز: ${response.status}</small>
                    </div>
                `;
                return;
            }
        } catch(e) { 
            console.log('❌ خطأ في الاتصال بالسيرفر:', e);
            container.innerHTML = `
                <div style="text-align:center;padding:30px;color:#ef4444;background:#fef2f2;border-radius:12px;">
                    ❌ لا يمكن الاتصال بالسيرفر<br>
                    <small>${e.message}</small>
                </div>
            `;
            return;
        }
    } else {
        container.innerHTML = `
            <div style="text-align:center;padding:30px;color:#f59e0b;background:#fef3c7;border-radius:12px;">
                📴 لا يوجد اتصال بالإنترنت<br>
                <small>سيتم عرض الصور عند استعادة الاتصال</small>
            </div>
        `;
        return;
    }
    
    if (!images || images.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:30px;color:#64748b;background:#f8fafc;border-radius:12px;">
                📷 لا توجد صور لهذا المريض<br>
                <small>اضغط على "إضافة صورة" لإضافة صور جديدة</small>
            </div>
        `;
        return;
    }
    
    // عرض الصور
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px;">';
    
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var imageSrc = img.data || img.imageData || img.url;
        var imageCaption = img.caption || 'صورة ' + (i + 1);
        
        if (!imageSrc) {
            console.log('⚠️ صورة بدون بيانات:', img);
            continue;
        }
        
        html += `
            <div style="position:relative;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
                <div style="cursor:pointer;" onclick="viewFullImage('${patientId}', '${img._id || img.id}', '${imageSrc.replace(/'/g, "\\'")}', '${imageCaption.replace(/'/g, "\\'")}')">
                    <img src="${imageSrc}" style="width:100%;height:100px;object-fit:cover;display:block;">
                </div>
                <div style="padding:8px;display:flex;justify-content:space-between;align-items:center;background:white;">
                    <span style="font-size:10px;color:#64748b;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                        ${escapeHtml(imageCaption.length > 15 ? imageCaption.substring(0,15)+'...' : imageCaption)}
                    </span>
                    <button onclick="saveImageToDevice('${imageSrc.replace(/'/g, "\\'")}')" 
                            style="background:#10b981;color:white;border:none;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:11px;">
                        <i class="fas fa-download"></i> حفظ
                    </button>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    console.log('✅ تم عرض', images.length, 'صور بنجاح');
}  


// ============ دالة حفظ الصورة على الجهاز ============

async function saveImageToDevice(imageDataUrl) {
    try {
        // إظهار رسالة جاري الحفظ
        showAlert('dashboardAlert', '🔄 جاري حفظ الصورة...', 'info');
        
        // تحويل data URL إلى Blob
        var response = await fetch(imageDataUrl);
        var blob = await response.blob();
        
        // إنشاء رابط مؤقت للتحميل
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        
        // إنشاء اسم ملف فريد
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = 'clinicpro_image_' + timestamp + '.jpg';
        
        // تنفيذ التحميل
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // تنظيف الرابط المؤقت
        URL.revokeObjectURL(url);
        
        showAlert('dashboardAlert', '✅ تم حفظ الصورة بنجاح في جهازك', 'success');
    } catch (error) {
        console.error('Error saving image:', error);
        showAlert('dashboardAlert', '❌ فشل حفظ الصورة', 'error');
        
        // طريقة بديلة للمتصفحات التي لا تدعم الطريقة الأولى
        try {
            var link = document.createElement('a');
            link.href = imageDataUrl;
            link.download = 'clinicpro_image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showAlert('dashboardAlert', '✅ تم حفظ الصورة بنجاح', 'success');
        } catch(e) {
            showAlert('dashboardAlert', '❌ اضغط مع الاستمرار على الصورة واختر "حفظ الصورة"', 'warning');
        }
    }
}

// ============ دالة حذف الصورة ============

async function deletePatientImage(patientId, imageId) {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    
    showAlert('dashboardAlert', '🔄 جاري حذف الصورة...', 'info');
    
    // حذف من localStorage
    try {
        var allImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
        if (allImages[patientId]) {
            allImages[patientId] = allImages[patientId].filter(img => img.id !== imageId && img._id !== imageId);
            localStorage.setItem('patient_images_' + currentUser.id, JSON.stringify(allImages));
        }
    } catch(e) { console.log('Error deleting from localStorage:', e); }
    
    // حذف من السيرفر إذا كان متصلاً
    if (navigator.onLine) {
        try {
            await fetch('/api/patient-images/' + imageId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id, patientId: patientId })
            });
        } catch(e) { console.log('Error deleting from server:', e); }
    }
    
    // تحديث العرض
    await renderPatientImages(patientId);
    showAlert('dashboardAlert', '✅ تم حذف الصورة بنجاح', 'success');
}

function viewFullImage(imageData) {
    var viewer = document.createElement('div');
    viewer.className = 'image-viewer';
    viewer.onclick = function() { viewer.remove(); };
    viewer.innerHTML = '<button class="image-viewer-close" onclick="this.parentElement.remove()">&times;</button><img src="' + imageData + '" alt="صورة مكبرة">';
    document.body.appendChild(viewer);
}

function deleteImageConfirm(patientId, imageId) {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
        deletePatientImage(patientId, imageId);
        renderPatientImages(patientId);
        showAlert('dashboardAlert', '✅ تم حذف الصورة', 'success');
    }
}

var currentImagePatientId = null;

function openAddImageModal(patientId) {
    currentImagePatientId = patientId;
    document.getElementById('imageFileInput').value = '';
    document.getElementById('imageCaption').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('addImageModal').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('imageFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var preview = document.getElementById('previewImg');
                    preview.src = e.target.result;
                    document.getElementById('imagePreview').style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});


// ============ حفظ الصورة على السيرفر (معدلة) ============
// ============ حفظ الصورة مع الضغط ============

// ============ حفظ الصورة (نسخة مبسطة) ============

// ============ حفظ الصورة (نسخة مباشرة بدون ضغط) ============


                    // ============ ضغط الصورة وحفظها ============

async function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = quality || 0.7;
    
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('الرجاء اختيار صورة صالحة'));
            return;
        }
        
        console.log('📸 بدء ضغط الصورة:', file.name);
        console.log('📸 الحجم الأصلي:', (file.size / 1024).toFixed(1), 'KB');
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                // حساب الأبعاد الجديدة
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                // إنشاء Canvas للضغط
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // ضغط الصورة
                let compressedData = canvas.toDataURL('image/jpeg', quality);
                
                // إذا كان الحجم لا يزال كبيراً، قلل الجودة أكثر
                let currentQuality = quality;
                while (compressedData.length > 500 * 1024 && currentQuality > 0.3) {
                    currentQuality -= 0.1;
                    compressedData = canvas.toDataURL('image/jpeg', currentQuality);
                }
                
                console.log('📸 الحجم بعد الضغط:', (compressedData.length / 1024).toFixed(1), 'KB');
                console.log('📸 الأبعاد الجديدة:', width + 'x' + height);
                console.log('📸 الجودة:', currentQuality);
                console.log('📸 نوع البيانات:', typeof compressedData);
                
                resolve(compressedData);
            };
            
            img.onerror = function() {
                reject(new Error('فشل تحميل الصورة'));
            };
        };
        
        reader.onerror = function() {
            reject(new Error('فشل قراءة الملف'));
        };
    });
}

// ============ حفظ الصورة مع الضغط ============

async function savePatientImage() {
    const fileInput = document.getElementById('imageFileInput');
    const caption = document.getElementById('imageCaption').value;
    
    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert('dashboardAlert', '❌ الرجاء اختيار صورة', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    if (!file.type.startsWith('image/')) {
        showAlert('dashboardAlert', '❌ الرجاء اختيار ملف صورة صالح', 'error');
        return;
    }
    
    // التحقق من حجم الملف الأصلي
    if (file.size > 10 * 1024 * 1024) {
        showAlert('dashboardAlert', '❌ الصورة كبيرة جداً (الحد الأقصى 10MB)', 'error');
        return;
    }
    
    showAlert('dashboardAlert', '🔄 جاري ضغط ورفع الصورة...', 'info');
    
    try {
        // 1. ضغط الصورة
        const compressedData = await compressImage(file, 800, 0.7);
        
        // 2. التحقق من صحة البيانات
        if (!compressedData || typeof compressedData !== 'string') {
            throw new Error('فشل ضغط الصورة');
        }
        
        if (!compressedData.startsWith('data:image')) {
            throw new Error('تنسيق الصورة غير صالح');
        }
        
        console.log('📤 إرسال إلى السيرفر...');
        console.log('📤 حجم البيانات المرسلة:', (compressedData.length / 1024).toFixed(1), 'KB');
        
        // 3. إرسال إلى السيرفر
        const response = await fetch('/api/patient-images', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                patientId: currentImagePatientId,
                userId: currentUser.id,
                imageData: compressedData,
                caption: caption || ''
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ خطأ من السيرفر:', errorText);
            throw new Error('فشل رفع الصورة: ' + response.status);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('dashboardAlert', '✅ تم حفظ الصورة بنجاح', 'success');
            closeModal('addImageModal');
            
            // تحديث عرض الصور
            await renderPatientImages(currentImagePatientId);
            
            // إفراغ الحقول
            document.getElementById('imageFileInput').value = '';
            document.getElementById('imageCaption').value = '';
            document.getElementById('imagePreview').style.display = 'none';
        } else {
            throw new Error(result.error || 'فشل حفظ الصورة');
        }
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        showAlert('dashboardAlert', '❌ فشل حفظ الصورة: ' + error.message, 'error');
    }
}

        
// ============ إنشاء رابط عام لمشاركة الصور (بدون تسجيل دخول) ============

async function generatePublicShareLink(patientId) {
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === patientId) {
            patient = allPatients[i];
            break;
        }
    }
    if (!patient) return null;
    
    // إنشاء توكن فريد للمشاركة
    var token = btoa(patientId + '_' + Date.now() + '_' + Math.random());
    
    // حفظ التوكن مع بيانات المريض في localStorage (مؤقت)
    var shareData = {
        patientId: patientId,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAge: patient.age,
        patientAddress: patient.address,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // صلاحية 7 أيام
    };
    localStorage.setItem('share_token_' + token, JSON.stringify(shareData));
    
    // إنشاء الرابط الكامل
    var baseUrl = window.location.origin;
    var shareUrl = baseUrl + '/view-images.html?id=' + patientId + '&token=' + encodeURIComponent(token);
    
    return {
        url: shareUrl,
        token: token,
        expiresAt: shareData.expiresAt
    };
}

// ============ دالة المشاركة المعدلة (مع رابط عام) ============

async function sharePatientWithImages(patientId) {
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === patientId) {
            patient = allPatients[i];
            break;
        }
    }
    if (!patient) return;
    
    showAlert('dashboardAlert', '🔄 جاري تجهيز رابط المشاركة...', 'info');
    
    // جلب سجل المعالجات
    var treatments = [];
    try {
        var localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        for (var i = 0; i < localTreatments.length; i++) {
            if (localTreatments[i].patientId === patientId) {
                treatments.push(localTreatments[i]);
            }
        }
    } catch(e) {}
    
    if (navigator.onLine) {
        try {
            var response = await fetch('/api/treatments/patient/' + patientId);
            if (response.ok) {
                var serverTreatments = await response.json();
                for (var i = 0; i < serverTreatments.length; i++) {
                    var exists = false;
                    for (var j = 0; j < treatments.length; j++) {
                        if (treatments[j]._id === serverTreatments[i]._id) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        treatments.push(serverTreatments[i]);
                    }
                }
            }
        } catch(e) {}
    }
    
    // حساب الإجماليات
    var totalCost = 0;
    var totalPaid = 0;
    var treatmentsText = '';
    
    if (treatments.length > 0) {
        treatmentsText = '\n\n🦷 *سجل المعالجات:*\n━━━━━━━━━━━━━━━━━━━━\n';
        for (var i = 0; i < treatments.length; i++) {
            var t = treatments[i];
            var cost = t.cost || 0;
            var paid = t.paid || 0;
            
            if (!paid && t.notes) {
                var match = t.notes.match(/المدفوع:\s*([\d.]+)/);
                if (match) paid = parseFloat(match[1]);
            }
            
            totalCost += cost;
            totalPaid += paid;
            
            var date = t.treatmentDate ? new Date(t.treatmentDate).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
            var remaining = cost - paid;
            var remainingText = remaining > 0 ? '⚠️ متبقي: ' + remaining + ' ريال' : '✅ مدفوع بالكامل';
            
            treatmentsText += `\n📌 *المعالجة ${i+1}:*\n`;
            treatmentsText += `   🦷 السن: ${t.toothNumber || 'غير محدد'}\n`;
            treatmentsText += `   💊 النوع: ${t.treatmentType || 'غير محدد'}\n`;
            treatmentsText += `   💰 التكلفة: ${cost} ريال\n`;
            treatmentsText += `   💵 المدفوع: ${paid} ريال\n`;
            treatmentsText += `   ${remainingText}\n`;
            treatmentsText += `   📅 التاريخ: ${date}\n`;
        }
        
        var remainingTotal = totalCost - totalPaid;
        treatmentsText += `\n📊 *الإجمالي:*\n`;
        treatmentsText += `   💰 إجمالي التكلفة: ${totalCost} ريال\n`;
        treatmentsText += `   💵 إجمالي المدفوع: ${totalPaid} ريال\n`;
        treatmentsText += `   ⚠️ المتبقي: ${remainingTotal} ريال\n`;
    } else {
        treatmentsText = '\n\n🦷 *سجل المعالجات:*\n━━━━━━━━━━━━━━━━━━━━\nلا توجد معالجات مسجلة\n';
    }
    
    // ✅ إنشاء رابط عام للمشاركة
    var shareLink = await generatePublicShareLink(patientId);
    
    // بناء الرسالة
    var message = '*🦷 تقرير المريض - ' + patient.name + '*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';
    message += '👤 *الاسم:* ' + patient.name + '\n';
    message += '📞 *الهاتف:* ' + (patient.phone || 'غير مسجل') + '\n';
    message += '📅 *العمر:* ' + patient.age + ' سنة\n';
    message += '📍 *العنوان:* ' + (patient.address || 'غير مسجل') + '\n';
    message += treatmentsText;
    message += '\n━━━━━━━━━━━━━━━━━━━━\n';
    message += '📸 *رابط مشاهدة جميع صور المريض:*\n';
    message += shareLink.url + '\n';
    message += '\n💡 *ملاحظة:* الرابط صالح لمدة 7 أيام\n';
    message += '🔒 يمكن لأي شخص لديه الرابط مشاهدة الصور بدون حاجة لتسجيل دخول\n';
    message += '\n🦷 *ClinicPro - نظام إدارة عيادات الأسنان*';
    
    // إرسال الرسالة عبر واتساب
    var phoneNumber = patient.phone || '967773041464';
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('7') && phoneNumber.length === 9) {
        phoneNumber = '967' + phoneNumber;
    }
    
    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
    
    showAlert('dashboardAlert', '✅ تم إنشاء رابط مشاركة لصور ' + patient.name + ' وفتح واتساب', 'success');
}
   


                // ============ ضغط الصور (نسخة مضمونة 100%) ============

// ============ ضغط الصورة (نسخة مبسطة ونظيفة) ============

async function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('الرجاء اختيار صورة صالحة'));
            return;
        }
        
        console.log('📸 قراءة الصورة:', file.name);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = function(e) {
            const result = e.target.result;
            console.log('📸 تمت القراءة بنجاح، نوع البيانات:', typeof result);
            console.log('📸 حجم البيانات:', (result.length / 1024).toFixed(1), 'KB');
            resolve(result);
        };
        
        reader.onerror = function() {
            reject(new Error('فشل قراءة الملف'));
        };
    });
}

// ============ Service Worker معطل نهائياً ============
console.log('Service Worker disabled for compatibility');

// زر تثبيت التطبيق - معطل على iOS
var deferredPrompt;
window.addEventListener('beforeinstallprompt', function(e) {
    var ua = navigator.userAgent;
    var isIOS = (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1);
    if (isIOS) {
        e.preventDefault();
        return false;
    }
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ يمكن تثبيت التطبيق');
    setTimeout(function() {
        if (document.getElementById('installButton')) return;
        var installBtn = document.createElement('div');
        installBtn.id = 'installButton';
        installBtn.innerHTML = '<button style="position: fixed; bottom: 20px; left: 20px; background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 50px; z-index: 10000; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px;"><i class="fas fa-download"></i>تثبيت التطبيق</button>';
        installBtn.querySelector('button').onclick = async function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                var result = await deferredPrompt.userChoice;
                deferredPrompt = null;
                installBtn.remove();
            }
        };
        document.body.appendChild(installBtn);
        setTimeout(function() { if (installBtn) installBtn.remove(); }, 30000);
    }, 2000);
});

window.addEventListener('appinstalled', function(evt) {
    console.log('✅ App installed successfully!');
    var installBtn = document.getElementById('installButton');
    if (installBtn) installBtn.remove();
});

function checkOnlineStatus() {
    if (navigator.onLine) {
        console.log('✅ Online');
        document.body.classList.remove('offline-mode');
    } else {
        console.log('📴 Offline');
        document.body.classList.add('offline-mode');
        showOfflineNotification();
    }
}

function showOfflineNotification() {
    var oldOffline = document.getElementById('offlineNotification');
    if (oldOffline) oldOffline.remove();
    var offlineDiv = document.createElement('div');
    offlineDiv.id = 'offlineNotification';
    offlineDiv.innerHTML = '<div style="position: fixed; top: 70px; left: 20px; right: 20px; background: #ef4444; color: white; padding: 10px; border-radius: 12px; text-align: center; z-index: 10000; display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-wifi-slash"></i><span>لا يوجد اتصال بالإنترنت. سيتم حفظ البيانات محلياً والمزامنة تلقائياً عند استعادة الاتصال.</span><button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 20px; cursor: pointer;">إغلاق</button></div>';
    document.body.appendChild(offlineDiv);
    setTimeout(function() { if (offlineDiv) offlineDiv.remove(); }, 8000);
}

async function clearOldCaches() {
    if ('caches' in window) {
        try {
            var cacheKeys = await caches.keys();
            var currentVersion = Date.now();
            for (var i = 0; i < cacheKeys.length; i++) {
                var key = cacheKeys[i];
                if (key.indexOf('clinicpro') !== -1 && key.indexOf(currentVersion.toString()) === -1) {
                    console.log('🗑️ Deleting old cache:', key);
                    await caches.delete(key);
                }
            }
        } catch (error) {
            console.log('Error clearing caches:', error);
        }
    }
}

window.addEventListener('online', function() {
    console.log('🔄 Connection restored');
    var offlineDiv = document.getElementById('offlineNotification');
    if (offlineDiv) offlineDiv.remove();
    if (typeof syncAllDataWithServer === 'function') syncAllDataWithServer();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (var i = 0; i < registrations.length; i++) {
                registrations[i].update();
            }
        });
    }
});

window.addEventListener('offline', function() {
    console.log('📴 Connection lost');
    showOfflineNotification();
});

clearOldCaches();
checkOnlineStatus();

document.addEventListener('visibilitychange', function() {
    if (!document.hidden && navigator.onLine) {
        console.log('🔄 Page visible, checking for updates...');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (var i = 0; i < registrations.length; i++) {
                    registrations[i].update();
                }
            });
        }
        if (typeof syncAllDataWithServer === 'function') syncAllDataWithServer();
    }
});
// ============ إصلاح المزامنة التلقائية ============

// استبدال دالة syncAllDataWithServer بالنسخة المعدلة
window.syncAllDataWithServer = async function() {
    if (!navigator.onLine) {
        console.log('📴 لا يوجد اتصال بالإنترنت');
        showAlert('dashboardAlert', '📴 لا يوجد اتصال بالإنترنت. سيتم المزامنة عند استعادة الاتصال.', 'warning');
        return false;
    }
    
    if (!currentUser) {
        console.log('⚠️ لا يوجد مستخدم مسجل الدخول');
        return false;
    }
    
    showAlert('dashboardAlert', '🔄 جاري المزامنة مع الخادم...', 'success');
    console.log('🔄 بدء المزامنة التلقائية...');
    
    let syncedAnything = false;
    
    // 1. مزامنة المرضى المعلقين
    const patientsSynced = await syncPendingPatients();
    if (patientsSynced) syncedAnything = true;
    
    // 2. مزامنة المعالجات المعلقة
    const treatmentsSynced = await syncPendingTreatments();
    if (treatmentsSynced) syncedAnything = true;
    
    // 3. مزامنة الصور المعلقة
    const imagesSynced = await syncPatientImagesToServer();
    if (imagesSynced) syncedAnything = true;
    
    // 4. تحديث قائمة المرضى من السيرفر
    try {
        const response = await fetch('/api/patients/' + currentUser.id);
        if (response.ok) {
            const serverPatients = await response.json();
            
            // دمج مع البيانات المحلية
            const localPatients = getOfflinePatients();
            const pendingLocal = localPatients.filter(p => p.pendingSync === true);
            
            allPatients = [...pendingLocal, ...serverPatients];
            
            // إزالة المكررات
            const uniqueMap = new Map();
            for (const p of allPatients) {
                if (!uniqueMap.has(p.name)) {
                    uniqueMap.set(p.name, p);
                }
            }
            allPatients = Array.from(uniqueMap.values());
            
            renderPatients(allPatients);
            document.getElementById('totalPatients').textContent = allPatients.length;
            saveAllDataToLocal();
        }
    } catch (e) {
        console.log('⚠️ خطأ في تحديث المرضى:', e);
    }
    
    checkPatientLimit();
    
    if (syncedAnything) {
        showAlert('dashboardAlert', '✅ تمت المزامنة بنجاح', 'success');
    } else {
        showAlert('dashboardAlert', '✅ لا توجد بيانات جديدة للمزامنة', 'success');
    }
    
    return true;
};

// دالة مزامنة المرضى المعلقين
async function syncPendingPatients() {
    if (!navigator.onLine || !currentUser) return false;
    
    const offlinePatients = getOfflinePatients();
    const pendingPatients = offlinePatients.filter(p => p.pendingSync === true);
    
    if (pendingPatients.length === 0) return false;
    
    console.log(`📋 جاري مزامنة ${pendingPatients.length} مريض معلق...`);
    let syncedCount = 0;
    
    for (const patient of pendingPatients) {
        try {
            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: patient.name,
                    phone: patient.phone,
                    age: patient.age,
                    address: patient.address,
                    notes: patient.notes,
                    userId: currentUser.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ تمت مزامنة المريض: ${patient.name}`);
                
                // تحديث البيانات المحلية
                const updatedPatients = getOfflinePatients();
                const index = updatedPatients.findIndex(p => p._id === patient._id);
                if (index !== -1) {
                    updatedPatients[index].pendingSync = false;
                    updatedPatients[index].offline = false;
                    updatedPatients[index]._id = result.patient._id;
                    localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(updatedPatients));
                }
                syncedCount++;
            } else {
                console.log(`❌ فشلت مزامنة المريض: ${patient.name}`);
            }
        } catch (e) {
            console.log(`❌ خطأ في مزامنة المريض ${patient.name}:`, e);
        }
    }
    
    return syncedCount > 0;
}

// دالة مزامنة المعالجات المعلقة
async function syncPendingTreatments() {
    if (!navigator.onLine || !currentUser) return false;
    
    let offlineTreatments = [];
    try {
        offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    } catch(e) { return false; }
    
    const pendingTreatments = offlineTreatments.filter(t => t.pendingSync === true);
    
    if (pendingTreatments.length === 0) return false;
    
    console.log(`📋 جاري مزامنة ${pendingTreatments.length} معالجة معلقة...`);
    let syncedCount = 0;
    
    for (const treatment of pendingTreatments) {
        try {
            // البحث عن المريض الحقيقي إذا كان ID مؤقت
            let patientId = treatment.patientId;
            if (patientId && patientId.toString().startsWith('offline_')) {
                // محاولة العثور على المريض بعد المزامنة
                const allPatientsList = allPatients;
                const matchedPatient = allPatientsList.find(p => 
                    p.name === treatment.patientName || 
                    p._id === patientId
                );
                if (matchedPatient && !matchedPatient._id.toString().startsWith('offline_')) {
                    patientId = matchedPatient._id;
                } else {
                    console.log(`⚠️ لم يتم العثور على المريض للمعالجة، تأجيل المزامنة`);
                    continue;
                }
            }
            
            const response = await fetch('/api/treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patientId,
                    userId: currentUser.id,
                    toothNumber: treatment.toothNumber,
                    treatmentType: treatment.treatmentType,
                    cost: treatment.cost || 0,
                    paid: treatment.paid || 0,
                    notes: treatment.notes || '',
                    treatmentDate: treatment.treatmentDate || new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log(`✅ تمت مزامنة المعالجة للسن ${treatment.toothNumber}`);
                syncedCount++;
            } else {
                console.log(`❌ فشلت مزامنة المعالجة للسن ${treatment.toothNumber}`);
            }
        } catch (e) {
            console.log(`❌ خطأ في مزامنة المعالجة:`, e);
        }
    }
    
    // حذف المعالجات التي تمت مزامنتها
    if (syncedCount > 0) {
        const remainingTreatments = offlineTreatments.filter(t => t.pendingSync !== true);
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(remainingTreatments));
    }
    
    return syncedCount > 0;
}

// تحسين دالة syncPatientImagesToServer
const originalSyncImages = window.syncPatientImagesToServer;
window.syncPatientImagesToServer = async function() {
    if (!navigator.onLine || !currentUser) return false;
    
    let allImages = {};
    try {
        allImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
    } catch(e) { return false; }
    
    let syncedCount = 0;
    
    for (const patientId in allImages) {
        const pendingImages = allImages[patientId].filter(img => img.pendingSync === true);
        
        for (const img of pendingImages) {
            try {
                const response = await fetch('/api/patient-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patientId: patientId,
                        userId: currentUser.id,
                        imageData: img.data,
                        caption: img.caption,
                        imageId: img.id
                    })
                });
                
                if (response.ok) {
                    img.pendingSync = false;
                    syncedCount++;
                    console.log(`✅ تمت مزامنة الصورة للمريض ${patientId}`);
                }
            } catch (e) {
                console.log(`❌ خطأ في مزامنة الصورة:`, e);
            }
        }
    }
    
    if (syncedCount > 0) {
        localStorage.setItem('patient_images_' + currentUser.id, JSON.stringify(allImages));
        console.log(`✅ تمت مزامنة ${syncedCount} صورة`);
    }
    
    return syncedCount > 0;
};

// تحسين حدث الاتصال بالإنترنت
const originalOnlineHandler = window.online;
window.addEventListener('online', async function() {
    console.log('🟢 تم استعادة الاتصال بالإنترنت - بدء المزامنة التلقائية');
    
    // إزالة إشعار وضع عدم الاتصال
    const offlineDiv = document.getElementById('offlineNotification');
    if (offlineDiv) offlineDiv.remove();
    document.body.classList.remove('offline-mode');
    
    // عرض رسالة للمستخدم
    showAlert('dashboardAlert', '🟢 تم استعادة الاتصال. جاري المزامنة التلقائية...', 'success');
    
    // انتظار ثانيتين للتأكد من استقرار الاتصال
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // المزامنة التلقائية
    await syncAllDataWithServer();
    
    // تحديث واجهة المريض الحالية إذا كانت مفتوحة
    if (currentPatientId) {
        await showPatientFullDetails(currentPatientId);
    }
});

// تحسين حدث فقدان الاتصال
window.addEventListener('offline', function() {
    console.log('🔴 فقدان الاتصال بالإنترنت');
    document.body.classList.add('offline-mode');
    showAlert('dashboardAlert', '🔴 فقدان الاتصال بالإنترنت. سيتم حفظ البيانات محلياً والمزامنة تلقائياً عند عودة الاتصال.', 'warning');
    showOfflineNotification();
});

// مزامنة دورية كل 5 دقائق (حتى لو كان التطبيق مفتوحاً)
setInterval(async function() {
    if (navigator.onLine && currentUser && document.visibilityState === 'visible') {
        console.log('⏰ مزامنة دورية تلقائية...');
        await syncPendingPatients();
        await syncPendingTreatments();
        await syncPatientImagesToServer();
    }
}, 5 * 60 * 1000); // كل 5 دقائق

// عند فتح التطبيق، تحقق من وجود بيانات معلقة
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async function() {
        if (navigator.onLine && currentUser) {
            console.log('🔄 فحص البيانات المعلقة بعد تحميل الصفحة');
            await syncPendingPatients();
            await syncPendingTreatments();
            await syncPatientImagesToServer();
        }
    }, 3000);
});

console.log('✅ نظام المزامنة التلقائية جاهز');
