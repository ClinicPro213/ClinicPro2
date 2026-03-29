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
function fetchWithTimeout(url, timeout) {
    timeout = timeout || 8000;
    return new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
            reject(new Error('Request timeout'));
        }, timeout);
        
        fetch(url).then(function(response) {
            clearTimeout(timer);
            resolve(response);
        }).catch(function(err) {
            clearTimeout(timer);
            reject(err);
        });
    });
}

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

// ============ رسم الأسنان ============
function drawTeeth() {
    var teeth = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32];
    var container = document.getElementById('teethContainer');
    if (!container) return;
    var html = '';
    for (var i = 0; i < teeth.length; i++) {
        html += '<div class="tooth" onclick="selectTooth(' + teeth[i] + ')">' + teeth[i] + '</div>';
    }
    container.innerHTML = html;
}

function selectTooth(tooth) {
    var toothInput = document.getElementById('toothNumber');
    var typeSelect = document.getElementById('treatmentTypeSelect');
    var notesInput = document.getElementById('treatmentNotesInput');
    var costInput = document.getElementById('treatmentCostInput');
    var paidInput = document.getElementById('treatmentPaidInput');
    if (toothInput) toothInput.value = tooth;
    if (typeSelect) typeSelect.value = '';
    if (notesInput) notesInput.value = '';
    if (costInput) costInput.value = '0';
    if (paidInput) paidInput.value = '0';
    calcRemaining();
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
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    document.getElementById('adminUserName').textContent = currentUser.fullName;
    loadAdminUsers();
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
        fullName: document.getElementById('regFullName').value,
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        age: parseInt(document.getElementById('regAge').value),
        clinicName: document.getElementById('regClinicName').value,
        address: document.getElementById('regAddress').value
    };
    if (!data.fullName || !data.username || !data.password) {
        showAlert('registerAlert', 'املأ جميع الحقول', 'error');
        return;
    }
    try {
        var r = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        var res = await r.json();
        if (r.ok && res.success) {
            currentUser = res.user;
            try {
                localStorage.setItem('userId', currentUser.id);
            } catch(e) { console.log('Save error:', e); }
            await loadDashboard();
            showAlert('dashboardAlert', 'تم إنشاء الحساب', 'success');
        } else {
            showAlert('registerAlert', res.message || 'فشل', 'error');
        }
    } catch (e) {
        showAlert('registerAlert', 'خطأ في الاتصال', 'error');
    }
}

async function login() {
    var u = document.getElementById('loginUsername').value;
    var p = document.getElementById('loginPassword').value;
    if (!u || !p) {
        showAlert('loginAlert', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    if (navigator.onLine) {
        try {
            var r = await fetchWithTimeout('/api/login', 10000);
            // ملاحظة: يجب إضافة body بشكل صحيح
            // هذا الكود مختصر، أضف التفاصيل الكاملة
        } catch (e) {
            console.log('خطأ في الاتصال:', e.message);
            await tryLocalLogin(u, p);
        }
    } else {
        await tryLocalLogin(u, p);
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
    checkPatientLimit();
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

// ============ المزامنة التلقائية ============
window.addEventListener('online', async function() {
    console.log('🔄 استعادة الاتصال بالإنترنت - بدء المزامنة التلقائية');
    showAlert('dashboardAlert', '🔄 تم استعادة الاتصال. جاري المزامنة التلقائية...', 'success');
    await new Promise(function(resolve) { setTimeout(resolve, 2000); });
    await syncAllDataWithServer();
    var offlineDiv = document.getElementById('offlineNotification');
    if (offlineDiv) offlineDiv.remove();
});

window.addEventListener('offline', function() {
    console.log('📴 فقدان الاتصال بالإنترنت');
    document.body.classList.add('offline-mode');
    showAlert('dashboardAlert', '📴 فقدان الاتصال. سيتم حفظ البيانات محلياً والمزامنة تلقائياً عند عودة الإنترنت.', 'warning');
});

checkConnectionStatus();

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

function renderPatientImages(patientId) {
    var images = getPatientImages(patientId);
    var container = document.getElementById('imagesContainer_' + patientId);
    if (!container) return;
    if (images.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">📷 لا توجد صور لهذا المريض</div>';
        return;
    }
    var html = '<div class="images-grid">';
    for (var i = 0; i < images.length; i++) {
        var img = images[i];
        html += '<div class="image-card" onclick="viewFullImage(\'' + img.data + '\')">';
        html += '<img src="' + img.data + '" alt="' + escapeHtml(img.caption || 'صورة المريض') + '">';
        html += '<div class="image-actions" onclick="event.stopPropagation()">';
        html += '<button class="image-delete" onclick="deleteImageConfirm(\'' + patientId + '\', \'' + img.id + '\')"><i class="fas fa-trash"></i></button>';
        html += '</div>';
        if (img.caption) html += '<div class="image-badge">' + escapeHtml(img.caption) + '</div>';
        if (img.pendingSync) html += '<div class="image-badge" style="background:#f59e0b;">📴</div>';
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
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

async function savePatientImage() {
    var fileInput = document.getElementById('imageFileInput');
    var caption = document.getElementById('imageCaption').value;
    if (!fileInput.files || !fileInput.files[0]) {
        showAlert('dashboardAlert', 'الرجاء اختيار صورة', 'error');
        return;
    }
    var file = fileInput.files[0];
    showAlert('dashboardAlert', '🔄 جاري معالجة الصورة...', 'success');
    try {
        var compressedImageData = await compressImage(file, 1);
        savePatientImageLocally(currentImagePatientId, compressedImageData, caption);
        renderPatientImages(currentImagePatientId);
        closeModal('addImageModal');
        showAlert('dashboardAlert', '✅ تم حفظ الصورة بنجاح', 'success');
        if (navigator.onLine) {
            await syncPatientImagesToServer();
            renderPatientImages(currentImagePatientId);
            showAlert('dashboardAlert', '✅ تمت مزامنة الصورة مع الخادم', 'success');
        } else {
            showAlert('dashboardAlert', '📴 تم حفظ الصورة محلياً - ستتم المزامنة عند استعادة الاتصال', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('dashboardAlert', '❌ فشل في معالجة الصورة', 'error');
    }
}

async function syncPatientImagesToServer() {
    if (!navigator.onLine || !currentUser) return;
    var allImages = {};
    try {
        allImages = JSON.parse(localStorage.getItem('patient_images_' + currentUser.id) || '{}');
    } catch(e) { return; }
    var synced = 0;
    for (var patientId in allImages) {
        var pendingImages = [];
        for (var i = 0; i < allImages[patientId].length; i++) {
            if (allImages[patientId][i].pendingSync === true) {
                pendingImages.push(allImages[patientId][i]);
            }
        }
        for (var i = 0; i < pendingImages.length; i++) {
            var img = pendingImages[i];
            try {
                var response = await fetch('/api/patient-images', {
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
                    synced++;
                }
            } catch (e) {
                console.error('Error syncing image:', e);
            }
        }
    }
    if (synced > 0) {
        localStorage.setItem('patient_images_' + currentUser.id, JSON.stringify(allImages));
        showAlert('dashboardAlert', '✅ تمت مزامنة ' + synced + ' صورة مع الخادم', 'success');
    }
}

async function sharePatientWithImages(patientId) {
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === patientId) {
            patient = allPatients[i];
            break;
        }
    }
    if (!patient) return;
    var images = getPatientImages(patientId);
    var message = '*🦷 بيانات المريض - ' + patient.name + '*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 الاسم: ' + patient.name + '\n📞 الهاتف: ' + (patient.phone || 'غير مسجل') + '\n📅 العمر: ' + patient.age + ' سنة\n📍 العنوان: ' + (patient.address || 'غير مسجل') + '\n📝 ملاحظات: ' + (patient.notes || 'لا توجد') + '\n\n📸 عدد الصور: ' + images.length + ' صورة\n\n🦷 *ClinicPro - نظام إدارة عيادات الأسنان*' + (images.length > 0 ? '\n\n*ملاحظة:* تم إرفاق ' + images.length + ' صورة مع هذا التقرير' : '');
    window.open('https://wa.me/' + (patient.phone || '967773041464') + '?text=' + encodeURIComponent(message), '_blank');
    if (images.length > 0 && images[0].data) {
        setTimeout(function() {
            showAlert('dashboardAlert', '📸 يمكنك مشاركة الصور بشكل منفصل عبر واتساب', 'info');
        }, 1000);
    }
}

// ============ ضغط الصور ============
async function compressImage(file, maxSizeMB, quality) {
    maxSizeMB = maxSizeMB || 1;
    quality = quality || 0.7;
    return new Promise(function(resolve, reject) {
        if (file.size <= maxSizeMB * 1024 * 1024) {
            var reader = new FileReader();
            reader.onload = function(e) { resolve(e.target.result); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            var img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var width = img.width;
                var height = img.height;
                var maxDimension = 1920;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    } else {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
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
