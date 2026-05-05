// ============================================

// دالة لتوحيد IDs (تحويل ObjectId إلى نص)
function normalizeId(id) {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.toString) return id.toString();
    return String(id);
}
// نظام الاشتراكات الجديد
// ============================================

let selectedPlanType = null;
let selectedPlanDuration = null;
let selectedPlanAmount = null;

function selectPlanWithDuration(plan, duration) {
    selectedPlanType = plan;
    selectedPlanDuration = duration;
    
    if (plan === 'student') {
        selectedPlanAmount = duration === 'yearly' ? 30000 : 3000;
    } else if (plan === 'clinic') {
        selectedPlanAmount = duration === 'yearly' ? 50000 : 5000;
    }
    
    let durationText = duration === 'yearly' ? 'سنوي' : 'شهري';
    let planText = plan === 'student' ? 'دكتور طالب' : 'دكتور عيادة';
    
    // عرض تفاصيل الاشتراك
    let detailsHtml = `
        <div style="background:white; border-radius:12px; padding:15px;">
            <p><strong>🎓 الباقة:</strong> ${planText}</p>
            <p><strong>📅 المدة:</strong> ${durationText}</p>
            <p><strong>💰 المبلغ:</strong> ${selectedPlanAmount.toLocaleString()} ريال</p>
            <p><strong>👤 اسم المستخدم:</strong> ${currentUser.username}</p>
            <p><strong>🏥 العيادة:</strong> ${currentUser.clinicName || 'غير محدد'}</p>
        </div>
    `;
    
    document.getElementById('selectedPlanInfo').innerHTML = detailsHtml;
    document.getElementById('userNameDisplayForPayment').textContent = currentUser.username;
    
    // إظهار قسم الدفع والتمرير إليه
    document.getElementById('paymentInfoSection').style.display = 'block';
    
    // تمرير الصفحة إلى أسفل
    setTimeout(() => {
        document.getElementById('paymentInfoSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function sendSubscriptionRequestViaWhatsApp() {
    if (!selectedPlanType) {
        alert('⚠️ الرجاء اختيار الباقة أولاً');
        return;
    }
    
    let planText = selectedPlanType === 'student' ? 'دكتور طالب' : 'دكتور عيادة';
    let durationText = selectedPlanDuration === 'yearly' ? 'سنوي' : 'شهري';
    
    let message = `📋 *طلب اشتراك جديد - ClinicPro*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 *بيانات المستخدم*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• الاسم: ${currentUser.fullName || currentUser.username}\n`;
    message += `• اسم المستخدم: ${currentUser.username}\n`;
    message += `• العيادة: ${currentUser.clinicName || 'غير محدد'}\n`;
    message += `• الهاتف: ${currentUser.phone || 'غير مسجل'}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🎓 *تفاصيل الاشتراك*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• الباقة: ${planText}\n`;
    message += `• المدة: ${durationText}\n`;
    message += `💰 المبلغ: ${selectedPlanAmount.toLocaleString()} ريال\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `✅ تم تحويل المبلغ بنجاح\n`;
    message += `📸 سيتم إرفاق صورة الإيداع\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🦷 *ClinicPro - نظام إدارة عيادات الأسنان*`;
    
    // حفظ طلب الاشتراك
    localStorage.setItem('pendingSubscription_' + currentUser.id, JSON.stringify({
        plan: selectedPlanType,
        duration: selectedPlanDuration,
        amount: selectedPlanAmount,
        method: 'whatsapp',
        username: currentUser.username,
        fullName: currentUser.fullName,
        clinicName: currentUser.clinicName,
        phone: currentUser.phone,
        requestedAt: new Date().toISOString(),
        status: 'pending'
    }));
    
    let phoneNumber = '967773041464';
    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
    
    alert('✅ تم إرسال طلب الاشتراك بنجاح!\n\n📸 يرجى إرسال صورة الإيداع عبر المحادثة المفتوحة\n📝 لا تنسى ذكر اسم المستخدم: ' + currentUser.username);
    
    // إعادة تعيين
    setTimeout(() => {
        closeSubscriptionPage();
    }, 3000);
}

function sendSubscriptionRequestViaTelegram() {
    if (!selectedPlanType) {
        alert('⚠️ الرجاء اختيار الباقة أولاً');
        return;
    }
    
    let planText = selectedPlanType === 'student' ? 'دكتور طالب' : 'دكتور عيادة';
    let durationText = selectedPlanDuration === 'yearly' ? 'سنوي' : 'شهري';
    
    let message = `📋 طلب اشتراك جديد - ClinicPro\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 بيانات المستخدم\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• الاسم: ${currentUser.fullName || currentUser.username}\n`;
    message += `• اسم المستخدم: ${currentUser.username}\n`;
    message += `• العيادة: ${currentUser.clinicName || 'غير محدد'}\n`;
    message += `• الهاتف: ${currentUser.phone || 'غير مسجل'}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🎓 تفاصيل الاشتراك\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `• الباقة: ${planText}\n`;
    message += `• المدة: ${durationText}\n`;
    message += `💰 المبلغ: ${selectedPlanAmount.toLocaleString()} ريال\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `✅ تم تحويل المبلغ بنجاح\n`;
    message += `📸 سيتم إرفاق صورة الإيداع\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🦷 ClinicPro - نظام إدارة عيادات الأسنان`;
    
    // حفظ طلب الاشتراك
    localStorage.setItem('pendingSubscription_' + currentUser.id, JSON.stringify({
        plan: selectedPlanType,
        duration: selectedPlanDuration,
        amount: selectedPlanAmount,
        method: 'telegram',
        username: currentUser.username,
        fullName: currentUser.fullName,
        clinicName: currentUser.clinicName,
        phone: currentUser.phone,
        requestedAt: new Date().toISOString(),
        status: 'pending'
    }));
    
    window.open('https://t.me/moatazdent?text=' + encodeURIComponent(message), '_blank');
    
    alert('✅ تم إرسال طلب الاشتراك بنجاح!\n\n📸 يرجى إرسال صورة الإيداع عبر المحادثة المفتوحة\n📝 لا تنسى ذكر اسم المستخدم: ' + currentUser.username);
    
    setTimeout(() => {
        closeSubscriptionPage();
    }, 3000);
}

// تغيير نوع اشتراك المستخدم مع تحديد المدة
async function changeUserSubscriptionWithDuration(userId, type, duration) {
    let message = '';
    if (type === 'free') {
        message = '⚠️ هل أنت متأكد من تغيير نوع الاشتراك إلى مجاني؟\nسيتم إلغاء جميع صلاحيات الاشتراك المدفوع.';
    } else {
        let durationText = duration === 'yearly' ? 'سنوي' : 'شهري';
        let typeText = type === 'student' ? 'دكتور طالب' : 'دكتور عيادة';
        message = `⚠️ هل أنت متأكد من تفعيل اشتراك ${typeText} (${durationText}) للمستخدم؟`;
    }
    
    if (!confirm(message)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/users/' + userId + '/subscription-type', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionType: type, duration: duration })
        });
        
        if (response.ok) {
            alert('✅ تم تغيير نوع الاشتراك بنجاح');
            loadAdminUsers();
        } else {
            alert('❌ فشل تغيير نوع الاشتراك');
        }
    } catch (e) {
        console.error('Error:', e);
        alert('خطأ في الاتصال بالخادم');
    }
}
// عرض قائمة المستخدمين مع نوع الاشتراك (تعديل دالة renderAdminUsers)
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
        var subscriptionType = u.subscriptionType || 'free';
        var expiryDate = u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString('ar-EG') : 'غير محدد';
        var isExpired = u.subscriptionExpiry && new Date() > new Date(u.subscriptionExpiry);
        
        var badgeHtml = '';
        var expiryHtml = '';
        
        if (subscriptionType === 'free') {
            badgeHtml = '<span style="background:#64748b; padding:4px 12px; border-radius:20px; color:white;">📊 مجاني</span>';
        } else if (subscriptionType === 'student') {
            badgeHtml = '<span style="background:#f59e0b; padding:4px 12px; border-radius:20px; color:white;">🎓 دكتور طالب</span>';
            expiryHtml = `<span style="font-size:12px; color:#666;">📅 ينتهي: ${expiryDate}</span>`;
            if (isExpired) expiryHtml = '<span style="font-size:12px; color:#ef4444;">⚠️ منتهي</span>';
        } else if (subscriptionType === 'clinic') {
            badgeHtml = '<span style="background:#10b981; padding:4px 12px; border-radius:20px; color:white;">🏥 دكتور عيادة</span>';
            expiryHtml = `<span style="font-size:12px; color:#666;">📅 ينتهي: ${expiryDate}</span>`;
            if (isExpired) expiryHtml = '<span style="font-size:12px; color:#ef4444;">⚠️ منتهي</span>';
        }
        
        html += '<div class="patient-card" style="margin-bottom:15px;">';
        html += '<div class="patient-header"><h3>' + escapeHtml(u.fullName) + '</h3></div>';
        html += '<div class="patient-body">';
        html += '<p>@' + u.username + '</p>';
        html += '<p>' + (u.clinicName || 'عيادة غير مسجلة') + '</p>';
        html += '<p>📊 عدد المرضى: ' + (u.patientCount || 0) + '</p>';
        html += '<p>الحالة: ' + badgeHtml + '</p>';
        html += '<p>' + expiryHtml + '</p>';
        html += '<div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">';
        
        // زر مجاني
        html += '<button onclick="changeUserSubscriptionWithDuration(\'' + u._id + '\', \'free\', \'\')" style="background:#64748b; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">📊 مجاني</button>';
        
        // دكتور طالب مع اختيار المدة
        html += '<div style="display:inline-flex; gap:4px;">';
        html += '<button onclick="changeUserSubscriptionWithDuration(\'' + u._id + '\', \'student\', \'monthly\')" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">🎓 طالب (شهري)</button>';
        html += '<button onclick="changeUserSubscriptionWithDuration(\'' + u._id + '\', \'student\', \'yearly\')" style="background:#f59e0b; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">🎓 طالب (سنوي)</button>';
        html += '</div>';
        
        // دكتور عيادة مع اختيار المدة
        html += '<div style="display:inline-flex; gap:4px;">';
        html += '<button onclick="changeUserSubscriptionWithDuration(\'' + u._id + '\', \'clinic\', \'monthly\')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">🏥 عيادة (شهري)</button>';
        html += '<button onclick="changeUserSubscriptionWithDuration(\'' + u._id + '\', \'clinic\', \'yearly\')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">🏥 عيادة (سنوي)</button>';
        html += '</div>';
        
        html += '</div></div></div>';
    }
    c.innerHTML = html;
}


// تغيير نوع اشتراك المستخدم
async function changeUserSubscription(userId, type) {
    if (!confirm(`⚠️ هل أنت متأكد من تغيير نوع الاشتراك إلى ${type === 'free' ? 'مجاني' : type === 'student' ? 'دكتور طالب' : 'دكتور عيادة'}؟`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/users/' + userId + '/subscription-type', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionType: type })
        });
        
        if (response.ok) {
            alert('✅ تم تغيير نوع الاشتراك بنجاح');
            loadAdminUsers();
        } else {
            alert('❌ فشل تغيير نوع الاشتراك');
        }
    } catch (e) {
        console.error('Error:', e);
        alert('خطأ في الاتصال بالخادم');
    }
}

// تعريف الدوال في النطاق العام
window.showAddPaymentModal = function(treatmentId, patientId) {
    // ✅ منع مستخدم دكتور طالب من إضافة دفعة
    if (currentUser.subscriptionType === 'student') {
        showAlert('dashboardAlert', '⚠️ غير مسموح لك بإضافة دفعات. هذه الميزة متاحة فقط لباقة دكتور عيادة.', 'error');
        return;
    }
    
    console.log('✅ showAddPaymentModal تم استدعاؤها', treatmentId, patientId);
    alert('تم الضغط على زر الدفع!');
    
    // كود النافذة المنبثقة
    let modalHtml = `
        <div id="paymentModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:99999;">
            <div style="background:white; border-radius:20px; max-width:400px; width:90%;">
                <div style="padding:15px; background:#1e40af; color:white; border-radius:20px 20px 0 0; display:flex; justify-content:space-between;">
                    <h3>إضافة دفعة جديدة</h3>
                    <button onclick="document.getElementById('paymentModal').remove()" style="background:none; border:none; color:white; font-size:24px;">&times;</button>
                </div>
                <div style="padding:20px;">
                    <input type="number" id="payAmount" placeholder="المبلغ" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:8px;">
                    <input type="date" id="payDate" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:8px;">
                    <textarea id="payNote" rows="2" placeholder="ملاحظات" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:8px;"></textarea>
                    <button onclick="window.savePayment()" style="width:100%; background:#10b981; color:white; padding:10px; border:none; border-radius:8px;">حفظ الدفعة</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
    
    window.currentPayTreatmentId = treatmentId;
    window.currentPayPatientId = patientId;
};


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


            
// ============================================
// دوال الدفع والعودة - النسخة النهائية المتكاملة
// ============================================

// ============ 1. دالة إضافة دفعة (بجانب المعالجة) ============
window.savePayment = function() {
    let amount = document.getElementById('payAmount').value;
    let date = document.getElementById('payDate').value;
    let note = document.getElementById('payNote').value;
    
    if (!amount || parseFloat(amount) <= 0) {
        alert('⚠️ الرجاء إدخال مبلغ صحيح');
        return;
    }
    
    // 🔍 تشخيص
    console.log('حفظ دفعة للمعالجة:', window.currentPayTreatmentId);
    
    // جلب المعالجات من localStorage
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    console.log('عدد المعالجات في localStorage:', treatments.length);
    
    // البحث عن المعالجة (محاولة بطرق مختلفة)
    let treatmentIndex = -1;
    for (let i = 0; i < treatments.length; i++) {
        if (treatments[i]._id === window.currentPayTreatmentId || 
            treatments[i].id === window.currentPayTreatmentId) {
            treatmentIndex = i;
            break;
        }
    }
    
    if (treatmentIndex === -1) {
        console.error('لم يتم العثور على المعالجة:', window.currentPayTreatmentId);
        alert('⚠️ لم يتم العثور على المعالجة. يرجى تحديث الصفحة والمحاولة مرة أخرى');
        return;
    }
    
    let treatment = treatments[treatmentIndex];
    
    // إضافة الدفعة
    if (!treatment.payments) treatment.payments = [];
    treatment.payments.push({
        id: 'pay_' + Date.now(),
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0],
        note: note || '',
        createdAt: new Date().toISOString()
    });
    
    // تحديث إجمالي المدفوع
    let totalPaid = 0;
    for (let p of treatment.payments) totalPaid += p.amount;
    treatment.paid = totalPaid;
    
    // حفظ
    treatments[treatmentIndex] = treatment;
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    // إغلاق المودال
    let modal = document.getElementById('paymentModal');
    if (modal) modal.remove();
    
    alert(`✅ تم إضافة دفعة بقيمة ${amount} ريال بنجاح`);
    showPatientFullDetails(window.currentPayPatientId);
};

// فتح نافذة إضافة عودة - النسخة التي تعمل مع saveFollowUpDirect
function openFollowUpModal(treatmentId, patientId) {
    // ✅ منع مستخدم دكتور طالب من إضافة عودة
    if (currentUser.subscriptionType === 'student') {
        showAlert('dashboardAlert', '⚠️ غير مسموح لك بإضافة عوائد. هذه الميزة متاحة فقط لباقة دكتور عيادة.', 'error');
        return;
    }
    
    console.log('فتح عودة للمعالجة:', treatmentId);
    
    
    
    // التأكد من تخزين المعرفات بشكل صحيح
    currentFollowUpTreatmentId = treatmentId;
    currentFollowUpPatientId = patientId;
    
    // جلب المعالجة مباشرة
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    console.log('عدد المعالجات في localStorage:', treatments.length);
    
    // البحث عن المعالجة
    let treatment = null;
    for (let t of treatments) {
        if (t._id === treatmentId || t.id === treatmentId) {
            treatment = t;
            break;
        }
    }
    
    if (!treatment) {
        console.error('لم يتم العثور على المعالجة:', treatmentId);
        alert('⚠️ لم يتم العثور على المعالجة. يرجى تحديث الصفحة');
        return;
    }
    
    console.log('تم العثور على المعالجة:', treatment);
    
    let remaining = (treatment.cost || 0) - (treatment.paid || 0);
    let today = new Date().toISOString().split('T')[0];
    
    // إزالة أي مودال قديم
    let oldModal = document.getElementById('followUpModalDirect');
    if (oldModal) oldModal.remove();
    
    let modalHtml = `
        <div id="followUpModalDirect" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:100000;">
            <div style="background:white; border-radius:20px; max-width:450px; width:90%;">
                <div style="padding:15px; background:#f59e0b; color:white; border-radius:20px 20px 0 0; display:flex; justify-content:space-between;">
                    <h3><i class="fas fa-undo-alt"></i> إضافة عودة</h3>
                    <button onclick="document.getElementById('followUpModalDirect').remove()" style="background:none; border:none; color:white; font-size:24px;">&times;</button>
                </div>
                <div style="padding:20px;">
                    <div style="background:#fef3c7; padding:12px; border-radius:12px; margin-bottom:15px;">
                        <div><strong>🦷 السن:</strong> ${treatment.toothNumber}</div>
                        <div><strong>💊 النوع:</strong> ${treatment.treatmentType}</div>
                        <div><strong>💰 التكلفة:</strong> ${treatment.cost || 0} ريال</div>
                        <div><strong>💵 المدفوع:</strong> ${treatment.paid || 0} ريال</div>
                        <div><strong>⚠️ المتبقي:</strong> ${remaining} ريال</div>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>📝 ملاحظات العودة (اختياري)</label>
                        <textarea id="followUpNotesDirect" rows="3" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;"></textarea>
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>💰 المبلغ المدفوع اليوم</label>
                        <input type="number" id="followUpAmountDirect" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label>📅 تاريخ العودة</label>
                        <input type="date" id="followUpDateDirect" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;" value="${today}">
                    </div>
                    <button onclick="saveFollowUpDirect()" style="width:100%; background:#f59e0b; color:white; border:none; padding:12px; border-radius:8px;">💾 حفظ العودة</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}
    // التأكد من تعيين التاريخ (مرة أخرى للتأكيد)
    let dateField = document.getElementById('followUpDateDirect');
    if (dateField && !dateField.value) {
        dateField.value = today;
    }

function saveFollowUpDirect() {
    console.log('=== بدء حفظ العودة ===');
    console.log('treatmentId للمعالجة:', currentFollowUpTreatmentId);
    
    // جلب البيانات
    let notesValue = document.getElementById('followUpNotesDirect').value || '';
    let amount = parseFloat(document.getElementById('followUpAmountDirect').value) || 0;
    let date = document.getElementById('followUpDateDirect').value;
    
    // إذا لم يتم إدخال تاريخ، استخدم تاريخ اليوم
    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }
    
    console.log('البيانات المدخلة:', { notesValue, amount, date });
    
    // التأكد من وجود treatmentId
    if (!currentFollowUpTreatmentId) {
        console.error('⚠️ currentFollowUpTreatmentId غير موجود!');
        alert('خطأ: لم يتم العثور على معرف المعالجة. يرجى إعادة فتح النافذة.');
        return;
    }
    
    // جلب المعالجات
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    console.log('عدد المعالجات:', treatments.length);
    
    // البحث عن المعالجة
    let treatmentIndex = treatments.findIndex(t => t._id === currentFollowUpTreatmentId);
    
    if (treatmentIndex === -1) {
        console.error('لم يتم العثور على المعالجة:', currentFollowUpTreatmentId);
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    let treatment = treatments[treatmentIndex];
    console.log('تم العثور على المعالجة:', treatment);
    
    // إضافة سجل العودة
    if (!treatment.followUps) treatment.followUps = [];
    treatment.followUps.push({
        id: 'fu_' + Date.now(),
        date: date,
        notes: notesValue || '(بدون ملاحظات)',
        amountPaid: amount,
        createdAt: new Date().toISOString()
    });
    
    // إذا تم دفع مبلغ، أضفه كدفعة
    if (amount > 0) {
        if (!treatment.payments) treatment.payments = [];
        treatment.payments.push({
            id: 'pay_' + Date.now(),
            amount: amount,
            date: date,
            note: 'دفعة من عودة: ' + (notesValue ? notesValue.substring(0, 50) : 'بدون ملاحظات'),
            fromFollowUp: true,
            createdAt: new Date().toISOString()
        });
        
        let totalPaid = 0;
        for (let p of treatment.payments) totalPaid += p.amount;
        treatment.paid = totalPaid;
        console.log('✅ تم إضافة دفعة. الإجمالي الجديد:', totalPaid);
    }
    
    // حفظ
    treatments[treatmentIndex] = treatment;
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    // إغلاق المودال
    let modal = document.getElementById('followUpModalDirect');
    if (modal) modal.remove();
    
    alert('✅ تم إضافة العودة بنجاح');
    
    // تحديث عرض المريض
    showPatientFullDetails(currentFollowUpPatientId);
}

// ============ 3. دالة إضافة دفعة من زر تعديل المريض ============
window.openPaymentOnlyModalFirst = function() {
    // ✅ منع مستخدم دكتور طالب
    if (currentUser.subscriptionType === 'student') {
        showAlert('dashboardAlert', '⚠️ غير مسموح لك بإضافة دفعات. هذه الميزة متاحة فقط لباقة دكتور عيادة.', 'error');
        return;
    }
    
    // الحصول على patientId من النافذة المفتوحة
    let patientId = currentPatientId;
    
    
    if (!patientId) {
        alert('⚠️ الرجاء فتح ملف مريض أولاً (اضغط على اسم المريض)');
        return;
    }
    
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let patientTreatments = treatments.filter(t => t.patientId === patientId);
    
    console.log('معالجات المريض:', patientTreatments.length);
    
    if (patientTreatments.length === 0) {
        alert('⚠️ لا توجد معالجات مسجلة لهذا المريض');
        return;
    }
    
    let optionsHtml = '<option value="">-- اختر معالجة --</option>';
    for (let t of patientTreatments) {
        let remaining = (t.cost || 0) - (t.paid || 0);
        optionsHtml += `<option value="${t._id}" data-cost="${t.cost || 0}" data-paid="${t.paid || 0}" data-remaining="${remaining}" data-name="السن ${t.toothNumber} - ${t.treatmentType}">السن ${t.toothNumber} - ${t.treatmentType} (متبقي: ${remaining} ريال)</option>`;
    }
    
    let modalHtml = `
        <div id="paymentOnlyModal2" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:100000;">
            <div style="background:white; border-radius:20px; max-width:450px; width:90%;">
                <div style="padding:15px; background:#10b981; color:white; border-radius:20px 20px 0 0; display:flex; justify-content:space-between;">
                    <h3><i class="fas fa-money-bill-wave"></i> إضافة دفعة لمعالجة سابقة</h3>
                    <button onclick="document.getElementById('paymentOnlyModal2').remove()" style="background:none; border:none; color:white; font-size:24px;">&times;</button>
                </div>
                <div style="padding:20px;">
                    <select id="payOnlyTreatmentSelect2" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:8px;">${optionsHtml}</select>
                    <div id="payOnlyDetails2" style="background:#f1f5f9; padding:12px; border-radius:12px; margin-bottom:15px; display:none;"></div>
                    <input type="number" id="payOnlyAmount2" placeholder="المبلغ" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:8px;">
                    <input type="date" id="payOnlyDate2" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:8px;">
                    <textarea id="payOnlyNote2" rows="2" placeholder="ملاحظات" style="width:100%; padding:10px; margin-bottom:15px; border:1px solid #ccc; border-radius:8px;"></textarea>
                    <button onclick="savePaymentOnlyDataNew()" style="width:100%; background:#10b981; color:white; border:none; padding:12px; border-radius:8px;">💾 حفظ</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('payOnlyDate2').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('payOnlyTreatmentSelect2').onchange = function() {
        let opt = this.options[this.selectedIndex];
        let div = document.getElementById('payOnlyDetails2');
        if (opt.value) {
            div.style.display = 'block';
            div.innerHTML = `<div>🦷 ${opt.getAttribute('data-name')}</div>
                            <div>💰 التكلفة: ${opt.getAttribute('data-cost')} ريال</div>
                            <div>💵 مدفوع: ${opt.getAttribute('data-paid')} ريال</div>
                            <div>⚠️ متبقي: ${opt.getAttribute('data-remaining')} ريال</div>`;
        } else {
            div.style.display = 'none';
        }
    };
};

function savePaymentOnlyDataNew() {
    let treatmentId = document.getElementById('payOnlyTreatmentSelect2').value;
    if (!treatmentId) {
        alert('⚠️ اختر معالجة');
        return;
    }
    
    let amount = parseFloat(document.getElementById('payOnlyAmount2').value);
    if (isNaN(amount) || amount <= 0) {
        alert('⚠️ الرجاء إدخال مبلغ صحيح');
        return;
    }
    
    let date = document.getElementById('payOnlyDate2').value;
    let note = document.getElementById('payOnlyNote2').value;
    
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let index = treatments.findIndex(t => t._id === treatmentId);
    
    if (index === -1) {
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    if (!treatments[index].payments) treatments[index].payments = [];
    treatments[index].payments.push({
        id: 'pay_' + Date.now(),
        amount: amount,
        date: date,
        note: note
    });
    
    let totalPaid = 0;
    for (let p of treatments[index].payments) totalPaid += p.amount;
    treatments[index].paid = totalPaid;
    
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    let modal = document.getElementById('paymentOnlyModal2');
    if (modal) modal.remove();
    
    alert(`✅ تم إضافة دفعة بقيمة ${amount} ريال بنجاح`);
    showPatientFullDetails(currentPatientId);
}

console.log('✅ جميع دوال الدفع والعودة جاهزة');


// ============ إضافة دفعة لمعالجة سابقة فقط (بدون عودة) ============

let currentPaymentOnlyTreatmentId = null;
let currentPaymentOnlyPatientId = null;

function openPaymentOnlyModal() {
    // نختار من القائمة
    let select = document.getElementById('paymentTreatmentSelect');
    let treatmentId = select.value;
    
    if (!treatmentId) {
        alert('⚠️ الرجاء اختيار المعالجة أولاً');
        return;
    }
    
    currentPaymentOnlyTreatmentId = treatmentId;
    currentPaymentOnlyPatientId = currentPatientId;
    
    document.getElementById('paymentOnlyDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentOnlyAmount').value = '';
    document.getElementById('paymentOnlyNote').value = '';
    
    document.getElementById('paymentToTreatmentModal').style.display = 'flex';
}

function savePaymentOnly() {
    let amount = parseFloat(document.getElementById('paymentOnlyAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('⚠️ الرجاء إدخال مبلغ صحيح');
        return;
    }
    
    let date = document.getElementById('paymentOnlyDate').value;
    let note = document.getElementById('paymentOnlyNote').value;
    
    // جلب المعالجات
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let treatmentIndex = treatments.findIndex(t => t._id === currentPaymentOnlyTreatmentId);
    
    if (treatmentIndex === -1) {
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    let treatment = treatments[treatmentIndex];
    
    // إضافة الدفعة
    if (!treatment.payments) treatment.payments = [];
    treatment.payments.push({
        id: 'pay_' + Date.now() + '_' + Math.random(),
        amount: amount,
        date: date,
        note: note,
        createdAt: new Date().toISOString()
    });
    
    // تحديث إجمالي المدفوع
    let totalPaid = 0;
    for (let p of treatment.payments) totalPaid += p.amount;
    treatment.paid = totalPaid;
    
    // حفظ
    treatments[treatmentIndex] = treatment;
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    closeModal('paymentToTreatmentModal');
    alert(`✅ تم إضافة دفعة بقيمة ${amount} ريال بنجاح`);
    showPatientFullDetails(currentPaymentOnlyPatientId);
}

// تحديث عرض سجل العوائد في المعالجة
// أضف هذا داخل عرض المعالجة في showPatientFullDetails
function renderFollowUpsHistory(followUps) {
    if (!followUps || followUps.length === 0) return '';
    
    let html = '<div style="background:#fef3c7; border-radius:10px; padding:8px; margin-top:8px;">';
    html += '<div style="font-size:11px; color:#d97706; font-weight:bold; margin-bottom:5px;"><i class="fas fa-undo-alt"></i> سجل العوائد:</div>';
    for (let fu of followUps) {
        let date = fu.date ? new Date(fu.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
        html += `<div style="font-size:11px; padding:5px 0; border-bottom:1px solid #fde68a;">`;
        html += `📅 ${date}: ${escapeHtml(fu.notes.substring(0, 50))}`;
        if (fu.amountPaid > 0) html += ` | 💵 دفع: ${fu.amountPaid} ريال`;
        html += `</div>`;
    }
    html += '</div>';
    return html;
}
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
    // ✅ منع مستخدم دكتور طالب من الوصول لصفحة الدخل
    if (currentUser.subscriptionType === 'student') {
        showAlert('dashboardAlert', '⚠️ غير مسموح لك بالوصول إلى صفحة الدخل. هذه الميزة متاحة فقط لباقة دكتور عيادة.', 'error');
        return;
    }
    
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
    
    // ✅ التحقق من انتهاء صلاحية الاشتراك
    let isSubscriptionValid = currentUser.isSubscribed;
    let expiryMessage = '';
    
    if (currentUser.subscriptionExpiry && currentUser.subscriptionType !== 'free') {
        const now = new Date();
        const expiry = new Date(currentUser.subscriptionExpiry);
        
        if (now > expiry) {
            // الاشتراك منتهي
            isSubscriptionValid = false;
            expiryMessage = '⚠️ انتهت صلاحية اشتراكك! يرجى تجديد الاشتراك.';
            showAlert('dashboardAlert', expiryMessage, 'error');
            
            // تحديث حالة المستخدم محلياً
            currentUser.isSubscribed = false;
            currentUser.subscriptionType = 'free';
            
            // حفظ التغيير في localStorage
            let savedData = localStorage.getItem('offline_data_' + currentUser.id);
            if (savedData) {
                let offlineData = JSON.parse(savedData);
                offlineData.user = currentUser;
                localStorage.setItem('offline_data_' + currentUser.id, JSON.stringify(offlineData));
            }
        } else {
            // الاشتراك ساري
            let daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7) {
                showAlert('dashboardAlert', `⚠️ تنبيه: متبقي ${daysLeft} يوم على انتهاء اشتراكك. يرجى التجديد.`, 'warning');
            }
        }
    }
    
    // المدير أو المشترك (الاشتراك ساري) لديه صلاحيات كاملة
    if (currentUser.role === 'admin' || (isSubscriptionValid && currentUser.subscriptionType !== 'free')) {
        var alertDiv = document.getElementById('subscriptionAlert');
        if (alertDiv) alertDiv.classList.remove('show');
        if (subBtn) subBtn.style.display = 'none';
        
        // تمكين زر إضافة مريض
        var addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
            addBtn.title = 'إضافة مريض جديد';
        }
        return;
    }
    
    // مستخدم مجاني أو اشتراك منتهي
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
        if (patientCount >= 4) {
            showAlert('dashboardAlert', '⚠️ تنبيه: لديك ' + patientCount + ' من 5 مرضى مجانيين. يمكنك إضافة ' + remaining + ' مريض آخر مجاناً.', 'warning');
        }
    }
}

// التحقق من صلاحية الاشتراك ومنع الإضافات بعد انتهاء المدة
function isSubscriptionActive() {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.subscriptionType === 'free') return true; // المجاني لا ينتهي
    
    if (currentUser.subscriptionExpiry) {
        const now = new Date();
        const expiry = new Date(currentUser.subscriptionExpiry);
        if (now > expiry) {
            return false; // الاشتراك منتهي
        }
    }
    return currentUser.isSubscribed === true;
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


    

    // ============ قائمة تحديد السن (بسيطة وعملية) ============
function drawTeeth() {
    var container = document.getElementById('teethContainer');
    if (!container) return;
    
    var html = `
        <div class="fdi-simple">
            <div class="fdi-simple-row">
                <div class="fdi-simple-label">🦷 الفك:</div>
                <div class="fdi-simple-buttons">
                    <button type="button" class="simple-btn jaw-btn" data-jaw="upper" onclick="selectJawSimple('upper')">
    ⬆️ علوي
</button>
<button type="button" class="simple-btn jaw-btn" data-jaw="lower" onclick="selectJawSimple('lower')">
    ⬇️ سفلي
</button>
                </div>
            </div>
            <div class="fdi-simple-row">
                <div class="fdi-simple-label">📍 الجهة:</div>
                <div class="fdi-simple-buttons">
                    <button type="button" class="simple-btn side-btn" data-side="right" onclick="selectSideSimple('right')">
    ➡️ يمين
</button>
<button type="button" class="simple-btn side-btn" data-side="left" onclick="selectSideSimple('left')">
    ⬅️ يسار
</button>
                </div>
            </div>
            <div class="fdi-simple-row">
                <div class="fdi-simple-label">🔢 رقم السن:</div>
                <div class="fdi-simple-select">
                    <select class="simple-select" id="numberSelectSimple" onchange="selectNumberSimple(this.value)">
                        <option value="">-- اختر الرقم --</option>
                        <option value="1">1 - قاطع مركزي</option>
                        <option value="2">2 - قاطع جانبي</option>
                        <option value="3">3 - ناب</option>
                        <option value="4">4 - ضاحك أول</option>
                        <option value="5">5 - ضاحك ثاني</option>
                        <option value="6">6 - ضرس أول</option>
                        <option value="7">7 - ضرس ثاني</option>
                        <option value="8">8 - ضرس عقل</option>
                    </select>
                </div>
            </div>
            <div class="fdi-simple-result" id="fdiSimpleResult" style="display:none;">
                <div class="simple-result">
                    <span class="simple-fdi" id="selectedFDISimple">---</span>
                    <span class="simple-name" id="selectedToothNameSimple">السن المحدد</span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}
// المتغيرات
var currentJawSimple = '';
var currentSideSimple = '';
var currentNumberSimple = '';

// اختيار الفك
function selectJawSimple(jaw) {
    currentJawSimple = jaw;
    
    // تحديث واجهة الأزرار
    document.querySelectorAll('.jaw-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.jaw-btn[data-jaw="${jaw}"]`).classList.add('active');
    
    updateResultSimple();
}

// اختيار الجهة
function selectSideSimple(side) {
    currentSideSimple = side;
    
    // تحديث واجهة الأزرار
    document.querySelectorAll('.side-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.side-btn[data-side="${side}"]`).classList.add('active');
    
    updateResultSimple();
}

// اختيار الرقم من القائمة المنسدلة
function selectNumberSimple(value) {
    if (value) {
        currentNumberSimple = parseInt(value);
    } else {
        currentNumberSimple = '';
    }
    updateResultSimple();
}

// تحديث النتيجة
function updateResultSimple() {
    var resultDiv = document.getElementById('fdiSimpleResult');
    
    if (currentJawSimple && currentSideSimple && currentNumberSimple) {
        var fdi = calculateFDISimple(currentJawSimple, currentSideSimple, currentNumberSimple);
        var toothName = getToothNameSimple(currentJawSimple, currentSideSimple, currentNumberSimple);
        
        document.getElementById('selectedFDISimple').innerHTML = fdi;
        document.getElementById('selectedToothNameSimple').innerHTML = toothName;
        resultDiv.style.display = 'block';
        
        // تعيين رقم السن في الحقل الرئيسي
        var toothInput = document.getElementById('toothNumber');
        if (toothInput) {
            toothInput.value = fdi;
        }
        
        // عرض رسالة تأكيد
        showAlert('dashboardAlert', `🦷 تم تحديد السن ${fdi} - ${toothName}`, 'success');
    } else {
        resultDiv.style.display = 'none';
        if (document.getElementById('toothNumber')) {
            document.getElementById('toothNumber').value = '';
        }
    }
}

// حساب رقم FDI
function calculateFDISimple(jaw, side, number) {
    var base = 0;
    if (jaw === 'upper') {
        base = (side === 'right') ? 10 : 20;
    } else {
        base = (side === 'left') ? 30 : 40;
    }
    return base + number;
}

// الحصول على اسم السن
function getToothNameSimple(jaw, side, number) {
    var names = {
        1: 'قاطع مركزي',
        2: 'قاطع جانبي',
        3: 'ناب',
        4: 'ضاحك أول',
        5: 'ضاحك ثاني',
        6: 'ضرس أول',
        7: 'ضرس ثاني',
        8: 'ضرس عقل'
    };
    
    var jawName = jaw === 'upper' ? 'علوي' : 'سفلي';
    var sideName = side === 'right' ? 'أيمن' : 'أيسر';
    
    return `${names[number]} (${jawName} ${sideName})`;
}

// إعادة تعيين الاختيارات
function resetToothSelectionSimple() {
    currentJawSimple = '';
    currentSideSimple = '';
    currentNumberSimple = '';
    
    document.querySelectorAll('.jaw-btn, .side-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    var select = document.getElementById('numberSelectSimple');
    if (select) select.value = '';
    
    var resultDiv = document.getElementById('fdiSimpleResult');
    if (resultDiv) resultDiv.style.display = 'none';
    
    var toothInput = document.getElementById('toothNumber');
    if (toothInput) toothInput.value = '';
}


// ============ تفريغ حقول المعالجة ============
function clearTreatmentForm() {
    document.getElementById('toothNumber').value = '';
    document.getElementById('treatmentTypeSelect').value = '';
    document.getElementById('treatmentNotesInput').value = '';
    document.getElementById('treatmentCostInput').value = '';
    document.getElementById('treatmentPaidInput').value = '';
    document.getElementById('remainingSpan').textContent = '0';
    
    if (typeof resetToothSelectionSimple === 'function') {
        resetToothSelectionSimple();
    }
    
    document.querySelectorAll('.jaw-btn, .side-btn, .tooth-number-btn').forEach(el => {
        el.classList.remove('active');
    });
}

function calcRemaining() {
    var costInput = document.getElementById('treatmentCostInput');
    var paidInput = document.getElementById('treatmentPaidInput');
    var remainingSpan = document.getElementById('remainingSpan');
    
    if (!costInput || !paidInput || !remainingSpan) return;
    
    // ✅ التعامل مع القيم الفارغة
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
    
    // ✅ التحقق من وجود العناصر قبل استخدامها (النظام القديم)
    var toothInput = document.getElementById('toothNumber');
    if (toothInput) toothInput.value = '';
    
    var treatmentType = document.getElementById('treatmentTypeSelect');
    if (treatmentType) treatmentType.value = '';
    
    var notesInput = document.getElementById('treatmentNotesInput');
    if (notesInput) notesInput.value = '';
    
    var costInput = document.getElementById('treatmentCostInput');
    if (costInput) costInput.value = '';
    
    var paidInput = document.getElementById('treatmentPaidInput');
    if (paidInput) paidInput.value = '';
    
    var remainingSpan = document.getElementById('remainingSpan');
    if (remainingSpan) remainingSpan.textContent = '0';
    
    // ✅ تفريغ النظام الجديد (إن وجد)
    var mainCategory = document.getElementById('mainCategorySelect');
    if (mainCategory) mainCategory.value = '';
    
    var subTreatmentDiv = document.getElementById('subTreatmentDiv');
    if (subTreatmentDiv) subTreatmentDiv.style.display = 'none';
    
    var teethSelectionDiv = document.getElementById('teethSelectionDiv');
    if (teethSelectionDiv) teethSelectionDiv.style.display = 'none';
    
    // ✅ إعادة تعيين قوائم الأسنان المختارة
    if (typeof selectedTeethList !== 'undefined') {
        selectedTeethList = [];
    }
    if (typeof selectedBridgeList !== 'undefined') {
        selectedBridgeList = [];
    }
    
    // ✅ رسم الأسنان
    if (typeof drawTeeth === 'function') {
        drawTeeth();
    }
    
    // ✅ إعادة تعيين الاختيارات البسيطة للأسنان
    if (typeof resetToothSelectionSimple === 'function') {
        resetToothSelectionSimple();
    }
    
    // ✅ إزالة التحديد من عناصر واجهة الأسنان (إن وجدت)
    document.querySelectorAll('.jaw-btn, .side-btn, .tooth-number-btn').forEach(function(el) {
        el.classList.remove('active');
    });
    
    // ✅ عرض النافذة
    var modal = document.getElementById('treatmentModal');
    if (modal) modal.style.display = 'flex';
}
// ============ حفظ المعالجة على السيرفر مباشرة ============


// منع التكرار
let isSaving = false;
let lastSavedTreatmentId = null;

async function saveTreatmentNow() {
    // منع التكرار
    if (isSaving) {
        showAlert('dashboardAlert', '⚠️ جاري الحفظ، يرجى الانتظار...', 'warning');
        return;
    }
    
    if (!currentPatientId) {
        showAlert('dashboardAlert', 'خطأ: لم يتم تحديد المريض', 'error');
        return;
    }
    
    // ✅ النظام الجديد: الحصول على البيانات من النظام المتقدم
    let category = document.getElementById('mainCategorySelect').value;
    let subTreatmentSelect = document.getElementById('subTreatmentSelect');
    let treatmentValue = subTreatmentSelect.value;
    let treatmentName = subTreatmentSelect.options[subTreatmentSelect.selectedIndex]?.text || '';
    
    // ✅ إذا كان النظام القديم لا يزال مستخدماً (للتوافق مع الإصدارات السابقة)
    let oldTooth = document.getElementById('toothNumber')?.value;
    let oldType = document.getElementById('treatmentTypeSelect')?.value;
    
    let toothInfo = '';
    let fullTreatmentName = '';
    let useNewSystem = (category && treatmentValue);
    
    if (useNewSystem) {
        // ✅ النظام الجديد
        if (!category || !treatmentValue) {
            showAlert('dashboardAlert', '⚠️ الرجاء اختيار المعالجة بالكامل', 'error');
            return;
        }
        
        let notes = document.getElementById('treatmentNotesInput').value;
        let cost = parseFloat(document.getElementById('treatmentCostInput').value) || 0;
        let paid = parseFloat(document.getElementById('treatmentPaidInput').value) || 0;
        
        // بناء وصف المعالجة التفصيلي
        let treatments = treatmentsData[category];
        if (!treatments) {
            showAlert('dashboardAlert', '⚠️ خطأ في بيانات المعالجة', 'error');
            return;
        }
        
        let selectionType = treatments.teethSelection;
        
        if (selectionType === 'jaw') {
            let jaw = document.getElementById('jawSelect')?.value || '';
            toothInfo = jaw;
            if (!toothInfo) {
                showAlert('dashboardAlert', '⚠️ الرجاء اختيار الفك', 'error');
                return;
            }
        } 
        else if (selectionType === 'single' || selectionType === 'multi') {
            toothInfo = selectedTeethList.join('، ');
            if (selectedTeethList.length === 0) {
                showAlert('dashboardAlert', `⚠️ الرجاء اختيار ${selectionType === 'single' ? 'السن' : 'الأسنان'}`, 'error');
                return;
            }
        }
        else if (selectionType === 'bridge') {
            toothInfo = `الأسنان الداعمة: ${selectedBridgeList.join('، ')}`;
            if (selectedBridgeList.length < 2) {
                showAlert('dashboardAlert', '⚠️ الجسر يحتاج إلى أسنان داعمة (سنين على الأقل)', 'error');
                return;
            }
        }
        
        fullTreatmentName = `${category} - ${treatmentName}`;
        if (toothInfo) {
            fullTreatmentName += ` (${toothInfo})`;
        }
        
        var patient = null;
        for (var i = 0; i < allPatients.length; i++) {
            if (allPatients[i]._id === currentPatientId) {
                patient = allPatients[i];
                break;
            }
        }
        
        isSaving = true;
        
        try {
            var serverSaved = false;
            
            // ✅ محاولة الحفظ على السيرفر أولاً
            if (navigator.onLine) {
                try {
                    let patientId = currentPatientId;
                    if (patientId && patientId.toString().startsWith('offline_')) {
                        const matchedPatient = allPatients.find(p => 
                            p.name === (patient ? patient.name : '') && !p._id.toString().startsWith('offline_')
                        );
                        if (matchedPatient) {
                            patientId = matchedPatient._id;
                        }
                    }
                    
                    const response = await fetch('/api/treatments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            patientId: patientId,
                            userId: currentUser.id,
                            toothNumber: toothInfo || 'غير محدد',
                            treatmentType: fullTreatmentName,
                            cost: cost,
                            paid: paid,
                            notes: 'التكلفة: ' + cost + ' | المدفوع: ' + paid + ' | المتبقي: ' + (cost-paid) + '\n' + notes,
                            treatmentDate: new Date().toISOString()
                        })
                    });
                    
                    if (response.ok) {
                        serverSaved = true;
                        const result = await response.json();
                        
                        // حفظ المعالجة في localStorage
                        let offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                        const exists = offlineTreatments.some(t => t._id === result.treatment._id);
                        if (!exists) {
                            offlineTreatments.push({
                                ...result.treatment,
                                offline: false,
                                pendingSync: false,
                                payments: []
                            });
                            localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTreatments));
                        }
                        
                        showAlert('dashboardAlert', '✅ تم حفظ المعالجة على السيرفر', 'success');
                    } else {
                        showAlert('dashboardAlert', '📴 فشل الحفظ على السيرفر، سيتم الحفظ محلياً', 'warning');
                    }
                } catch(e) {
                    console.log('خطأ في الاتصال بالسيرفر:', e);
                    showAlert('dashboardAlert', '📴 سيتم الحفظ محلياً', 'warning');
                }
            }
            
            // ✅ حفظ محلياً فقط إذا فشل الحفظ على السيرفر
            if (!serverSaved) {
                var offlineTx = [];
                try {
                    offlineTx = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                } catch(e) { offlineTx = []; }
                
                var treatmentData = {
                    patientId: currentPatientId,
                    userId: currentUser.id,
                    toothNumber: toothInfo || 'غير محدد',
                    treatmentType: fullTreatmentName,
                    cost: cost,
                    paid: paid,
                    payments: [],
                    notes: 'التكلفة: ' + cost + ' | المدفوع: ' + paid + ' | المتبقي: ' + (cost-paid) + '\n' + notes,
                    treatmentDate: new Date().toISOString(),
                    patientName: patient ? patient.name : 'غير معروف',
                    offline: true,
                    pendingSync: true,
                    _id: 'offline_tx_' + Date.now() + '_' + Math.random()
                };
                
                offlineTx.push(treatmentData);
                localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTx));
                showAlert('dashboardAlert', '📴 تم حفظ المعالجة محلياً', 'warning');
            }
            
            closeModal('treatmentModal');
            
            // تحديث تفاصيل المريض
            var detailsModal = document.getElementById('patientDetailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                await showPatientFullDetails(currentPatientId);
            }
            
            saveAllDataToLocal();
            
            // تفريغ الحقول
            document.getElementById('mainCategorySelect').value = '';
            document.getElementById('subTreatmentDiv').style.display = 'none';
            document.getElementById('teethSelectionDiv').style.display = 'none';
            document.getElementById('treatmentNotesInput').value = '';
            document.getElementById('treatmentCostInput').value = '';
            document.getElementById('treatmentPaidInput').value = '';
            document.getElementById('remainingSpan').textContent = '0';
            selectedTeethList = [];
            selectedBridgeList = [];
            
        } finally {
            setTimeout(() => {
                isSaving = false;
            }, 1000);
        }
        
    } else if (oldTooth && oldType) {
        // ✅ النظام القديم (للتوافق مع الإصدارات السابقة)
        var tooth = oldTooth;
        var type = oldType;
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
        
        isSaving = true;
        
        try {
            var serverSaved = false;
            
            if (navigator.onLine) {
                try {
                    let patientId = currentPatientId;
                    if (patientId && patientId.toString().startsWith('offline_')) {
                        const matchedPatient = allPatients.find(p => 
                            p.name === (patient ? patient.name : '') && !p._id.toString().startsWith('offline_')
                        );
                        if (matchedPatient) {
                            patientId = matchedPatient._id;
                        }
                    }
                    
                    const response = await fetch('/api/treatments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            patientId: patientId,
                            userId: currentUser.id,
                            toothNumber: parseInt(tooth),
                            treatmentType: type,
                            cost: cost,
                            paid: paid,
                            notes: 'التكلفة: ' + cost + ' | المدفوع: ' + paid + ' | المتبقي: ' + (cost-paid) + '\n' + notes,
                            treatmentDate: new Date().toISOString()
                        })
                    });
                    
                    if (response.ok) {
                        serverSaved = true;
                        const result = await response.json();
                        
                        let offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                        const exists = offlineTreatments.some(t => t._id === result.treatment._id);
                        if (!exists) {
                            offlineTreatments.push({
                                ...result.treatment,
                                offline: false,
                                pendingSync: false,
                                payments: []
                            });
                            localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTreatments));
                        }
                        
                        showAlert('dashboardAlert', '✅ تم حفظ المعالجة على السيرفر', 'success');
                    } else {
                        showAlert('dashboardAlert', '📴 فشل الحفظ على السيرفر، سيتم الحفظ محلياً', 'warning');
                    }
                } catch(e) {
                    console.log('خطأ في الاتصال بالسيرفر:', e);
                    showAlert('dashboardAlert', '📴 سيتم الحفظ محلياً', 'warning');
                }
            }
            
            if (!serverSaved) {
                var offlineTx = [];
                try {
                    offlineTx = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                } catch(e) { offlineTx = []; }
                
                var treatmentData = {
                    patientId: currentPatientId,
                    userId: currentUser.id,
                    toothNumber: parseInt(tooth),
                    treatmentType: type,
                    cost: cost,
                    paid: paid,
                    payments: [],
                    notes: 'التكلفة: ' + cost + ' | المدفوع: ' + paid + ' | المتبقي: ' + (cost-paid) + '\n' + notes,
                    treatmentDate: new Date().toISOString(),
                    patientName: patient ? patient.name : 'غير معروف',
                    offline: true,
                    pendingSync: true,
                    _id: 'offline_tx_' + Date.now() + '_' + Math.random()
                };
                
                offlineTx.push(treatmentData);
                localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTx));
                showAlert('dashboardAlert', '📴 تم حفظ المعالجة محلياً', 'warning');
            }
            
            closeModal('treatmentModal');
            
            var detailsModal = document.getElementById('patientDetailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                await showPatientFullDetails(currentPatientId);
            }
            
            saveAllDataToLocal();
            
            document.getElementById('toothNumber').value = '';
            document.getElementById('treatmentTypeSelect').value = '';
            document.getElementById('treatmentNotesInput').value = '';
            document.getElementById('treatmentCostInput').value = '';
            document.getElementById('treatmentPaidInput').value = '';
            document.getElementById('remainingSpan').textContent = '0';
            
            resetToothSelectionSimple();
            
        } finally {
            setTimeout(() => {
                isSaving = false;
            }, 1000);
        }
        
    } else {
        showAlert('dashboardAlert', '⚠️ الرجاء اختيار المعالجة والأسنان', 'error');
        return;
    }
            }
                
        
async function saveAndShareNow() {
    if (isSaving) {
        showAlert('dashboardAlert', '⚠️ جاري الحفظ، يرجى الانتظار...', 'warning');
        return;
    }
    
    // حفظ المعالجة أولاً
    await saveTreatmentNow();
    
    // انتظر قليلاً ثم قم بالمشاركة
    setTimeout(async () => {
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
            var cost = document.getElementById('treatmentCostInput').value || '0';
            var paid = document.getElementById('treatmentPaidInput').value || '0';
            var notes = document.getElementById('treatmentNotesInput').value;
            
            var message = '*🦷 تقرير المعالجة*\n\n';
            message += '👤 المريض: ' + patient.name + '\n';
            message += '🦷 السن: ' + tooth + '\n';
            message += '💊 نوع المعالجة: ' + type + '\n';
            message += '💰 التكلفة: ' + cost + ' ريال\n';
            message += '💵 المدفوع: ' + paid + ' ريال\n';
            message += '⚠️ المتبقي: ' + (parseFloat(cost) - parseFloat(paid)) + ' ريال\n';
            if (notes) message += '📝 ملاحظات: ' + notes + '\n';
            message += '\n🦷 ClinicPro';
            
            var phone = patient.phone || '967773041464';
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.startsWith('7') && phone.length === 9) {
                phone = '967' + phone;
            }
            
            window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank');
            showAlert('dashboardAlert', '✅ تم حفظ ومشاركة التقرير', 'success');
            
            // تحديث واجهة تفاصيل المريض
            var detailsModal = document.getElementById('patientDetailsModal');
            if (detailsModal && detailsModal.style.display === 'flex') {
                await showPatientFullDetails(currentPatientId);
            }
        }
    }, 500);
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
        html += '<button onclick="editPatient(\'' + p._id + '\')">✏️</button>';
html += '<button onclick="showTreatmentModal(\'' + p._id + '\')">🩺</button>';
html += '<button onclick="sharePatientWithoutImages(\'' + p._id + '\')" style="background:#25d366;">📱</button>';
html += '<button onclick="deletePatient(\'' + p._id + '\')">🗑️</button>';
        html += '</div></div>';
        html += '<div class="patient-body">';
        html += '<p>📞 ' + escapeHtml(p.phone || 'غير محدد') + '</p>';
html += '<p>📅 العمر: ' + p.age + ' سنة</p>';
        if (isPending) {
            html += '<p style="color:#f59e0b;">🔄 في انتظار المزامنة مع الخادم</p>';
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
            if (normalizeId(allPatients[i]._id) === normalizeId(pid)) {
                patient = allPatients[i];
                break;
            }
        }
        if (!patient) {
            showAlert('dashboardAlert', 'المريض غير موجود', 'error');
            return;
        }
        var isOfflinePatient = (patient.pendingSync === true || patient.offline === true);
        
        // ✅ التعديل هنا: جلب المعالجات من السيرفر أولاً
        var treatments = [];
        
        // 1. محاولة جلب المعالجات من السيرفر (الأولوية القصوى)
        if (navigator.onLine) {
            try {
                var r = await fetch('/api/treatments/patient/' + pid);
                if (r.ok) {
    var serverTreatments = await r.json();
    console.log('🌐 تم جلب', serverTreatments.length, 'معالجة من السيرفر');
    
    // تطبيع المعرفات في معالجات السيرفر
    for (var s = 0; s < serverTreatments.length; s++) {
        serverTreatments[s].patientId = normalizeId(serverTreatments[s].patientId);
        serverTreatments[s].userId = normalizeId(serverTreatments[s].userId);
    }
    treatments = serverTreatments;
    
    // حفظ معالجات السيرفر في localStorage...
    let localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    for (const serverTx of treatments) {
        const exists = localTreatments.some(localTx => normalizeId(localTx._id) === normalizeId(serverTx._id));
        if (!exists) {
            localTreatments.push({
                ...serverTx,
                offline: false,
                pendingSync: false,
                payments: serverTx.payments || []
            });
        }
    }
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(localTreatments));
                                    } else {
                    console.log('⚠️ فشل جلب المعالجات من السيرفر');
                }
            } catch (e) {
                console.log('❌ خطأ في الاتصال بالسيرفر:', e);
            }
        }
        
        // 2. إذا لم يتم جلب أي معالجات من السيرفر، جرب من localStorage
        if (treatments.length === 0) {
            var localTreatments = [];
            try {
                localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                console.log('📦 المعالجات من localStorage:', localTreatments.length);
            } catch(e) { console.log('Parse error:', e); }
            
            // البحث عن معالجات هذا المريض
            // تطبيع pid للمقارنة
var normalizedPid = normalizeId(pid);

for (var i = 0; i < localTreatments.length; i++) {
    var t = localTreatments[i];
    var treatmentPatientId = normalizeId(t.patientId);
    
    // مقارنة بعد تطبيع كلا المعرفين
    if (treatmentPatientId === normalizedPid || t.patientName === patient.name) {
        treatments.push(t);
    }
}
            console.log('📋 تم العثور على', treatments.length, 'معالجة في localStorage');
        }
        
        // ترتيب المعالجات حسب التاريخ (الباقي كما هو دون تغيير)
        treatments.sort(function(a, b) {
            return new Date(b.treatmentDate) - new Date(a.treatmentDate);
        });
        
        var totalCost = 0;
        var totalPaid = 0;
        var treatmentsHtml = '';
        
        for (var i = 0; i < treatments.length; i++) {
            var t = treatments[i];
            var cost = t.cost || 0;
            
            // حساب المدفوع
            var paid = 0;
            if (t.payments && t.payments.length > 0) {
                for (var p = 0; p < t.payments.length; p++) {
                    paid += t.payments[p].amount || 0;
                }
            } else if (t.paid) {
                paid = t.paid;
            } else if (t.notes && !t.paid) {
                var match = t.notes.match(/المدفوع:\s*([\d.]+)/);
                if (match) paid = parseFloat(match[1]);
            }
            
            totalCost += cost;
            totalPaid += paid;
            var isOffline = (t.offline === true || t.pendingSync === true);
            var offlineBadge = isOffline ? '<span style="background:#f59e0b; font-size:10px; padding:2px 6px; border-radius:20px; margin-right:8px;">📴 مؤقت</span>' : '';
            var bgStyle = isOffline ? 'background:#fef3c7;' : '';
            var remaining = cost - paid;
            var remainingColor = remaining > 0 ? '#ef4444' : '#10b981';
            
            // عرض سجل الدفعات
            var paymentHistoryHtml = '';
            if (t.payments && t.payments.length > 0) {
                paymentHistoryHtml = '<div style="background:#f1f5f9; border-radius:10px; padding:8px; margin-top:8px;">';
                paymentHistoryHtml += '<div style="font-size:11px; color:#1e40af; font-weight:bold; margin-bottom:5px;">🕐 سجل الدفعات:</div>';
                for (var p = 0; p < t.payments.length; p++) {
                    var pay = t.payments[p];
                    var payDate = pay.date ? new Date(pay.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
                    paymentHistoryHtml += '<div style="font-size:11px; padding:3px 0; border-bottom:1px solid #e2e8f0;">';
                    paymentHistoryHtml += '💵 ' + (pay.amount || 0) + ' ريال - 📅 ' + payDate;
                    if (pay.note) paymentHistoryHtml += ' - 📝 ' + escapeHtml(pay.note);
                    paymentHistoryHtml += '</div>';
                }
                paymentHistoryHtml += '</div>';
            }
            
            // عرض سجل العوائد
            var followUpsHtml = '';
            if (t.followUps && t.followUps.length > 0) {
                followUpsHtml = '<div style="background:#fef3c7; border-radius:10px; padding:8px; margin-top:8px;">';
                followUpsHtml += '<div style="font-size:11px; color:#d97706; font-weight:bold; margin-bottom:5px;">↩️ سجل العوائد:</div>';
                for (var f = 0; f < t.followUps.length; f++) {
                    var fu = t.followUps[f];
                    var fuDate = fu.date ? new Date(fu.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
                    followUpsHtml += '<div style="font-size:11px; padding:3px 0; border-bottom:1px solid #fde68a;">';
                    followUpsHtml += '📅 ' + fuDate + ': ' + escapeHtml(fu.notes.substring(0, 50));
                    if (fu.amountPaid > 0) followUpsHtml += ' | 💵 دفع: ' + fu.amountPaid + ' ريال';
                    followUpsHtml += '</div>';
                }
                followUpsHtml += '</div>';
            }
            
            // الأزرار - مع التحقق من الصلاحيات
            var addPaymentBtn = '';
            var addFollowUpBtn = '';
            
            // فقط دكتور عيادة أو مدير يمكنهم إضافة دفعة وعودة
            if (currentUser.subscriptionType === 'clinic' || currentUser.role === 'admin') {
                addPaymentBtn = '<button class="add-payment-btn" onclick="event.stopPropagation(); showAddPaymentModal(\'' + t._id + '\', \'' + pid + '\')" style="background:#10b981; color:white; border:none; padding:4px 10px; border-radius:20px; font-size:11px; cursor:pointer; margin-top:8px;"><i class="fas fa-plus-circle"></i> إضافة دفعة</button>';
                
                addFollowUpBtn = '<button class="add-followup-btn" onclick="event.stopPropagation(); openFollowUpModal(\'' + t._id + '\', \'' + pid + '\')" style="background:#f59e0b; color:white; border:none; padding:4px 10px; border-radius:20px; font-size:11px; cursor:pointer; margin-top:8px; margin-right:5px;"><i class="fas fa-undo-alt"></i> إضافة عودة</button>';
            }
            
            // زر المشاركة والحذف متاحان للجميع
            var shareTreatmentBtn = '<button class="share-treatment-btn" onclick="event.stopPropagation(); shareSingleTreatment(\'' + t._id + '\', \'' + pid + '\')" style="background:#25d366; color:white; border:none; padding:4px 10px; border-radius:20px; font-size:11px; cursor:pointer; margin-top:8px; margin-right:5px;"><i class="fab fa-whatsapp"></i> مشاركة</button>';
            var deleteTreatmentBtn = '<button class="delete-treatment-btn" onclick="event.stopPropagation(); deleteTreatment(\'' + t._id + '\', \'' + pid + '\')" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:20px; font-size:11px; cursor:pointer; margin-top:8px; margin-right:5px;"><i class="fas fa-trash-alt"></i> حذف</button>';
            
            treatmentsHtml += '<div style="padding:12px; border-bottom:1px solid #e2e8f0; ' + bgStyle + '">';
            treatmentsHtml += '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">';
            treatmentsHtml += '<div><strong>🦷 السن ' + t.toothNumber + '</strong> - ' + t.treatmentType + offlineBadge + '</div>';
            treatmentsHtml += '<div style="font-size:11px; color:#64748b;">📅 ' + new Date(t.treatmentDate).toLocaleDateString('ar-EG') + '</div>';
            treatmentsHtml += '</div>';
            treatmentsHtml += '<div style="margin-top:5px;"><span style="font-size:13px;">💰 ' + cost + ' ريال</span> | <span style="color:#10b981; font-size:13px;">💵 ' + paid + ' ريال</span> | <span style="color:' + remainingColor + '; font-size:13px;">⚠️ ' + remaining + ' ريال</span></div>';
            treatmentsHtml += paymentHistoryHtml;
            treatmentsHtml += followUpsHtml;
            
            treatmentsHtml += '<div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:8px;">' + addPaymentBtn + addFollowUpBtn + shareTreatmentBtn + deleteTreatmentBtn + '</div>';     
            treatmentsHtml += '</div>';
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
        modalHtml += '<h4>🦷 سجل المعالجات (' + treatments.length + ')</h4>';
        modalHtml += '<div style="max-height:300px; overflow-y:auto; margin-bottom:20px;">' + (treatmentsHtml || '<p style="text-align:center;padding:20px;">لا توجد معالجات مسجلة</p>') + '</div>';
        modalHtml += '<div style="background:#e0f2fe; padding:15px; border-radius:15px; margin-bottom:20px;">';
        modalHtml += '<p><strong>💰 إجمالي التكلفة:</strong> ' + totalCost + ' ريال</p>';
        modalHtml += '<p><strong>💵 إجمالي المدفوع:</strong> ' + totalPaid + ' ريال</p>';
        modalHtml += '<p><strong style="color:' + remainingColor + ';">⚠️ المتبقي:</strong> ' + remaining + ' ريال</p>';
        modalHtml += '</div>';
        modalHtml += '<div style="display:flex; gap:10px; flex-wrap:wrap;">';
        modalHtml += '<button class="btn" onclick="closeModal(\'patientDetailsModal\'); editPatient(\'' + patient._id + '\')" style="flex:1;">تعديل</button>';
        modalHtml += '<button class="btn btn-secondary" onclick="closeModal(\'patientDetailsModal\'); showTreatmentModal(\'' + patient._id + '\')" style="flex:1;">إضافة معالجة</button>';
        modalHtml += '<button class="btn btn-whatsapp" onclick="sharePatientWithoutImages(\'' + patient._id + '\')" style="flex:1;"><i class="fab fa-whatsapp"></i> مشاركة</button>';
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
    } catch (error) {
        console.error('Error showing patient details:', error);
        showAlert('dashboardAlert', 'خطأ في جلب بيانات المريض', 'error');
    }
}
    

// حذف معالجة - مع مزامنة مع السيرفر
window.deleteTreatment = async function(treatmentId, patientId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه المعالجة؟\n\nسيتم حذف جميع الدفعات والعوائد المرتبطة بها.\nهذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    // 1. محاولة الحذف من السيرفر أولاً
    if (navigator.onLine) {
        try {
            const response = await fetch('/api/treatments/' + treatmentId, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                // 2. حذف من localStorage أيضاً
                let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
                let treatmentIndex = treatments.findIndex(t => t._id === treatmentId);
                if (treatmentIndex !== -1) {
                    treatments.splice(treatmentIndex, 1);
                    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
                }
                
                alert('✅ تم حذف المعالجة بنجاح');
                showPatientFullDetails(patientId);
                return;
            } else {
                console.error('فشل الحذف من السيرفر');
            }
        } catch (e) {
            console.error('خطأ في الاتصال بالسيرفر:', e);
        }
    }
    
    // 3. إذا كان غير متصل أو فشل السيرفر، احذف محلياً فقط
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let treatmentIndex = treatments.findIndex(t => t._id === treatmentId);
    
    if (treatmentIndex === -1) {
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    treatments.splice(treatmentIndex, 1);
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    alert('📴 تم حذف المعالجة محلياً. سيتم المزامنة مع السيرفر عند استعادة الاتصال.');
    showPatientFullDetails(patientId);
};

// ============ صفحة الادمن ============
async function loadAdminUsers() {
    try {
        var r = await fetch('/api/admin/users');
        allAdminUsers = await r.json();
        renderAdminUsers(allAdminUsers);
    } catch (e) { console.log('Load admin users error:', e); }
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
// دالة إرسال إشعار إلى تطبيق Android
function sendNotificationToApp(title, body) {
    if (window.AndroidBridge) {
        window.AndroidBridge.showNotification(title, body);
        console.log("✅ تم إرسال الإشعار إلى تطبيق ClinicPro");
    } else {
        console.log("⚠️ التطبيق ليس في وضع WebView");
    }
}

// مثال: استدعاء عند الحاجة
// sendNotificationToApp("تنبيه", "لديك موعد جديد");

// إذا كان لديك نظام إشعارات موجود، قم بتعديله ليستخدم هذه الدالة
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
            // 1. تسجيل المستخدم
            var response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            var result = await response.json();
            
            if (response.ok && result.success) {
                // 2. تسجيل الدخول التلقائي مباشرة
                var loginResponse = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: data.username,
                        password: data.password
                    })
                });
                
                var loginResult = await loginResponse.json();
                
                if (loginResponse.ok && loginResult.success) {
                    currentUser = loginResult.user;
                    
                    // حفظ البيانات
                    localStorage.setItem('userId', currentUser.id);
                    saveOfflineAuth(currentUser, data.password);
                    
                    // إخفاء صفحات التسجيل والدخول
                    document.getElementById('registerPage').style.display = 'none';
                    document.getElementById('loginPage').style.display = 'none';
                    
                    // تحميل لوحة التحكم
                    await loadDashboard();
                    
                    showAlert('dashboardAlert', '✅ تم إنشاء الحساب وتسجيل الدخول بنجاح', 'success');
                } else {
                    showAlert('registerAlert', 'تم إنشاء الحساب ولكن فشل تسجيل الدخول التلقائي', 'error');
                    showLogin();
                }
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

// ✅ دالة تسجيل الدخول التلقائي بعد التسجيل
async function autoLoginAfterRegister(username, password) {
    try {
        console.log('🔄 محاولة تسجيل الدخول التلقائي لـ:', username);
        
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
            } catch(e) { console.log('Save error:', e); }
            
            document.getElementById('registerPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'none';
            
            // جلب المرضى
            try {
                var patientsRes = await fetch('/api/patients/' + currentUser.id);
                if (patientsRes.ok) {
                    var patients = await patientsRes.json();
                    allPatients = patients;
                    localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(allPatients));
                }
            } catch(e) { console.log('Error loading patients:', e); }
            
            await loadDashboard();
            showAlert('dashboardAlert', '✅ تم إنشاء الحساب وتسجيل الدخول بنجاح', 'success');
        } else {
            console.log('❌ فشل تسجيل الدخول التلقائي');
            showAlert('registerAlert', 'تم إنشاء الحساب. يرجى تسجيل الدخول يدوياً', 'warning');
            showLogin();
        }
    } catch (e) {
        console.log('Auto login error:', e);
        showAlert('registerAlert', 'تم إنشاء الحساب. يرجى تسجيل الدخول يدوياً', 'warning');
        showLogin();
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
// ✅ تأكد من وجود clinicName و phone
if (!currentUser.clinicName) currentUser.clinicName = '';
if (!currentUser.phone) currentUser.phone = '';
console.log('✅ تم تحديث بيانات المستخدم:', {
    username: currentUser.username,
    clinicName: currentUser.clinicName,
    phone: currentUser.phone
});
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
;
        checkPatientLimit();
    
        updateNotificationBadge();

        
        if (navigator.onLine) {
            try {
                var r = await fetchWithTimeout('/api/user/' + uid, 8000);
                if (r.ok) {
                    var userData = await r.json();
                    currentUser = userData.user;
                    // ✅ تحديث بيانات العيادة والهاتف
if (!currentUser.clinicName) currentUser.clinicName = '';
if (!currentUser.phone) currentUser.phone = '';
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
                    
 syncTreatmentsToLocal();
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
            // بعد تحميل المرضى، قم بدمج المعالجات
restoreAndMergeAllTreatments()
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
    // في دالة syncAllDataWithServer، بعد تحميل المرضى
 syncTreatmentsToLocal();
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
            
 syncTreatmentsToLocal();
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



    async function syncPendingTreatments() {
    if (!navigator.onLine || !currentUser) {
        console.log('📴 لا يمكن المزامنة');
        return false;
    }
    
    let offlineTreatments = [];
    try {
        offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    } catch(e) { 
        return false; 
    }
    
    const pendingTreatments = offlineTreatments.filter(t => t.pendingSync === true);
    
    if (pendingTreatments.length === 0) {
        console.log('✅ لا توجد معالجات معلقة');
        return false;
    }
    
    console.log(`📋 جاري مزامنة ${pendingTreatments.length} معالجة...`);
    let syncedCount = 0;
    let successIds = [];
    
    for (const treatment of pendingTreatments) {
        try {
            // ⭐ 1. البحث عن الـ ID الصحيح للمريض
            let patientId = treatment.patientId;
            
            if (patientId && patientId.toString().startsWith('offline_')) {
                // البحث عن المريض في allPatients (البيانات المدمجة من السيرفر والمحلية)
                const matchedPatient = allPatients.find(p => 
                    p.name === treatment.patientName && !p._id.toString().startsWith('offline_')
                );
                
                if (matchedPatient) {
                    patientId = matchedPatient._id;
                    console.log(`✅ تم العثور على المريض: ${treatment.patientName}`);
                } else {
                    console.log(`⚠️ المريض "${treatment.patientName}" غير موجود في السيرفر، تأجيل المزامنة`);
                    continue; // انتظر حتى يتم مزامنة المريض أولاً
                }
            }
            
            // ⭐ 2. معالجة toothNumber - استخراج رقم واحد فقط للسيرفر
            let toothNumberForServer = 11; // قيمة افتراضية
            
            if (treatment.toothNumber) {
                if (typeof treatment.toothNumber === 'number') {
                    toothNumberForServer = treatment.toothNumber;
                } else if (typeof treatment.toothNumber === 'string') {
                    // استخراج أول رقم من النص (مثال: "11، 12، 13" -> 11)
                    const numbers = treatment.toothNumber.match(/\d+/g);
                    if (numbers && numbers.length > 0) {
                        toothNumberForServer = parseInt(numbers[0]);
                    }
                }
            }
            
            // ⭐ 3. معالجة treatmentType - تبسيط النوع للسيرفر
            let treatmentTypeForServer = treatment.treatmentType || 'معالجة';
            if (treatmentTypeForServer.length > 50) {
                // تقطيع النص إذا كان طويلاً جداً
                treatmentTypeForServer = treatmentTypeForServer.substring(0, 50);
            }
            
            // ⭐ 4. حساب المدفوع والمتبقي
            let paidAmount = treatment.paid || 0;
            
            // إذا كان هناك دفعات مسجلة، اجمعها
            if (treatment.payments && treatment.payments.length > 0) {
                paidAmount = treatment.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            }
            
            // ⭐ 5. إرسال البيانات إلى السيرفر
            const response = await fetch('/api/treatments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: patientId,
                    userId: currentUser.id,
                    toothNumber: toothNumberForServer,
                    treatmentType: treatmentTypeForServer,
                    cost: treatment.cost || 0,
                    paid: paidAmount,
                    notes: treatment.notes || '',
                    treatmentDate: treatment.treatmentDate || new Date().toISOString()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ تمت مزامنة المعالجة: ${treatmentTypeForServer}`);
                syncedCount++;
                successIds.push(treatment._id);
            } else {
                const errorText = await response.text();
                console.log(`❌ فشل المزامنة: ${errorText}`);
            }
        } catch (e) {
            console.log(`❌ خطأ:`, e);
        }
    }
    
    // حذف المعالجات التي تمت مزامنتها
    if (syncedCount > 0) {
        const remainingTreatments = offlineTreatments.filter(t => !successIds.includes(t._id));
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(remainingTreatments));
        showAlert('dashboardAlert', `✅ تمت مزامنة ${syncedCount} معالجة`, 'success');
        
        // تحديث الواجهة
        await loadPatients();
        if (currentPatientId) {
            await showPatientFullDetails(currentPatientId);
        }
    }
    
    return syncedCount > 0;
    }

// ============ مزامنة الصور (معطلة) ============
async function syncPatientImagesToServer() {
    // تم تعطيل خاصية الصور
    return false;
}

// ============ مشاركة التقرير بدون صور ============

            // مشاركة تقرير كامل للمريض
async function sharePatientWithoutImages(patientId) {
    var patient = null;
    for (var i = 0; i < allPatients.length; i++) {
        if (allPatients[i]._id === patientId) {
            patient = allPatients[i];
            break;
        }
    }
    if (!patient) return;
    
    showAlert('dashboardAlert', '🔄 جاري تجهيز التقرير...', 'info');
    
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
    
    // ترتيب المعالجات حسب التاريخ
    treatments.sort(function(a, b) {
        return new Date(b.treatmentDate) - new Date(a.treatmentDate);
    });
    
    // حساب الإجماليات
    var totalCost = 0;
    var totalPaid = 0;
    var treatmentsText = '';
    
    if (treatments.length > 0) {
        treatmentsText = '\n\n━━━━━━━━━━━━━━━━━━━━\n';
        treatmentsText += '🦷 *سجل المعالجات*\n';
        treatmentsText += '━━━━━━━━━━━━━━━━━━━━\n\n';
        
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
            
            treatmentsText += `📌 *المعالجة ${i+1}:*\n`;
            treatmentsText += `   🦷 السن: ${t.toothNumber || 'غير محدد'}\n`;
            treatmentsText += `   💊 النوع: ${t.treatmentType || 'غير محدد'}\n`;
            treatmentsText += `   📅 التاريخ: ${date}\n`;
            treatmentsText += `   💰 التكلفة: ${cost} ريال\n`;
            treatmentsText += `   💵 المدفوع: ${paid} ريال\n`;
            treatmentsText += `   ${remainingText}\n\n`;
            
            // إضافة سجل الدفعات
            if (t.payments && t.payments.length > 0) {
                treatmentsText += `   💳 *سجل الدفعات:*\n`;
                for (var p = 0; p < t.payments.length; p++) {
                    var pay = t.payments[p];
                    var payDate = pay.date ? new Date(pay.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
                    treatmentsText += `      • ${payDate}: ${pay.amount} ريال`;
                    if (pay.note) treatmentsText += ` (${pay.note.substring(0, 40)})`;
                    treatmentsText += `\n`;
                }
                treatmentsText += `\n`;
            }
            
            // إضافة سجل العوائد
            if (t.followUps && t.followUps.length > 0) {
                treatmentsText += `   🔄 *سجل العوائد:*\n`;
                for (var f = 0; f < t.followUps.length; f++) {
                    var fu = t.followUps[f];
                    var fuDate = fu.date ? new Date(fu.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
                    treatmentsText += `      • ${fuDate}: ${fu.notes || 'بدون ملاحظات'}`;
                    if (fu.amountPaid > 0) treatmentsText += ` (دفع: ${fu.amountPaid} ريال)`;
                    treatmentsText += `\n`;
                }
                treatmentsText += `\n`;
            }
            
            treatmentsText += '   ─────────────────────\n\n';
        }
        
        var remainingTotal = totalCost - totalPaid;
        treatmentsText += `━━━━━━━━━━━━━━━━━━━━\n`;
        treatmentsText += `📊 *ملخص الحساب*\n`;
        treatmentsText += `━━━━━━━━━━━━━━━━━━━━\n`;
        treatmentsText += `💰 إجمالي التكلفة: ${totalCost} ريال\n`;
        treatmentsText += `💵 إجمالي المدفوع: ${totalPaid} ريال\n`;
        treatmentsText += `⚠️ المتبقي: ${remainingTotal} ريال\n`;
    } else {
        treatmentsText = '\n\n━━━━━━━━━━━━━━━━━━━━\n';
        treatmentsText += '🦷 *سجل المعالجات*\n';
        treatmentsText += '━━━━━━━━━━━━━━━━━━━━\n';
        treatmentsText += 'لا توجد معالجات مسجلة\n';
    }
    
    // بناء الرسالة النهائية
    var message = '*🦷 مرحباً، هذا تقرير حالتك الصحية*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';
    message += '👤 *بيانات المريض:*\n';
    message += `   • الاسم: ${patient.name}\n`;
    message += `   • العمر: ${patient.age} سنة\n`;
    if (patient.phone) message += `   • الهاتف: ${patient.phone}\n`;
    if (patient.address) message += `   • العنوان: ${patient.address}\n`;
    message += '\n👨‍⚕️ *بيانات العيادة:*\n';
    message += `   • اسم الطبيب: ${currentUser.fullName || currentUser.username}\n`;
    message += `   • اسم العيادة: ${currentUser.clinicName || 'عيادة الأسنان'}\n`;
    if (currentUser.phone) message += `   • هاتف العيادة: ${currentUser.phone}\n`;
    message += treatmentsText;
    message += '\n━━━━━━━━━━━━━━━━━━━━\n';
    message += '🦷 *ClinicPro - نظام إدارة عيادات الأسنان*\n';
    message += '🌸 *نتمنى لكم دوام الصحة والعافية*\n';
    
    // إرسال الرسالة عبر واتساب
    var phoneNumber = patient.phone || '967773041464';
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('7') && phoneNumber.length === 9) {
        phoneNumber = '967' + phoneNumber;
    }
    
    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
    showAlert('dashboardAlert', '✅ تم فتح واتساب لمشاركة تقرير ' + patient.name, 'success');
}
// عرض سجل الدفعات لمعالجة معينة
function renderPaymentHistory(payments) {
    if (!payments || payments.length === 0) return '<div class="payment-history"><div class="payment-history-title">💰 سجل الدفعات</div><div style="color:#94a3b8; text-align:center; padding:8px">لا توجد دفعات مسجلة</div></div>';
    
    let html = '<div class="payment-history"><div class="payment-history-title">💰 سجل الدفعات</div>';
    for (let p of payments) {
        let date = p.date ? new Date(p.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
        html += `<div class="payment-item">
                    <strong>💵 ${p.amount} ريال</strong>
                    <small>📅 ${date}</small>
                    ${p.note ? `<small>📝 ${escapeHtml(p.note)}</small>` : ''}
                 </div>`;
    }
    html += '</div>';
    return html;
}

// فتح نافذة إضافة دفع لمعالجة محددة
let currentPaymentTreatmentId = null;
let currentPaymentPatientId = null;

function showAddPaymentModal(treatmentId, patientId) {
    currentPaymentTreatmentId = treatmentId;
    currentPaymentPatientId = patientId;
    
    let modalHtml = `
        <div id="paymentModal" class="modal" style="display:flex">
            <div class="modal-content modal-small">
                <div class="modal-header">
                    <h3><i class="fas fa-money-bill-wave"></i> إضافة دفعة جديدة</h3>
                    <button class="close-btn" onclick="closePaymentModal()">&times;</button>
                    </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label>💵 المبلغ</label>
                        <input type="number" id="paymentAmount" placeholder="المبلغ" step="1" style="width:100%; padding:10px; border-radius:8px">
                    </div>
                    <div class="input-group">
                        <label>📅 تاريخ الدفع</label>
                        <input type="date" id="paymentDate" style="width:100%; padding:10px; border-radius:8px">
                    </div>
                    <div class="input-group">
                        <label>📝 ملاحظات (اختياري)</label>
                        <textarea id="paymentNote" rows="2" placeholder="ملاحظات عن الدفعة" style="width:100%; padding:10px; border-radius:8px"></textarea>
                    </div>
                    <button class="btn" onclick="addPaymentToTreatment()" style="width:100%">💾 إضافة الدفعة</button>
                </div>
            </div>
        </div>
    `;
    
    // إزالة المودال القديم إذا وجد
    let existing = document.getElementById('paymentModal');
    if (existing) existing.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
}
function closePaymentModal() {
    let modal = document.getElementById('paymentModal');
    if (modal) modal.remove();
}

// إضافة دفعة جديدة لمعالجة محددة
async function addPaymentToTreatment() {
    // ✅ أضف هذا السطر
    if (!currentUser) {
        showAlert('dashboardAlert', '⚠️ يرجى تسجيل الدخول أولاً', 'error');
        return;
    }
    let amount = parseFloat(document.getElementById('paymentAmount').value);
    if (isNaN(amount) || amount <= 0) {
        showAlert('dashboardAlert', '⚠️ الرجاء إدخال مبلغ صحيح', 'error');
        return;
    }
    
    let paymentDate = document.getElementById('paymentDate').value;
    let paymentNote = document.getElementById('paymentNote').value;
    
    // 1. جلب المعالجة من localStorage
    let offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let treatmentIndex = offlineTreatments.findIndex(t => t._id === currentPaymentTreatmentId);
    
    if (treatmentIndex === -1) {
        showAlert('dashboardAlert', '⚠️ لم يتم العثور على المعالجة', 'error');
        return;
    }
    
    let treatment = offlineTreatments[treatmentIndex];
    
    // 2. إنشاء سجل الدفعة الجديد
    let newPayment = {
        id: 'pay_' + Date.now() + '_' + Math.random(),
        amount: amount,
        date: paymentDate,
        note: paymentNote,
        createdAt: new Date().toISOString()
    };
    
    // 3. تحديث سجل الدفعات
    let payments = treatment.payments || [];
    payments.push(newPayment);
    
    // 4. حساب إجمالي المدفوع الجديد
    let totalPaid = 0;
    for (let p of payments) {
        totalPaid += p.amount;
    }
    
    // 5. تحديث المعالجة
    treatment.payments = payments;
    treatment.paid = totalPaid;
    
    // 6. تحديث notes القديم للحفاظ على التوافق
    let cost = treatment.cost || 0;
    treatment.notes = `التكلفة: ${cost} | المدفوع: ${totalPaid} | المتبقي: ${cost - totalPaid}\n${treatment.originalNotes || treatment.notes || ''}`;
    
    // 7. حفظ المعالجة المحدثة
    offlineTreatments[treatmentIndex] = treatment;
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTreatments));
    
    // 8. تحديث بيانات المريض في localStorage (لتحديث الإجمالي)
    await updateLocalPatientTotal(currentPaymentPatientId);
    
    // 9. إغلاق المودال وتحديث واجهة المريض
    closeModal('paymentModal');
    showAlert('dashboardAlert', `✅ تم إضافة دفعة بقيمة ${amount} ريال`, 'success');
    
    // 10. تحديث تفاصيل المريض المعروضة
    await showPatientFullDetails(currentPaymentPatientId);
}

// تحديث إجماليات المريض في localStorage
async function updateLocalPatientTotal(patientId) {
    let offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let patientTreatments = offlineTreatments.filter(t => t.patientId === patientId);
    
    let totalPaid = 0;
    let totalCost = 0;
    for (let t of patientTreatments) {
        totalCost += t.cost || 0;
        totalPaid += t.paid || 0;
    }
    
    // حفظ الإجمالي في المريض (اختياري، يمكن استخدامه لاحقاً)
    let offlinePatients = JSON.parse(localStorage.getItem('offline_patients_' + currentUser.id) || '[]');
    let patientIndex = offlinePatients.findIndex(p => p._id === patientId);
    if (patientIndex !== -1) {
        offlinePatients[patientIndex].totalCost = totalCost;
        offlinePatients[patientIndex].totalPaid = totalPaid;
        localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(offlinePatients));
    }
}

// دالة مزامنة المرضى المعلقين (مع تحديث المعالجات)
async function syncPendingPatients() {
    if (!navigator.onLine || !currentUser) return false;
    
    const offlinePatients = getOfflinePatients();
    const pendingPatients = offlinePatients.filter(p => p.pendingSync === true);
    
    if (pendingPatients.length === 0) return false;
    
    console.log(`📋 جاري مزامنة ${pendingPatients.length} مريض معلق...`);
    let syncedCount = 0;
    let syncedPatientsMap = {};
    
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
                console.log(`✅ تمت مزامنة المريض: ${patient.name} -> ID: ${result.patient._id}`);
                
                // حفظ العلاقة بين ID القديم والجديد
                syncedPatientsMap[patient._id] = result.patient._id;
                
                // تحديث البيانات المحلية
                const updatedPatients = getOfflinePatients();
                const index = updatedPatients.findIndex(p => p._id === patient._id);
                if (index !== -1) {
                    updatedPatients[index]._id = result.patient._id;
                    updatedPatients[index].pendingSync = false;
                    updatedPatients[index].offline = false;
                    localStorage.setItem('offline_patients_' + currentUser.id, JSON.stringify(updatedPatients));
                }
                syncedCount++;
            }
        } catch (e) {
            console.log(`❌ خطأ في مزامنة المريض ${patient.name}:`, e);
        }
    }
    
    // ✅ تحديث patientId في المعالجات المعلقة
    if (Object.keys(syncedPatientsMap).length > 0) {
        let offlineTreatments = [];
        try {
            offlineTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        } catch(e) {}
        
        let updated = false;
        for (let i = 0; i < offlineTreatments.length; i++) {
            const oldId = offlineTreatments[i].patientId;
            if (syncedPatientsMap[oldId]) {
                offlineTreatments[i].patientId = syncedPatientsMap[oldId];
                updated = true;
                console.log(`✅ تحديث patientId في المعالجة من ${oldId} إلى ${syncedPatientsMap[oldId]}`);
            }
        }
        
        if (updated) {
            localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(offlineTreatments));
        }
    }
    
    // تحديث allPatients
    await loadPatients();
    
    return syncedCount > 0;
}
    
    


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
     syncAllDataWithServer();
    
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


        


// ============================================
// إضافة دفعة لمعالجة سابقة فقط
// ============================================

window.openPaymentOnlyModalFirst = function() {
    if (!currentPatientId) {
        alert('⚠️ الرجاء فتح ملف مريض أولاً');
        return;
    }
    
    // جلب معالجات المريض الحالي
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let patientTreatments = treatments.filter(t => t.patientId === currentPatientId);
    
    if (patientTreatments.length === 0) {
        alert('⚠️ لا توجد معالجات مسجلة لهذا المريض');
        return;
    }
    
    // بناء خيارات القائمة
    let optionsHtml = '<option value="">-- اختر معالجة --</option>';
    for (let t of patientTreatments) {
        let remaining = (t.cost || 0) - (t.paid || 0);
        optionsHtml += `<option value="${t._id}" data-cost="${t.cost || 0}" data-paid="${t.paid || 0}" data-remaining="${remaining}" data-name="السن ${t.toothNumber} - ${t.treatmentType}">السن ${t.toothNumber} - ${t.treatmentType} (متبقي: ${remaining} ريال)</option>`;
    }
    
    let modalHtml = `
        <div id="paymentOnlyModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; justify-content:center; align-items:center; z-index:100000;">
            <div style="background:white; border-radius:20px; max-width:450px; width:90%;">
                <div style="padding:15px; background:#10b981; color:white; border-radius:20px 20px 0 0; display:flex; justify-content:space-between;">
                    <h3 style="margin:0"><i class="fas fa-money-bill-wave"></i> إضافة دفعة لمعالجة سابقة</h3>
                    <button onclick="document.getElementById('paymentOnlyModal').remove()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">&times;</button>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">🦷 اختر المعالجة</label>
                        <select id="paymentOnlyTreatmentSelect" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;">${optionsHtml}</select>
                    </div>
                    <div id="paymentOnlyDetails" style="background:#f1f5f9; padding:12px; border-radius:12px; margin-bottom:15px; display:none;"></div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">💰 المبلغ</label>
                        <input type="number" id="paymentOnlyAmount" placeholder="المبلغ" step="10" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;">
                    </div>
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">📅 تاريخ الدفع</label>
                        <input type="date" id="paymentOnlyDate" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">📝 ملاحظات</label>
                        <textarea id="paymentOnlyNote" rows="2" placeholder="ملاحظات عن الدفعة" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;"></textarea>
                    </div>
                    <button onclick="savePaymentOnlyData()" style="width:100%; background:#10b981; color:white; border:none; padding:12px; border-radius:8px; font-size:16px; font-weight:bold; cursor:pointer;">💾 إضافة الدفعة</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('paymentOnlyDate').value = new Date().toISOString().split('T')[0];
    
    // عرض تفاصيل المعالجة عند الاختيار
    document.getElementById('paymentOnlyTreatmentSelect').onchange = function() {
        let select = this;
        let option = select.options[select.selectedIndex];
        let detailsDiv = document.getElementById('paymentOnlyDetails');
        
        if (option.value) {
            detailsDiv.style.display = 'block';
            detailsDiv.innerHTML = `
                <div><strong>🦷 المعالجة:</strong> ${option.getAttribute('data-name')}</div>
                <div><strong>💰 التكلفة:</strong> ${option.getAttribute('data-cost')} ريال</div>
                <div><strong>💵 المدفوع حتى الآن:</strong> ${option.getAttribute('data-paid')} ريال</div>
                <div><strong>⚠️ المتبقي:</strong> ${option.getAttribute('data-remaining')} ريال</div>
            `;
        } else {
            detailsDiv.style.display = 'none';
        }
    };
};

// حفظ الدفعة فقط
window.savePaymentOnlyData = function() {
    let treatmentId = document.getElementById('paymentOnlyTreatmentSelect').value;
    if (!treatmentId) {
        alert('⚠️ الرجاء اختيار المعالجة');
        return;
    }
    
    let amount = parseFloat(document.getElementById('paymentOnlyAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('⚠️ الرجاء إدخال مبلغ صحيح');
        return;
    }
    
    let date = document.getElementById('paymentOnlyDate').value;
    let note = document.getElementById('paymentOnlyNote').value;
    
    // جلب المعالجات
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let treatmentIndex = treatments.findIndex(t => t._id === treatmentId);
    
    if (treatmentIndex === -1) {
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    let treatment = treatments[treatmentIndex];
    
    // إضافة الدفعة
    if (!treatment.payments) treatment.payments = [];
    treatment.payments.push({
        id: 'pay_' + Date.now(),
        amount: amount,
        date: date,
        note: note,
        createdAt: new Date().toISOString()
    });
    
    // تحديث إجمالي المدفوع
    let totalPaid = 0;
    for (let p of treatment.payments) totalPaid += p.amount;
    treatment.paid = totalPaid;
    
    // حفظ
    treatments[treatmentIndex] = treatment;
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
    
    // إغلاق المودال
    let modal = document.getElementById('paymentOnlyModal');
    if (modal) modal.remove();
    
    alert(`✅ تم إضافة دفعة بقيمة ${amount} ريال بنجاح`);
    location.reload();
};

console.log('✅ جميع دوال العودة والدفع جاهزة');
// ============ حفظ معالجات السيرفر في localStorage ============
// ============ حفظ معالجات السيرفر في localStorage ============
async function syncTreatmentsToLocal() {
    if (!currentUser || !navigator.onLine) return;
    
    try {
        const response = await fetch('/api/treatments/user/' + currentUser.id);
        if (response.ok) {
            const serverTreatments = await response.json();
            
            // جلب المعالجات المحلية الحالية
            let localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
            
            // دمج المعالجات (تجنب التكرار)
            for (const serverTx of serverTreatments) {
                const exists = localTreatments.some(localTx => localTx._id === serverTx._id);
                if (!exists) {
                    // إضافة معالجة السيرفر إلى localStorage مع تعيين offline = false
                    localTreatments.push({
                        ...serverTx,
                        offline: false,
                        pendingSync: false,
                        payments: serverTx.payments || []
                    });
                }
            }
            
            localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(localTreatments));
            console.log('✅ تم حفظ معالجات السيرفر في localStorage:', serverTreatments.length);
        }
    } catch (e) {
        console.log('⚠️ فشل مزامنة المعالجات:', e);
    }
}
// مشاركة معالجة واحدة مع عوائدها ودفعاتها
window.shareSingleTreatment = function(treatmentId, patientId) {
    // جلب المريض
    let patient = allPatients.find(p => p._id === patientId);
    if (!patient) {
        alert('⚠️ لم يتم العثور على المريض');
        return;
    }
    
    // جلب المعالجة
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let treatment = treatments.find(t => t._id === treatmentId);
    if (!treatment) {
        alert('⚠️ لم يتم العثور على المعالجة');
        return;
    }
    
    // حساب البيانات
    let cost = treatment.cost || 0;
    let paid = treatment.paid || 0;
    let remaining = cost - paid;
    
    // بناء سجل الدفعات
    let paymentsText = '';
    if (treatment.payments && treatment.payments.length > 0) {
        paymentsText = '\n\n💵 *سجل الدفعات:*\n';
        for (let p of treatment.payments) {
            let payDate = p.date ? new Date(p.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
            paymentsText += `   📅 ${payDate}: ${p.amount} ريال`;
            if (p.note) paymentsText += ` (${p.note.substring(0, 30)})`;
            paymentsText += '\n';
        }
    }
    
    // بناء سجل العوائد
    let followUpsText = '';
    if (treatment.followUps && treatment.followUps.length > 0) {
        followUpsText = '\n\n🔄 *سجل العوائد:*\n';
        for (let fu of treatment.followUps) {
            let fuDate = fu.date ? new Date(fu.date).toLocaleDateString('ar-EG') : 'تاريخ غير محدد';
            followUpsText += `   📅 ${fuDate}: ${fu.notes || 'بدون ملاحظات'}`;
            if (fu.amountPaid > 0) followUpsText += ` (دفع: ${fu.amountPaid} ريال)`;
            followUpsText += '\n';
        }
    }
    
    // بناء الرسالة النهائية
    let message = '*🦷 تقرير المعالجة*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `👤 *المريض:* ${patient.name}\n`;
    message += `🦷 *السن:* ${treatment.toothNumber}\n`;
    message += `💊 *نوع المعالجة:* ${treatment.treatmentType}\n`;
    message += `📅 *تاريخ المعالجة:* ${new Date(treatment.treatmentDate).toLocaleDateString('ar-EG')}\n`;
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `💰 *التكلفة:* ${cost} ريال\n`;
    message += `💵 *المدفوع:* ${paid} ريال\n`;
    message += `⚠️ *المتبقي:* ${remaining} ريال\n`;
    message += paymentsText;
    message += followUpsText;
    message += '\n━━━━━━━━━━━━━━━━━━━━\n';
    message += '🦷 *ClinicPro - نظام إدارة عيادات الأسنان*';
    
    // إرسال عبر واتساب
    let phoneNumber = patient.phone || '967773041464';
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (phoneNumber.startsWith('7') && phoneNumber.length === 9) {
        phoneNumber = '967' + phoneNumber;
    }
    
    window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
    showAlert('dashboardAlert', '✅ تم فتح واتساب لمشاركة تقرير المعالجة', 'success');
};

// ============================================
// نظام المعالجة المتقدم - البيانات
// ============================================

const treatmentsData = {
    حشوات: {
        icon: "🦷",
        options: [
            { value: "حشوة فضية", name: "حشوة فضية (أملغم)" },
            { value: "حشوة ضوئية", name: "حشوة ضوئية (كومبوزيت)" },
            { value: "حشوة ضوئية مع ريبوند", name: "حشوة ضوئية مع ريبوند" },
            { value: "حشوة تجميلية أماميات", name: "حشوة تجميلية (أسنان أمامية)" }
        ],
        teethSelection: "multi" // يمكن اختيار أكثر من سن
    },
    خلع: {
        icon: "🔪",
        options: [
            { value: "خلع بسيط", name: "خلع بسيط (عادي)" },
            { value: "خلع جراحي", name: "خلع جراحي" },
            { value: "خلع بيدو", name: "خلع أطفال (بيدو)" }
        ],
        teethSelection: "multi" // يمكن اختيار أكثر من سن
    },
    "علاج عصب": {
        icon: "⚕️",
        options: [
            { value: "سحب عصب بيدو", name: "سحب عصب أطفال (بيدو)" },
            { value: "علاج عصب أمامي", name: "علاج عصب - سن أمامي" },
            { value: "علاج عصب خلفي", name: "علاج عصب - سن خلفي" },
            { value: "إعادة معالجة عصب", name: "إعادة معالجة عصب" }
        ],
        teethSelection: "single" // يمكن اختيار سن واحد فقط
    },
    تركيبات: {
        icon: "👑",
        options: [
            { value: "تلبيسة زركون", name: "تلبيسة زركون" },
            { value: "تلبيسة إيماكس", name: "تلبيسة إيماكس" },
            { value: "تلبيسة معدنية", name: "تلبيسة معدنية" },
            { value: "تلبيسة تجميلية", name: "تلبيسة تجميلية" },
            { value: "فص تجميلي", name: "فص تجميلي (فينير)" },
            { value: "جسر", name: "جسر (أسنان متعددة)" }
        ],
        teethSelection: "bridge" // للجسر يمكن اختيار أكثر من سن
    },
    تقويم: {
        icon: "📐",
        options: [
            { value: "تقويم ثابت", name: "تقويم ثابت (أسلاك)" },
            { value: "تقويم شفاف", name: "تقويم شفاف (إنفيزلاين)" },
            { value: "مثبت تقويم سلك", name: "مثبت تقويم - سلك" },
            { value: "مثبت تقويم شفاف", name: "مثبت تقويم - شفاف" }
        ],
        teethSelection: "jaw" // اختيار فك فقط
    },
    تبييض: {
        icon: "✨",
        options: [
            { value: "تبييض ليزر", name: "تبييض ليزر" },
            { value: "تبييض Antivet", name: "تبييض Antioxi" },
            { value: "تبييض ضوئي", name: "تبييض ضوئي" },
            { value: "تبييض منزلي", name: "تبييض منزلي (قوالب)" }
        ],
        teethSelection: "jaw" // اختيار فك فقط
    },
    أطقم: {
        icon: "🦷",
        options: [
            { value: "طقم كامل علوي", name: "طقم كامل - فك علوي" },
            { value: "طقم كامل سفلي", name: "طقم كامل - فك سفلي" },
            { value: "طقم كامل علوي وسفلي", name: "طقم كامل - فكين معاً" },
            { value: "طقم جزئي علوي", name: "طقم جزئي - فك علوي" },
            { value: "طقم جزئي سفلي", name: "طقم جزئي - فك سفلي" },
            { value: "طقم جزئي علوي وسفلي", name: "طقم جزئي - فكين معاً" },
            { value: "ابتسامة متحركة", name: "ابتسامة متحركة (Overlay)" }
        ],
        teethSelection: "none" // لا يحتاج تحديد أسنان
    },
    "معالجة لثة": {
        icon: "🩸",
        options: [
            { value: "تنظيف لثة", name: "تنظيف لثة (سكالينج)" },
            { value: "كشط لثة", name: "كشط لثة (كورتاج)" },
            { value: "علاج دواعم", name: "علاج دواعم الأسنان" }
        ],
        teethSelection: "none"
    },
    ابتسامة: {
        icon: "😁",
        options: [
            { value: "ابتسامة هوليود", name: "ابتسامة هوليود (قشور خزفية)" },
            { value: "ابتسامة متحركة", name: "ابتسامة متحركة" }
        ],
        teethSelection: "none"
    },
    أخرى: {
        icon: "📋",
        options: [
            { value: "فحص", name: "فحص عام" },
            { value: "تنظيف", name: "تنظيف أسنان" },
            { value: "فلورة", name: "فلورة" },
            { value: "معالجة حساسية", name: "معالجة حساسية الأسنان" }
        ],
        teethSelection: "none"
    }
};

let selectedTeethList = [];
let selectedBridgeList = [];

// تغيير القسم الرئيسي
function onMainCategoryChange() {
    let category = document.getElementById('mainCategorySelect').value;
    let subDiv = document.getElementById('subTreatmentDiv');
    let subSelect = document.getElementById('subTreatmentSelect');
    
    if (!category) {
        subDiv.style.display = 'none';
        document.getElementById('teethSelectionDiv').style.display = 'none';
        return;
    }
    
    // ملء قائمة المعالجات الفرعية
    let treatments = treatmentsData[category];
    if (treatments) {
        subSelect.innerHTML = '<option value="">-- اختر --</option>';
        for (let t of treatments.options) {
            subSelect.innerHTML += `<option value="${t.value}">${treatments.icon} ${t.name}</option>`;
        }
        subDiv.style.display = 'block';
    } else {
        subDiv.style.display = 'none';
    }
    
    // إخفاء قسم الأسنان مؤقتاً
    document.getElementById('teethSelectionDiv').style.display = 'none';
    selectedTeethList = [];
    selectedBridgeList = [];
}

// تغيير المعالجة الفرعية
function onSubTreatmentChange() {
    let category = document.getElementById('mainCategorySelect').value;
    let treatment = document.getElementById('subTreatmentSelect').value;
    
    if (!category || !treatment) {
        document.getElementById('teethSelectionDiv').style.display = 'none';
        return;
    }
    
    let treatments = treatmentsData[category];
    let selectionType = treatments.teethSelection;
    
    let teethDiv = document.getElementById('teethSelectionDiv');
    
    if (selectionType === 'jaw') {
        // اختيار الفك فقط
        teethDiv.innerHTML = `
            <div class="input-group">
                <label>🦷 اختيار الفك</label>
                <select id="jawSelect" style="width:100%; padding:12px; border-radius:12px; border:1px solid #e2e8f0;">
                    <option value="">-- اختر --</option>
                    <option value="فك علوي">🔝 فك علوي فقط</option>
                    <option value="فك سفلي">🔽 فك سفلي فقط</option>
                    <option value="فكين معاً">🔄 فكين معاً (علوي وسفلي)</option>
                </select>
            </div>
        `;
        teethDiv.style.display = 'block';
    } 
    else if (selectionType === 'single' || selectionType === 'multi') {
        // اختيار سن واحد أو أكثر
        teethDiv.innerHTML = `
            <div class="input-group">
                <label>🦷 اختيار ${selectionType === 'single' ? 'السن' : 'الأسنان'}</label>
                <div id="teethGrid" style="background:#f8fafc; border-radius:16px; padding:16px;"></div>
                <div id="selectedTeethDisplay" style="background:#e0f2fe; padding:10px; border-radius:12px; margin-top:10px; font-size:13px;">
                    <strong>${selectionType === 'single' ? 'السن المحدد:' : 'الأسنان المحددة:'}</strong> 
                    <span id="selectedTeethListSpan">لا توجد أسنان محددة</span>
                </div>
            </div>
        `;
        drawTeethGrid(selectionType === 'multi');
        teethDiv.style.display = 'block';
    }
    else if (selectionType === 'bridge') {
        // للجسر - اختيار أكثر من سن
        teethDiv.innerHTML = `
            <div class="input-group">
                <label>🦷 الأسنان الداعمة للجسر</label>
                <div id="bridgeTeethGrid" style="background:#f8fafc; border-radius:16px; padding:16px;"></div>
                <div id="selectedBridgeDisplay" style="background:#dbeafe; padding:10px; border-radius:12px; margin-top:10px; font-size:13px;">
                    <strong>الأسنان المحددة للجسر:</strong> 
                    <span id="selectedBridgeListSpan">لا توجد أسنان محددة</span>
                </div>
            </div>
        `;
        drawBridgeTeethGrid();
        teethDiv.style.display = 'block';
    }
    else {
        teethDiv.innerHTML = '';
        teethDiv.style.display = 'none';
    }
}

// رسم شبكة الأسنان
function drawTeethGrid(multiSelect = true) {
    let container = document.getElementById('teethGrid');
    if (!container) return;
    
    let html = '';
    
    // الفك العلوي
    html += '<div style="font-weight:bold; margin:10px 0 5px; color:#1e40af;">🦷 الفك العلوي</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px;">';
    for (let i = 11; i <= 18; i++) {
        let isSelected = selectedTeethList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="tooth-select-btn ${isSelected}" data-tooth="${i}" onclick="toggleToothSelection(${i}, ${multiSelect})" style="width:50px; height:50px; background:${isSelected ? '#10b981' : 'white'}; border:2px solid ${isSelected ? '#10b981' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    for (let i = 21; i <= 28; i++) {
        let isSelected = selectedTeethList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="tooth-select-btn ${isSelected}" data-tooth="${i}" onclick="toggleToothSelection(${i}, ${multiSelect})" style="width:50px; height:50px; background:${isSelected ? '#10b981' : 'white'}; border:2px solid ${isSelected ? '#10b981' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    html += '</div>';
    
    // الفك السفلي
    html += '<div style="font-weight:bold; margin:10px 0 5px; color:#1e40af;">🦷 الفك السفلي</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:6px;">';
    for (let i = 31; i <= 38; i++) {
        let isSelected = selectedTeethList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="tooth-select-btn ${isSelected}" data-tooth="${i}" onclick="toggleToothSelection(${i}, ${multiSelect})" style="width:50px; height:50px; background:${isSelected ? '#10b981' : 'white'}; border:2px solid ${isSelected ? '#10b981' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    for (let i = 41; i <= 48; i++) {
        let isSelected = selectedTeethList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="tooth-select-btn ${isSelected}" data-tooth="${i}" onclick="toggleToothSelection(${i}, ${multiSelect})" style="width:50px; height:50px; background:${isSelected ? '#10b981' : 'white'}; border:2px solid ${isSelected ? '#10b981' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    html += '</div>';
    
    container.innerHTML = html;
}

// تبديل اختيار السن
function toggleToothSelection(toothNumber, multiSelect) {
    let index = selectedTeethList.indexOf(toothNumber);
    
    if (multiSelect) {
        if (index === -1) {
            selectedTeethList.push(toothNumber);
        } else {
            selectedTeethList.splice(index, 1);
        }
    } else {
        // اختيار واحد فقط
        selectedTeethList = [toothNumber];
    }
    
    updateTeethDisplay();
    drawTeethGrid(multiSelect);
}

// تحديث عرض الأسنان المحددة
function updateTeethDisplay() {
    let span = document.getElementById('selectedTeethListSpan');
    if (span) {
        if (selectedTeethList.length === 0) {
            span.textContent = 'لا توجد أسنان محددة';
        } else {
            span.textContent = selectedTeethList.join('، ');
        }
    }
}

// رسم شبكة أسنان الجسر
function drawBridgeTeethGrid() {
    let container = document.getElementById('bridgeTeethGrid');
    if (!container) return;
    
    let html = '';
    
    // الفك العلوي
    html += '<div style="font-weight:bold; margin:10px 0 5px; color:#1e40af;">🦷 الفك العلوي</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px;">';
    for (let i = 11; i <= 18; i++) {
        let isSelected = selectedBridgeList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="bridge-tooth-btn ${isSelected}" data-tooth="${i}" onclick="toggleBridgeSelection(${i})" style="width:50px; height:50px; background:${isSelected ? '#3b82f6' : 'white'}; border:2px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    for (let i = 21; i <= 28; i++) {
        let isSelected = selectedBridgeList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="bridge-tooth-btn ${isSelected}" data-tooth="${i}" onclick="toggleBridgeSelection(${i})" style="width:50px; height:50px; background:${isSelected ? '#3b82f6' : 'white'}; border:2px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    html += '</div>';
    
    // الفك السفلي
    html += '<div style="font-weight:bold; margin:10px 0 5px; color:#1e40af;">🦷 الفك السفلي</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:6px;">';
    for (let i = 31; i <= 38; i++) {
        let isSelected = selectedBridgeList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="bridge-tooth-btn ${isSelected}" data-tooth="${i}" onclick="toggleBridgeSelection(${i})" style="width:50px; height:50px; background:${isSelected ? '#3b82f6' : 'white'}; border:2px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    for (let i = 41; i <= 48; i++) {
        let isSelected = selectedBridgeList.includes(i) ? 'selected' : '';
        html += `<button type="button" class="bridge-tooth-btn ${isSelected}" data-tooth="${i}" onclick="toggleBridgeSelection(${i})" style="width:50px; height:50px; background:${isSelected ? '#3b82f6' : 'white'}; border:2px solid ${isSelected ? '#3b82f6' : '#cbd5e1'}; border-radius:12px; cursor:pointer; font-weight:bold;">${i}</button>`;
    }
    html += '</div>';
    
    container.innerHTML = html;
}

// تبديل اختيار أسنان الجسر
function toggleBridgeSelection(toothNumber) {
    let index = selectedBridgeList.indexOf(toothNumber);
    if (index === -1) {
        selectedBridgeList.push(toothNumber);
    } else {
        selectedBridgeList.splice(index, 1);
    }
    updateBridgeDisplay();
    drawBridgeTeethGrid();
}

// تحديث عرض أسنان الجسر المحددة
function updateBridgeDisplay() {
    let span = document.getElementById('selectedBridgeListSpan');
    if (span) {
        if (selectedBridgeList.length === 0) {
            span.textContent = 'لا توجد أسنان محددة';
        } else {
            span.textContent = selectedBridgeList.join('، ');
        }
    }
}

// ============================================
// دالة استعادة ودمج جميع المعالجات من جميع المصادر
// ============================================
async function restoreAndMergeAllTreatments() {
    if (!currentUser) {
        console.log('⚠️ لا يوجد مستخدم مسجل');
        return;
    }
    
    console.log('🔄 بدء استعادة ودمج جميع المعالجات...');
    
    // 1. جلب المعالجات من localStorage الحالية
    let localTreatments = [];
    try {
        localTreatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
        console.log('📦 المعالجات من localStorage:', localTreatments.length);
    } catch(e) { console.log('خطأ في قراءة localStorage:', e); }
    
    // 2. جلب المعالجات من السيرفر
    let serverTreatments = [];
    if (navigator.onLine) {
        try {
            const response = await fetch('/api/treatments/user/' + currentUser.id);
            if (response.ok) {
                serverTreatments = await response.json();
                console.log('🌐 المعالجات من السيرفر:', serverTreatments.length);
            }
        } catch(e) { console.log('خطأ في جلب المعالجات من السيرفر:', e); }
    }
    
    // 3. دمج جميع المعالجات في Map واحد (تجنب التكرار)
    let allTreatmentsMap = new Map();
    
    // إضافة معالجات localStorage
    for (let t of localTreatments) {
        // التأكد من وجود الحقول الأساسية
        if (!t.payments) t.payments = [];
        if (!t.followUps) t.followUps = [];
        if (t.offline === undefined) t.offline = false;
        if (t.pendingSync === undefined) t.pendingSync = false;
        allTreatmentsMap.set(t._id, t);
    }
    
    // إضافة معالجات السيرفر (إذا لم تكن موجودة مسبقاً)
    for (let t of serverTreatments) {
        if (!allTreatmentsMap.has(t._id)) {
            // تحويل معالجة السيرفر إلى الصيغة المتوافقة
            t.payments = t.payments || [];
            t.followUps = t.followUps || [];
            t.offline = false;
            t.pendingSync = false;
            allTreatmentsMap.set(t._id, t);
        }
    }
    
    // 4. تحويل الخريطة إلى مصفوفة وحفظها
    let mergedTreatments = Array.from(allTreatmentsMap.values());
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(mergedTreatments));
    
    console.log('✅ تم دمج وحفظ', mergedTreatments.length, 'معالجة في localStorage');
    
    // 5. تحديث واجهة المريض الحالية إذا كانت مفتوحة
    if (currentPatientId) {
        await showPatientFullDetails(currentPatientId);
    }
    
    // 6. تحديث قائمة المرضى
    await loadPatients();
    
    return mergedTreatments.length;
}

async function forceRestoreAllTreatments() {
    if (!currentUser) {
        console.log('⚠️ لا يوجد مستخدم');
        return;
    }
    
    console.log('🔄 بدء الاستعادة القسرية...');
    
    // 1. جلب المعالجات من السيرفر فقط (نتجاهل المحلية حالياً)
    let allTreatments = [];
    
    if (navigator.onLine) {
        try {
            const response = await fetch('/api/treatments/user/' + currentUser.id);
            if (response.ok) {
                allTreatments = await response.json();
                console.log('✅ تم جلب', allTreatments.length, 'معالجة من السيرفر');
            } else {
                console.log('❌ فشل جلب المعالجات من السيرفر');
            }
        } catch(e) {
            console.log('❌ خطأ في الاتصال:', e);
        }
    }
    
    // 2. إذا لم تكن هناك معالجات من السيرفر، حاول من localStorage القديم
    if (allTreatments.length === 0) {
        try {
            // محاولة قراءة من مفتاح قديم محتمل
            const oldKey = 'offline_treatments';
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                allTreatments = JSON.parse(oldData);
                console.log('✅ تم العثور على معالجات قديمة:', allTreatments.length);
            }
        } catch(e) {}
    }
    
    // 3. حفظ المعالجات في المفتاح الصحيح مع التأكد من الحقول المطلوبة
    const treatmentsToSave = allTreatments.map(t => ({
        ...t,
        payments: t.payments || [],
        followUps: t.followUps || [],
        offline: false,
        pendingSync: false
    }));
    
    localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatmentsToSave));
    console.log('✅ تم حفظ', treatmentsToSave.length, 'معالجة في localStorage');
    
    // 4. تحديث عرض المريض الحالي
    if (currentPatientId) {
        await showPatientFullDetails(currentPatientId);
    }
    
    // 5. إعادة تحميل قائمة المرضى
    await loadPatients();
    
    return treatmentsToSave.length;
}
function fixPatientIdsInTreatments() {
    let treatments = JSON.parse(localStorage.getItem('offline_treatments_' + currentUser.id) || '[]');
    let updated = false;
    
    for (let t of treatments) {
        // البحث عن المريض بالاسم
        const patient = allPatients.find(p => p.name === t.patientName);
        if (patient && t.patientId !== patient._id) {
            console.log(`🔧 تحديث patientId من ${t.patientId} إلى ${patient._id} للمعالجة: ${t.treatmentType}`);
            t.patientId = patient._id;
            updated = true;
        }
    }
    
    if (updated) {
        localStorage.setItem('offline_treatments_' + currentUser.id, JSON.stringify(treatments));
        console.log('✅ تم تحديث patientId في المعالجات');
        location.reload(); // إعادة تحميل الصفحة
    } else {
        console.log('✅ لا حاجة للتحديث، جميع patientIds صحيحة');
    }
}

