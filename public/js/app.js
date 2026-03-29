
window.onerror = function(message, source, lineno, colno, error) {
    alert(`Error: ${message}\nSource: ${source}\nLine: ${lineno}:${colno}`);
};

// ============ PWA: يعمل فقط على Android ============
(function() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
        console.log('🍎 iOS detected - PWA disabled');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => reg.unregister());
            });
            navigator.serviceWorker.register = () => Promise.reject('SW disabled on iOS');
        }
        const manifest = document.querySelector('link[rel="manifest"]');
        if (manifest) manifest.remove();
    } 
    else if (isAndroid) {
        console.log('🤖 Android detected - PWA enabled');
        if (!document.querySelector('link[rel="manifest"]')) {
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = '/manifest.json';
            document.head.appendChild(link);
        }
        
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(() => {
                const installBtn = document.createElement('div');
                installBtn.id = 'androidInstallBtn';
                installBtn.innerHTML = '<button style="position:fixed;bottom:20px;left:20px;background:#10b981;color:white;border:none;padding:12px 20px;border-radius:50px;z-index:10000;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2)"><i class="fas fa-download"></i> تثبيت التطبيق</button>';
                installBtn.onclick = async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                        installBtn.remove();
                    }
                };
                document.body.appendChild(installBtn);
                setTimeout(() => installBtn.remove(), 30000);
            }, 2000);
        });
    }
})();

// ============ OFFLINE SYSTEM ============
function savePatientOffline(patientData) {
    let offlinePatients = JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]');
    const newPatient = { ...patientData, _id: 'offline_' + Date.now(), createdAt: new Date().toISOString(), offline: true, pendingSync: true };
    offlinePatients.push(newPatient);
    localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(offlinePatients));
    return newPatient;
}

function getOfflinePatients() { return !currentUser ? [] : JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]'); }

function saveTreatmentOffline(treatmentData) {
    let offlineTreatments = JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]');
    offlineTreatments.push({ ...treatmentData, _id: 'offline_tx_' + Date.now(), offline: true, pendingSync: true });
    localStorage.setItem(`offline_treatments_${currentUser.id}`, JSON.stringify(offlineTreatments));
}

function getOfflineTreatmentsForPatient(patientId) {
    if (!currentUser) return [];
    return JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]').filter(t => t.patientId === patientId);
}

function saveOfflineAuth(user, password) { localStorage.setItem('offlineAuth', JSON.stringify({ userId: user.id, username: user.username, password: password, userData: user, savedAt: new Date().toISOString() })); }
function getOfflineAuth() { const data = localStorage.getItem('offlineAuth'); return data ? JSON.parse(data) : null; }
function saveCompleteOfflineData(user, patients, treatments) { localStorage.setItem(`offline_data_${user.id}`, JSON.stringify({ user, patients, treatments, savedAt: new Date().toISOString() })); }
function getCompleteOfflineData(userId) { const data = localStorage.getItem(`offline_data_${userId}`); return data ? JSON.parse(data) : null; }

function checkConnectionStatus() {
    if (!navigator.onLine) { document.body.classList.add('offline-mode'); showAlert('dashboardAlert', '📴 وضع عدم الاتصال - البيانات تحفظ محلياً', 'warning'); } 
    else { document.body.classList.remove('offline-mode'); }
}

// ============ صفحة الاشتراك ============
function showSubscriptionPage() { document.getElementById('dashboard').style.display = 'none'; document.getElementById('subscriptionPage').style.display = 'block'; document.getElementById('subUserName').textContent = currentUser.fullName || currentUser.username; }
function closeSubscriptionPage() { document.getElementById('subscriptionPage').style.display = 'none'; document.getElementById('dashboard').style.display = 'block'; }

function copyToClipboard(number, method) {
    navigator.clipboard.writeText(number).then(() => {
        const notification = document.getElementById('copyNotification');
        notification.textContent = `✅ تم نسخ رقم ${method} بنجاح: ${number}`;
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3000);
    });
}

function sendPaymentWhatsApp() {
    const message = `*طلب تفعيل اشتراك ClinicPro*\n\n👤 *اسم المستخدم:* ${currentUser.fullName || currentUser.username}\n👨‍⚕️ *اسم العيادة:* ${currentUser.clinicName || 'غير محدد'}\n📞 *رقم الهاتف:* ${currentUser.phone || 'غير مسجل'}\n💰 *المبلغ:* 3,000 ريال يمني\n🦷 *ClinicPro*\n\nتم إيداع المبلغ وسأرفق صورة الإيداع`;
    window.open(`https://wa.me/967773041464?text=${encodeURIComponent(message)}`, '_blank');
}

function sendPaymentTelegram() {
    const message = `طلب تفعيل اشتراك ClinicPro\n\nاسم المستخدم: ${currentUser.fullName || currentUser.username}\nاسم العيادة: ${currentUser.clinicName || 'غير محدد'}\nرقم الهاتف: ${currentUser.phone || 'غير مسجل'}\nالمبلغ: 3,000 ريال يمني\n\nتم إيداع المبلغ وسأرفق صورة الإيداع`;
    window.open(`https://t.me/moatazdent?text=${encodeURIComponent(message)}`, '_blank');
}

// ============ زر التواصل ============
function contactWhatsApp() { if (!currentUser) return; window.open(`https://wa.me/967773041464?text=${encodeURIComponent(`مرحباً، أنا ${currentUser.fullName || currentUser.username} من عيادة ${currentUser.clinicName || 'عيادة الأسنان'}`)}`, '_blank'); }
function contactTelegram() { window.open(`https://t.me/moatazdent`, '_blank'); }

// ============ نظام الاشتراك ============
function showSubscriptionAlert() {
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv && currentUser && currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        alertDiv.classList.add('show');
        localStorage.setItem('subscriptionAlertShown', 'true');
    }
}

function closeSubscriptionAlert() {
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) { alertDiv.classList.remove('show'); localStorage.setItem('subscriptionAlertClosed', Date.now().toString()); }
}

function sendSubscriptionRequest() {
    if (!currentUser) return;
    showSubscriptionPage();
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) alertDiv.classList.remove('show');
    localStorage.setItem('subscriptionRequested', Date.now().toString());
}

function checkPatientLimit() {
    if (!currentUser) return;
    const subBtn = document.getElementById('subscriptionBtn');
    if (currentUser.role === 'admin' || currentUser.isSubscribed) {
        const alertDiv = document.getElementById('subscriptionAlert');
        if (alertDiv) alertDiv.classList.remove('show');
        if (subBtn) subBtn.style.display = 'none';
        return;
    }
    if (subBtn) { subBtn.style.display = 'flex'; console.log('✅ زر الاشتراك ظاهر للمستخدم المجاني'); }
    const patientCount = allPatients.length;
    const remaining = Math.max(0, 5 - patientCount);
    const remainingSlots = document.getElementById('remainingSlots');
    if (remainingSlots) remainingSlots.textContent = remaining;
    if (patientCount >= 5) {
        const closedTime = localStorage.getItem('subscriptionAlertClosed');
        if (!closedTime || (Date.now() - parseInt(closedTime)) > 24 * 60 * 60 * 1000) showSubscriptionAlert();
        const addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) { addBtn.disabled = true; addBtn.style.opacity = '0.5'; addBtn.title = 'لقد وصلت للحد الأقصى. اشترك لإضافة المزيد'; }
    } else {
        const addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) { addBtn.disabled = false; addBtn.style.opacity = '1'; }
        if (patientCount >= 4) showAlert('dashboardAlert', `⚠️ تنبيه: لديك ${patientCount} من 5 مرضى مجانيين. يمكنك إضافة ${remaining} مريض آخر مجاناً.`, 'warning');
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

// ============ المتغيرات ============
let currentUser = null, allPatients = [], currentPatientId = null, allAdminUsers = [], allAdminPatients = [];

// ============ دوال مساعدة ============
function showAlert(id, msg, type) { const a = document.getElementById(id); if (a) { a.textContent = msg; a.className = `alert alert-${type}`; a.style.display = 'block'; setTimeout(() => a.style.display = 'none', 4000); } }
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }
function showLogin() { document.getElementById('loginPage').style.display = 'block'; document.getElementById('registerPage').style.display = 'none'; document.getElementById('dashboard').style.display = 'none'; document.getElementById('adminPage').style.display = 'none'; }
function showRegister() { document.getElementById('loginPage').style.display = 'none'; document.getElementById('registerPage').style.display = 'block'; document.getElementById('dashboard').style.display = 'none'; }
function logout() { localStorage.clear(); currentUser = null; showLogin(); }

// ============ استعادة البيانات عند تحميل الصفحة ============
async function loadAllOfflineData() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    const savedUser = localStorage.getItem(`offline_data_${userId}`);
    if (savedUser) { const data = JSON.parse(savedUser); currentUser = data.user; }
    const savedPatients = localStorage.getItem(`offline_patients_${userId}`);
    if (savedPatients) { allPatients = JSON.parse(savedPatients); renderPatients(allPatients); document.getElementById('totalPatients').textContent = allPatients.length; }
    const savedTreatments = localStorage.getItem(`offline_treatments_${userId}`);
    if (savedTreatments) console.log('📦 Treatments loaded from cache:', JSON.parse(savedTreatments).length);
}

function saveAllDataToLocal() {
    if (!currentUser) return;
    localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(allPatients));
    localStorage.setItem(`offline_data_${currentUser.id}`, JSON.stringify({ user: currentUser, patients: allPatients, savedAt: new Date().toISOString() }));
    console.log('💾 All data saved to localStorage');
}

// ============ رسم الأسنان ============
function drawTeeth() { const t = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]; const c = document.getElementById('teethContainer'); if (c) c.innerHTML = t.map(n => `<div class="tooth" onclick="selectTooth(${n})">${n}</div>`).join(''); }
function selectTooth(t) { document.getElementById('toothNumber').value = t; document.getElementById('treatmentTypeSelect').value = ''; document.getElementById('treatmentNotesInput').value = ''; document.getElementById('treatmentCostInput').value = '0'; document.getElementById('treatmentPaidInput').value = '0'; calcRemaining(); }
function calcRemaining() { const c = parseFloat(document.getElementById('treatmentCostInput').value) || 0, p = parseFloat(document.getElementById('treatmentPaidInput').value) || 0, r = c - p; const s = document.getElementById('remainingSpan'); s.textContent = r; s.style.color = r < 0 ? '#10b981' : r > 0 ? '#ef4444' : '#64748b'; }
function showTreatmentModal(pid) { currentPatientId = pid; drawTeeth(); document.getElementById('treatmentModal').style.display = 'flex'; }

// ============ حفظ المعالجة ============
async function saveTreatmentNow() {
    if (!currentPatientId) { showAlert('dashboardAlert', 'خطأ: لم يتم تحديد المريض', 'error'); return; }
    const tooth = document.getElementById('toothNumber').value;
    if (!tooth) { showAlert('dashboardAlert', 'اختر السن أولاً', 'error'); return; }
    const type = document.getElementById('treatmentTypeSelect').value;
    if (!type) { showAlert('dashboardAlert', 'اختر نوع المعالجة', 'error'); return; }
    const notes = document.getElementById('treatmentNotesInput').value;
    const cost = parseFloat(document.getElementById('treatmentCostInput').value) || 0;
    const paid = parseFloat(document.getElementById('treatmentPaidInput').value) || 0;
    const patient = allPatients.find(p => p._id === currentPatientId);
    const treatmentData = { patientId: currentPatientId, userId: currentUser.id, toothNumber: parseInt(tooth), treatmentType: type, cost, paid, notes: `التكلفة: ${cost} | المدفوع: ${paid} | المتبقي: ${cost-paid}\n${notes}`, treatmentDate: new Date().toISOString(), patientName: patient?.name || 'غير معروف', offline: true, pendingSync: true, _id: 'offline_tx_' + Date.now() };
    let offlineTx = JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]');
    offlineTx.push(treatmentData);
    localStorage.setItem(`offline_treatments_${currentUser.id}`, JSON.stringify(offlineTx));
    showAlert('dashboardAlert', `📴 تم حفظ معالجة السن ${tooth} محلياً - ستتم المزامنة لاحقاً`, 'warning');
    closeModal('treatmentModal');
    if (document.getElementById('patientDetailsModal').style.display === 'flex') await showPatientFullDetails(currentPatientId);
    if (navigator.onLine) setTimeout(async () => await syncAllOfflineData(), 500);
    saveAllDataToLocal();
}

async function saveAndShareNow() {
    await saveTreatmentNow();
    const patient = allPatients.find(p => p._id === currentPatientId);
    if (patient) {
        const tooth = document.getElementById('toothNumber').value;
        const type = document.getElementById('treatmentTypeSelect').value;
        const cost = document.getElementById('treatmentCostInput').value;
        const paid = document.getElementById('treatmentPaidInput').value;
        const notes = document.getElementById('treatmentNotesInput').value;
        let message = `*🦷 تقرير المعالجة*\n\n👤 المريض: ${patient.name}\n🦷 السن: ${tooth}\n💊 نوع المعالجة: ${type}\n💰 التكلفة: ${cost} ريال\n💵 المدفوع: ${paid} ريال\n⚠️ المتبقي: ${cost - paid} ريال\n${notes ? `📝 ملاحظات: ${notes}\n` : ''}\n🦷 ClinicPro`;
        window.open(`https://wa.me/${patient.phone || '967773041464'}?text=${encodeURIComponent(message)}`, '_blank');
    }
}

// ============ إدارة المرضى ============
async function loadPatients() {
    try {
        const r = await fetch(`/api/patients/${currentUser.id}`);
        if (r.ok) {
            const serverPatients = await r.json();
            const offlinePatients = JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]');
            const pendingOffline = offlinePatients.filter(p => p.pendingSync === true);
            allPatients = [...pendingOffline, ...serverPatients];
            const uniqueNames = new Set();
            allPatients = allPatients.filter(p => { if (uniqueNames.has(p.name)) return false; uniqueNames.add(p.name); return true; });
            renderPatients(allPatients);
            document.getElementById('totalPatients').textContent = allPatients.length;
            saveAllDataToLocal();
            checkPatientLimit();
        }
    } catch (e) {
        console.error('Error loading patients:', e);
        allPatients = JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]');
        renderPatients(allPatients);
    }
}

function renderPatients(pts) {
    const g = document.getElementById('patientsGrid');
    if (!g) return;
    if (!pts || !pts.length) { g.innerHTML = '<div style="text-align:center;padding:50px">لا يوجد مرضى. أضف مريضاً جديداً</div>'; return; }
    g.innerHTML = pts.map(p => { const isPending = p.pendingSync === true || p.offline === true; return `<div class="patient-card" onclick="showPatientFullDetails('${p._id}')"><div class="patient-header"><h3>${escapeHtml(p.name)} ${isPending ? '<span style="background:#f59e0b;font-size:10px;padding:2px 6px;border-radius:20px;margin-right:8px">📴 مؤقت - ينتظر المزامنة</span>' : ''}</h3><div class="patient-actions" onclick="event.stopPropagation()"><button onclick="editPatient('${p._id}')"><i class="fas fa-edit"></i></button><button onclick="showTreatmentModal('${p._id}')"><i class="fas fa-stethoscope"></i></button><button onclick="deletePatient('${p._id}')"><i class="fas fa-trash"></i></button></div></div><div class="patient-body"><p><i class="fas fa-phone"></i> ${escapeHtml(p.phone || 'غير محدد')}</p><p><i class="fas fa-calendar"></i> العمر: ${p.age} سنة</p>${isPending ? '<p style="color:#f59e0b;"><i class="fas fa-sync-alt"></i> في انتظار المزامنة مع الخادم</p>' : ''}</div></div>`; }).join('');
}

async function addPatient(data) {
    if (currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        showAlert('dashboardAlert', '⚠️ لقد وصلت للحد الأقصى (5 مرضى). يرجى الاشتراك لإضافة المزيد من المرضى.', 'error');
        showSubscriptionAlert();
        closeModal('patientModal');
        return;
    }
    if (allPatients.some(p => p.name === data.name)) { showAlert('dashboardAlert', '⚠️ هذا المريض موجود بالفعل', 'error'); closeModal('patientModal'); return; }
    const newPatient = { ...data, _id: 'offline_' + Date.now(), createdAt: new Date().toISOString(), offline: true, pendingSync: true };
    let offlinePatients = getOfflinePatients();
    offlinePatients.unshift(newPatient);
    localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(offlinePatients));
    allPatients = [newPatient, ...allPatients];
    renderPatients(allPatients);
    document.getElementById('totalPatients').textContent = allPatients.length;
    checkPatientLimit();
    closeModal('patientModal');
    if (navigator.onLine) {
        try {
            const r = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, userId: currentUser.id }) });
            if (r.ok) {
                const result = await r.json();
                let updated = getOfflinePatients();
                const idx = updated.findIndex(p => p._id === newPatient._id);
                if (idx !== -1) { updated[idx]._id = result.patient._id; updated[idx].offline = false; updated[idx].pendingSync = false; localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(updated)); }
                await loadPatients();
                showAlert('dashboardAlert', '✅ تم إضافة المريض ومزامنته', 'success');
            } else showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً - سيتم المزامنة لاحقاً', 'warning');
        } catch (e) { showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً', 'warning'); }
    } else showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً - سيتم المزامنة عند استعادة الاتصال', 'warning');
    saveAllDataToLocal();
}

async function updatePatient(id, data) { try { const r = await fetch(`/api/patients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { showAlert('dashboardAlert', 'تم التحديث', 'success'); closeModal('patientModal'); await loadPatients(); saveAllDataToLocal(); } } catch (e) { showAlert('dashboardAlert', 'خطأ', 'error'); } }
async function deletePatient(id) { if (confirm('هل أنت متأكد؟')) { await fetch(`/api/patients/${id}`, { method: 'DELETE' }); await loadPatients(); await loadStats(); saveAllDataToLocal(); } }
async function loadStats() { try { const r = await fetch(`/api/user/${currentUser.id}`); const d = await r.json(); document.getElementById('totalPatients').textContent = d.patientCount || 0; let r2 = (currentUser.role === 'admin' || currentUser.isSubscribed) ? 'غير محدود' : Math.max(0, 5 - (d.patientCount || 0)); document.getElementById('remainingSlots').textContent = r2; } catch (e) { } }
function searchPatients() { const q = document.getElementById('searchInput').value.toLowerCase(); renderPatients(q ? allPatients.filter(p => p.name.toLowerCase().includes(q)) : allPatients); }
function showAddPatientModal() { document.getElementById('modalTitle').textContent = 'إضافة مريض'; document.getElementById('patientForm').reset(); document.getElementById('patientId').value = ''; document.getElementById('patientModal').style.display = 'flex'; }
function editPatient(id) { const p = allPatients.find(p => p._id === id); if (p) { document.getElementById('modalTitle').textContent = 'تعديل مريض'; document.getElementById('patientId').value = p._id; document.getElementById('patientName').value = p.name; document.getElementById('patientPhone').value = p.phone || ''; document.getElementById('patientAge').value = p.age; document.getElementById('patientAddress').value = p.address || ''; document.getElementById('patientNotes').value = p.notes || ''; document.getElementById('patientModal').style.display = 'flex'; } }

async function showPatientFullDetails(pid) {
    try {
        const patient = allPatients.find(p => p._id === pid);
        if (!patient) { showAlert('dashboardAlert', 'المريض غير موجود', 'error'); return; }
        const isOfflinePatient = patient.pendingSync === true || patient.offline === true;
        const localTreatments = JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]');
        let treatments = localTreatments.filter(t => t.patientId === pid);
        let serverTreatments = [];
        if (navigator.onLine) { try { const r = await fetch(`/api/treatments/patient/${pid}`); if (r.ok) serverTreatments = await r.json(); } catch (e) { } }
        const allTreatmentsMap = new Map();
        treatments.forEach(t => allTreatmentsMap.set(t._id, t));
        serverTreatments.forEach(t => { if (!allTreatmentsMap.has(t._id)) allTreatmentsMap.set(t._id, t); });
        const allTreatments = Array.from(allTreatmentsMap.values()).sort((a, b) => new Date(b.treatmentDate) - new Date(a.treatmentDate));
        let totalCost = 0, totalPaid = 0, treatmentsHtml = '';
        allTreatments.forEach(t => {
            const cost = t.cost || 0;
            let paid = 0;
            if (t.notes && !t.paid) { const match = t.notes.match(/المدفوع:\s*([\d.]+)/); if (match) paid = parseFloat(match[1]); } else paid = t.paid || 0;
            totalCost += cost; totalPaid += paid;
            const isOffline = t.offline === true || t.pendingSync === true;
            treatmentsHtml += `<div style="padding:12px; border-bottom:1px solid #e2e8f0; ${isOffline ? 'background:#fef3c7;' : ''}"><strong>🦷 السن ${t.toothNumber}</strong> - ${t.treatmentType}${isOffline ? '<span style="background:#f59e0b; font-size:10px; padding:2px 6px; border-radius:20px; margin-right:8px;">📴 مؤقت</span>' : ''}<br>💰 ${cost} ريال | 💵 ${paid} ريال<br><small>📅 ${new Date(t.treatmentDate).toLocaleDateString('ar-EG')}</small></div>`;
        });
        const remaining = totalCost - totalPaid;
        const modalHtml = `<div class="modal-content" style="max-width:650px;"><div class="modal-header"><h3>${escapeHtml(patient.name)} ${isOfflinePatient ? '<span style="background:#f59e0b;font-size:12px;padding:2px 8px;border-radius:20px">📴 مؤقت</span>' : ''}</h3><button class="close-btn" onclick="closeModal('patientDetailsModal')">&times;</button></div><div class="modal-body"><div style="background:#f1f5f9; padding:15px; border-radius:15px; margin-bottom:20px;"><p><strong>📞 الهاتف:</strong> ${escapeHtml(patient.phone || 'غير محدد')}</p><p><strong>📅 العمر:</strong> ${patient.age} سنة</p><p><strong>📍 العنوان:</strong> ${escapeHtml(patient.address || 'غير محدد')}</p></div><div class="patient-images-section"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;"><h4>📸 صور المريض</h4><button class="btn" style="width:auto; padding:6px 12px; font-size:12px;" onclick="openAddImageModal('${patient._id}')"><i class="fas fa-plus"></i> إضافة صورة</button></div><div id="imagesContainer_${patient._id}"></div></div><h4>🦷 سجل المعالجات (${allTreatments.length})</h4><div style="max-height:300px; overflow-y:auto; margin-bottom:20px;">${treatmentsHtml || '<p style="text-align:center;padding:20px;">لا توجد معالجات مسجلة</p>'}</div><div style="background:#e0f2fe; padding:15px; border-radius:15px; margin-bottom:20px;"><p><strong>💰 إجمالي التكلفة:</strong> ${totalCost} ريال</p><p><strong>💵 إجمالي المدفوع:</strong> ${totalPaid} ريال</p><p><strong style="color:${remaining > 0 ? '#ef4444' : '#10b981'};">⚠️ المتبقي:</strong> ${remaining} ريال</p></div><div style="display:flex; gap:10px; flex-wrap:wrap;"><button class="btn" onclick="closeModal('patientDetailsModal'); editPatient('${patient._id}')" style="flex:1;">تعديل</button><button class="btn btn-secondary" onclick="closeModal('patientDetailsModal'); showTreatmentModal('${patient._id}')" style="flex:1;">إضافة معالجة</button><button class="btn btn-whatsapp" onclick="sharePatientWithImages('${patient._id}')" style="flex:1;">مشاركة مع الصور</button></div></div></div>`;
        let modal = document.getElementById('patientDetailsModal');
        if (!modal) { const d = document.createElement('div'); d.id = 'patientDetailsModal'; d.className = 'modal'; document.body.appendChild(d); modal = d; }
        modal.innerHTML = modalHtml;
        modal.style.display = 'flex';
        renderPatientImages(pid);
    } catch (error) { console.error('Error showing patient details:', error); showAlert('dashboardAlert', 'خطأ في جلب بيانات المريض', 'error'); }
}

// ============ صفحة الادمن ============
async function loadAdminUsers() { try { const r = await fetch('/api/admin/users'); allAdminUsers = await r.json(); renderAdminUsers(allAdminUsers); } catch (e) { } }
function renderAdminUsers(users) { const c = document.getElementById('adminUsersList'); if (!users || !users.length) { c.innerHTML = '<div style="padding:50px">لا يوجد مستخدمين</div>'; return; } c.innerHTML = users.map(u => `<div class="patient-card"><div class="patient-header"><h3>${escapeHtml(u.fullName)}</h3><div class="patient-actions"><button onclick="toggleUserSubscription('${u._id}',${!u.isSubscribed})" style="background:${u.isSubscribed ? '#ef4444' : '#10b981'}">${u.isSubscribed ? 'تعطيل' : 'تفعيل'}</button></div></div><div class="patient-body"><p>@${u.username}</p><p>${u.clinicName}</p><p>المرضى: ${u.patientCount || 0}</p><p>الحالة: ${u.isSubscribed ? '✅ مشترك' : '📊 مجاني'}</p></div></div>`).join(''); }
async function loadAllPatients() { try { const r = await fetch('/api/admin/patients'); allAdminPatients = await r.json(); renderAdminPatients(allAdminPatients); } catch (e) { } }
function renderAdminPatients(pts) { const c = document.getElementById('adminPatientsList'); if (!pts || !pts.length) { c.innerHTML = '<div style="padding:50px">لا يوجد مرضى</div>'; return; } c.innerHTML = pts.map(p => `<div class="patient-card" onclick="showAdminPatientDetails('${p._id}')"><div class="patient-header"><h3>${escapeHtml(p.name)}</h3></div><div class="patient-body"><p>📞 ${p.phone || 'غير محدد'}</p><p>📅 ${p.age} سنة</p><p>👨‍⚕️ ${p.doctorName || 'غير معروف'}</p></div></div>`).join(''); }
async function showAdminPatientDetails(pid) { try { const r = await fetch(`/api/patients/${pid}/details`); const d = await r.json(); alert(`المريض: ${d.patient.name}\nالهاتف: ${d.patient.phone}\nالعمر: ${d.patient.age}\nالمعالجات: ${d.treatments?.length || 0}`); } catch (e) { } }
async function toggleUserSubscription(uid, act) { await fetch(`/api/admin/users/${uid}/subscription`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isSubscribed: act }) }); await loadAdminUsers(); }
function searchAdminUsers() { const q = document.getElementById('adminUserSearch').value.toLowerCase(); renderAdminUsers(q ? allAdminUsers.filter(u => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) : allAdminUsers); }
function searchAdminPatients() { const q = document.getElementById('adminPatientSearch').value.toLowerCase(); renderAdminPatients(q ? allAdminPatients.filter(p => p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q))) : allAdminPatients); }
function refreshAdminUsers() { loadAdminUsers(); }
function refreshAdminPatients() { loadAllPatients(); }
function showAdminPage() { document.getElementById('dashboard').style.display = 'none'; document.getElementById('adminPage').style.display = 'block'; document.getElementById('adminUserName').textContent = currentUser.fullName; loadAdminUsers(); loadAllPatients(); showAdminTab('users'); }
function showDashboard() { document.getElementById('adminPage').style.display = 'none'; document.getElementById('dashboard').style.display = 'block'; }
function showAdminTab(tab) { const us = document.getElementById('adminUsersSection'), ps = document.getElementById('adminPatientsSection'), ub = document.getElementById('tabUsersBtn'), pb = document.getElementById('tabPatientsBtn'); if (tab === 'users') { us.style.display = 'block'; ps.style.display = 'none'; ub.style.background = '#3b82f6'; pb.style.background = '#64748b'; } else { us.style.display = 'none'; ps.style.display = 'block'; ub.style.background = '#64748b'; pb.style.background = '#3b82f6'; } }
function checkAndShowAdminButton() { if (currentUser?.role === 'admin') document.getElementById('adminBtn').style.display = 'block'; else document.getElementById('adminBtn').style.display = 'none'; }
async function syncAllDataWithServer() { if (!navigator.onLine || !currentUser) return false; showAlert('dashboardAlert', '🔄 جاري المزامنة...', 'success'); await loadPatients(); showAlert('dashboardAlert', '✅ تمت المزامنة', 'success'); return true; }

// ============ المصادقة ============
async function register() {
    const data = { fullName: document.getElementById('regFullName').value, username: document.getElementById('regUsername').value, password: document.getElementById('regPassword').value, phone: document.getElementById('regPhone').value, age: parseInt(document.getElementById('regAge').value), clinicName: document.getElementById('regClinicName').value, address: document.getElementById('regAddress').value };
    if (!data.fullName || !data.username || !data.password) { showAlert('registerAlert', 'املأ جميع الحقول', 'error'); return; }
    try {
        const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const res = await r.json();
        if (r.ok && res.success) { currentUser = res.user; localStorage.setItem('userId', currentUser.id); await loadDashboard(); showAlert('dashboardAlert', 'تم إنشاء الحساب', 'success'); }
        else showAlert('registerAlert', res.message || 'فشل', 'error');
    } catch (e) { showAlert('registerAlert', 'خطأ في الاتصال', 'error'); }
}

async function login() {
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    if (!u || !p) { showAlert('loginAlert', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error'); return; }
    if (navigator.onLine) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }), signal: controller.signal });
            clearTimeout(timeoutId);
            const res = await r.json();
            if (r.ok && res.success) {
                currentUser = res.user;
                try { localStorage.setItem('userId', currentUser.id); saveOfflineAuth(currentUser, p); } catch (storageError) { console.log('⚠️ Safari: تعذر حفظ البيانات في localStorage'); }
                try { const patientsRes = await fetch(`/api/patients/${currentUser.id}`); if (patientsRes.ok) { const patients = await patientsRes.json(); try { saveCompleteOfflineData(currentUser, patients, []); localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(patients)); } catch (e) { } } } catch (patientsError) { console.log('⚠️ Safari: تعذر جلب المرضى'); }
                await loadDashboard();
                showAlert('dashboardAlert', 'تم تسجيل الدخول', 'success');
            } else showAlert('loginAlert', res.message || 'فشل تسجيل الدخول', 'error');
        } catch (e) { console.log('خطأ في الاتصال:', e.message); await tryLocalLogin(u, p); }
    } else await tryLocalLogin(u, p);
}

async function tryLocalLogin(username, password) {
    try {
        const savedAuth = getOfflineAuth();
        if (savedAuth && savedAuth.username === username && savedAuth.password === password) {
            const offlineData = getCompleteOfflineData(savedAuth.userId);
            if (offlineData) {
                currentUser = offlineData.user;
                allPatients = offlineData.patients || [];
                try { localStorage.setItem('userId', currentUser.id); } catch (e) { }
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('registerPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('userNameDisplay').textContent = currentUser.fullName;
                renderPatients(allPatients);
                document.getElementById('totalPatients').textContent = allPatients.length;
                document.getElementById('remainingSlots').textContent = currentUser.role === 'admin' ? 'غير محدود' : Math.max(0, 5 - allPatients.length);
                const badge = document.getElementById('subscriptionBadge');
                if (currentUser.role === 'admin') { badge.innerHTML = '👑 مدير'; badge.className = 'subscription-badge subscription-active'; }
                else if (currentUser.isSubscribed) { badge.innerHTML = '✨ مشترك'; badge.className = 'subscription-badge subscription-active'; }
                else { badge.innerHTML = '📊 مجاني'; badge.className = 'subscription-badge subscription-inactive'; }
                if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
                showAlert('dashboardAlert', '📴 وضع عدم الاتصال - تعمل بنسخة محفوظة', 'warning');
                document.body.classList.add('offline-mode');
                return true;
            }
        }
        showAlert('loginAlert', 'لا توجد بيانات محفوظة أو فشل الاتصال بالخادم', 'error');
        return false;
    } catch (e) { console.log('خطأ في تسجيل الدخول المحلي:', e); showAlert('loginAlert', 'حدث خطأ في تسجيل الدخول', 'error'); return false; }
}

async function loadDashboard() {
    let uid = null;
    try { uid = localStorage.getItem('userId'); } catch (e) { console.log('⚠️ Safari: لا يمكن قراءة localStorage'); if (window.tempUser) { uid = window.tempUser.id; currentUser = window.tempUser; allPatients = window.tempPatients || []; } }
    if (!uid && !currentUser) { showLogin(); return; }
    if (currentUser && !uid) uid = currentUser.id;
    let savedData = null;
    try { const dataStr = localStorage.getItem(`offline_data_${uid}`); if (dataStr) savedData = JSON.parse(dataStr); } catch (e) { console.log('⚠️ Safari: خطأ في قراءة البيانات المخزنة'); }
    if (savedData) {
        currentUser = savedData.user;
        allPatients = savedData.patients || [];
        renderPatients(allPatients);
        document.getElementById('totalPatients').textContent = allPatients.length;
        document.getElementById('remainingSlots').textContent = currentUser.role === 'admin' ? 'غير محدود' : Math.max(0, 5 - allPatients.length);
        document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
        const badge = document.getElementById('subscriptionBadge');
        if (currentUser.role === 'admin') { badge.innerHTML = '👑 مدير'; badge.className = 'subscription-badge subscription-active'; }
        else if (currentUser.isSubscribed) { badge.innerHTML = '✨ مشترك'; badge.className = 'subscription-badge subscription-active'; }
        else { badge.innerHTML = '📊 مجاني'; badge.className = 'subscription-badge subscription-inactive'; }
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
        const subBtn = document.getElementById('subscriptionBtn');
        if (subBtn) { if (currentUser.role === 'admin' || currentUser.isSubscribed) subBtn.style.display = 'none'; else subBtn.style.display = 'flex'; }
        if (navigator.onLine) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const r = await fetch(`/api/user/${uid}`, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (r.ok) {
                    const userData = await r.json();
                    currentUser = userData.user;
                    try { localStorage.setItem(`offline_data_${uid}`, JSON.stringify({ user: currentUser, patients: allPatients, savedAt: new Date().toISOString() })); } catch (e) { console.log('⚠️ Safari: لا يمكن حفظ البيانات'); }
                    document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
                    if (currentUser.role === 'admin') { document.getElementById('subscriptionBadge').innerHTML = '👑 مدير'; document.getElementById('subscriptionBadge').className = 'subscription-badge subscription-active'; }
                    else if (currentUser.isSubscribed) { document.getElementById('subscriptionBadge').innerHTML = '✨ مشترك'; document.getElementById('subscriptionBadge').className = 'subscription-badge subscription-active'; }
                    else { document.getElementById('subscriptionBadge').innerHTML = '📊 مجاني'; document.getElementById('subscriptionBadge').className = 'subscription-badge subscription-inactive'; }
                    if (subBtn) { if (currentUser.role === 'admin' || currentUser.isSubscribed) subBtn.style.display = 'none'; else subBtn.style.display = 'flex'; }
                }
                const patientsController = new AbortController();
                const patientsTimeout = setTimeout(() => patientsController.abort(), 8000);
                const patientsRes = await fetch(`/api/patients/${uid}`, { signal: patientsController.signal });
                clearTimeout(patientsTimeout);
                if (patientsRes.ok) {
                    const serverPatients = await patientsRes.json();
                    let offlinePatients = [];
                    try { offlinePatients = JSON.parse(localStorage.getItem(`offline_patients_${uid}`) || '[]'); } catch (e) { }
                    const pendingOffline = offlinePatients.filter(p => p.pendingSync === true);
                    allPatients = [...pendingOffline, ...serverPatients];
                    renderPatients(allPatients);
                    document.getElementById('totalPatients').textContent = allPatients.length;
                    saveAllDataToLocal();
                }
                if (typeof syncPatientImagesToServer === 'function') await syncPatientImagesToServer();
            } catch (e) { console.log('⚠️ Safari: فشل الاتصال بالسيرفر - استخدام البيانات المخزنة'); }
        }
        checkConnectionStatus();
        checkPatientLimit();
        return;
    }
    if (navigator.onLine) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const r = await fetch(`/api/user/${uid}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (r.ok) {
                const userData = await r.json();
                currentUser = userData.user;
                try { localStorage.setItem(`offline_data_${uid}`, JSON.stringify({ user: currentUser, patients: [], savedAt: new Date().toISOString() })); } catch (e) { }
                const patientsRes = await fetch(`/api/patients/${uid}`);
                if (patientsRes.ok) { allPatients = await patientsRes.json(); renderPatients(allPatients); saveAllDataToLocal(); }
            } else { showLogin(); return; }
        } catch (e) { console.log('⚠️ Safari: فشل الاتصال بالسيرفر'); showLogin(); return; }
    } else { showLogin(); return; }
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
    const badge = document.getElementById('subscriptionBadge');
    if (currentUser.role === 'admin') { badge.innerHTML = '👑 مدير'; badge.className = 'subscription-badge subscription-active'; }
    else if (currentUser.isSubscribed) { badge.innerHTML = '✨ مشترك'; badge.className = 'subscription-badge subscription-active'; }
    else { badge.innerHTML = '📊 مجاني'; badge.className = 'subscription-badge subscription-inactive'; }
    if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
    const subBtn = document.getElementById('subscriptionBtn');
    if (subBtn) { if (currentUser.role === 'admin' || currentUser.isSubscribed) subBtn.style.display = 'none'; else subBtn.style.display = 'flex'; }
    await loadStats();
    checkConnectionStatus();
    checkPatientLimit();
    if (navigator.onLine && typeof syncPatientImagesToServer === 'function') await syncPatientImagesToServer();
}

async function syncAllOfflineData() {
    if (!navigator.onLine || !currentUser) { console.log('📴 Cannot sync: offline or no user'); return false; }
    console.log('🔄 بدء المزامنة مع السيرفر...');
    showAlert('dashboardAlert', '🔄 جاري مزامنة البيانات مع الخادم...', 'success');
    let syncedPatients = 0, failedPatients = [], syncedTreatments = 0;
    const offlinePatients = JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]');
    const pendingPatients = offlinePatients.filter(p => p.pendingSync === true);
    console.log(`📋 Found ${pendingPatients.length} pending patients to sync`);
    for (const p of pendingPatients) {
        try {
            const r = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name, phone: p.phone, age: p.age, address: p.address, notes: p.notes, userId: currentUser.id }) });
            if (r.ok) {
                const result = await r.json();
                console.log(`✅ Synced patient: ${p.name} -> ID: ${result.patient._id}`);
                const idx = allPatients.findIndex(ap => ap._id === p._id);
                if (idx !== -1) { allPatients[idx]._id = result.patient._id; allPatients[idx].pendingSync = false; allPatients[idx].offline = false; }
                syncedPatients++;
            } else { console.error(`❌ Failed to sync patient: ${p.name}`); failedPatients.push(p); }
        } catch (e) { console.error(`❌ Error syncing patient ${p.name}:`, e); failedPatients.push(p); }
    }
    if (syncedPatients > 0) {
        const remainingPatients = offlinePatients.filter(p => p.pendingSync === true && failedPatients.includes(p));
        const syncedSuccessfully = offlinePatients.filter(p => !remainingPatients.includes(p) && p.pendingSync === true).map(p => { const updated = allPatients.find(ap => ap.name === p.name && !ap.pendingSync); return updated || p; });
        const finalPatients = [...remainingPatients, ...syncedSuccessfully];
        localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(finalPatients));
        console.log(`🗑️ Removed ${syncedPatients} synced patients from local storage`);
    }
    const offlineTreatments = JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]');
    const pendingTreatments = offlineTreatments.filter(t => t.pendingSync === true);
    for (const t of pendingTreatments) {
        try {
            let patientId = t.patientId;
            if (patientId.startsWith('offline_')) {
                const matchedPatient = allPatients.find(p => p._id === patientId || p.name === t.patientName || (p.phone && p.phone === t.patientPhone));
                if (matchedPatient && !matchedPatient._id.startsWith('offline_')) patientId = matchedPatient._id;
                else { console.warn(`⚠️ Cannot find patient for treatment, keeping in queue`); continue; }
            }
            const r = await fetch('/api/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, userId: currentUser.id, toothNumber: t.toothNumber, treatmentType: t.treatmentType, cost: t.cost, notes: t.notes, treatmentDate: t.treatmentDate }) });
            if (r.ok) syncedTreatments++;
            else console.error(`❌ Failed to sync treatment:`, await r.text());
        } catch (e) { console.error(`❌ Error syncing treatment:`, e); }
    }
    if (syncedTreatments > 0) {
        const remainingTreatments = offlineTreatments.filter(t => !pendingTreatments.includes(t) || t.pendingSync === true);
        localStorage.setItem(`offline_treatments_${currentUser.id}`, JSON.stringify(remainingTreatments));
    }
    if (syncedPatients > 0 || syncedTreatments > 0) {
        await loadPatients();
        renderPatients(allPatients);
        saveAllDataToLocal();
        if (failedPatients.length > 0) showAlert('dashboardAlert', `⚠️ تمت المزامنة جزئياً: ${syncedPatients} مريض ناجح، ${failedPatients.length} في انتظار إعادة المحاولة`, 'warning');
        else showAlert('dashboardAlert', `✅ تمت المزامنة: ${syncedPatients} مريض، ${syncedTreatments} معالجة`, 'success');
    } else showAlert('dashboardAlert', '✅ لا توجد بيانات جديدة للمزامنة', 'success');
    document.body.classList.remove('offline-mode');
    return syncedPatients > 0 || syncedTreatments > 0;
}

// ============ أحداث ============
document.getElementById('loginForm').addEventListener('submit', e => { e.preventDefault(); login(); });
document.getElementById('registerForm').addEventListener('submit', e => { e.preventDefault(); register(); });
document.getElementById('patientForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = { name: document.getElementById('patientName').value, phone: document.getElementById('patientPhone').value, age: parseInt(document.getElementById('patientAge').value), address: document.getElementById('patientAddress').value, notes: document.getElementById('patientNotes').value };
    if (document.getElementById('patientId').value) updatePatient(document.getElementById('patientId').value, data);
    else addPatient(data);
});
if (localStorage.getItem('userId')) loadDashboard(); else showLogin();

window.onload = () => { if (localStorage.getItem('userId')) loadDashboard(); else showLogin(); checkConnectionStatus(); };

// ============ المزامنة التلقائية مع السيرفر ============
async function syncAllDataWithServer() {
    if (!navigator.onLine || !currentUser) { console.log('📴 Cannot sync: offline or no user'); showAlert('dashboardAlert', 'لا يوجد اتصال بالإنترنت. سيتم المزامنة عند استعادة الاتصال.', 'warning'); return false; }
    console.log('🔄 بدء المزامنة مع السيرفر...');
    showAlert('dashboardAlert', '🔄 جاري مزامنة البيانات مع الخادم...', 'success');
    let syncedPatients = 0, failedPatients = [], syncedTreatments = 0, syncedImages = 0;
    await syncPatientImagesToServer();
    const offlinePatients = JSON.parse(localStorage.getItem(`offline_patients_${currentUser.id}`) || '[]');
    const pendingPatients = offlinePatients.filter(p => p.pendingSync === true);
    console.log(`📋 Found ${pendingPatients.length} pending patients to sync`);
    for (const p of pendingPatients) {
        try {
            const r = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name, phone: p.phone, age: p.age, address: p.address, notes: p.notes, userId: currentUser.id }) });
            if (r.ok) {
                const result = await r.json();
                console.log(`✅ Synced patient: ${p.name} -> ID: ${result.patient._id}`);
                const idx = allPatients.findIndex(ap => ap._id === p._id);
                if (idx !== -1) { allPatients[idx]._id = result.patient._id; allPatients[idx].pendingSync = false; allPatients[idx].offline = false; }
                syncedPatients++;
            } else { console.error(`❌ Failed to sync patient: ${p.name}`); failedPatients.push(p); }
        } catch (e) { console.error(`❌ Error syncing patient ${p.name}:`, e); failedPatients.push(p); }
    }
    if (syncedPatients > 0) {
        const remainingPatients = offlinePatients.filter(p => !p.pendingSync || failedPatients.includes(p));
        localStorage.setItem(`offline_patients_${currentUser.id}`, JSON.stringify(remainingPatients));
        console.log(`🗑️ Removed ${syncedPatients} synced patients from local storage`);
    }
    const offlineTreatments = JSON.parse(localStorage.getItem(`offline_treatments_${currentUser.id}`) || '[]');
    const pendingTreatments = offlineTreatments.filter(t => t.pendingSync === true);
    for (const t of pendingTreatments) {
        try {
            let patientId = t.patientId;
            if (patientId.startsWith('offline_')) {
                const matchedPatient = allPatients.find(p => p._id === patientId || p.name === t.patientName || (p.phone && p.phone === t.patientPhone));
                if (matchedPatient && !matchedPatient._id.startsWith('offline_')) patientId = matchedPatient._id;
                else { console.warn(`⚠️ Cannot find patient for treatment, keeping in queue`); continue; }
            }
            const r = await fetch('/api/treatments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, userId: currentUser.id, toothNumber: t.toothNumber, treatmentType: t.treatmentType, cost: t.cost, notes: t.notes, treatmentDate: t.treatmentDate }) });
            if (r.ok) syncedTreatments++;
            else console.error(`❌ Failed to sync treatment:`, await r.text());
        } catch (e) { console.error(`❌ Error syncing treatment:`, e); }
    }
    if (syncedTreatments > 0) {
        const remainingTreatments = offlineTreatments.filter(t => !t.pendingSync);
        localStorage.setItem(`offline_treatments_${currentUser.id}`, JSON.stringify(remainingTreatments));
    }
    await syncPatientImagesToServer();
    if (syncedPatients > 0 || syncedTreatments > 0 || syncedImages > 0) {
        await loadPatients();
        renderPatients(allPatients);
        saveAllDataToLocal();
        let message = `✅ تمت المزامنة: ${syncedPatients} مريض, ${syncedTreatments} معالجة`;
        if (syncedImages > 0) message += `, ${syncedImages} صورة`;
        if (failedPatients.length > 0) showAlert('dashboardAlert', `⚠️ تمت المزامنة جزئياً: ${message}`, 'warning');
        else showAlert('dashboardAlert', message, 'success');
    } else showAlert('dashboardAlert', '✅ لا توجد بيانات جديدة للمزامنة', 'success');
    document.body.classList.remove('offline-mode');
    return syncedPatients > 0 || syncedTreatments > 0 || syncedImages > 0;
}

// ============ المزامنة التلقائية عند استعادة الاتصال ============
window.addEventListener('online', async () => {
    console.log('🔄 استعادة الاتصال بالإنترنت - بدء المزامنة التلقائية');
    showAlert('dashboardAlert', '🔄 تم استعادة الاتصال. جاري المزامنة التلقائية...', 'success');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await syncAllDataWithServer();
    const offlineDiv = document.getElementById('offlineNotification');
    if (offlineDiv) offlineDiv.remove();
});
window.addEventListener('offline', () => { console.log('📴 فقدان الاتصال بالإنترنت'); document.body.classList.add('offline-mode'); showAlert('dashboardAlert', '📴 فقدان الاتصال. سيتم حفظ البيانات محلياً والمزامنة تلقائياً عند عودة الإنترنت.', 'warning'); });
checkConnectionStatus();

// ============ إدارة صور المرضى ============
function savePatientImageLocally(patientId, imageData, caption) {
    let patientImages = JSON.parse(localStorage.getItem(`patient_images_${currentUser.id}`) || '{}');
    if (!patientImages[patientId]) patientImages[patientId] = [];
    const newImage = { id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), data: imageData, caption: caption || '', createdAt: new Date().toISOString(), pendingSync: true };
    patientImages[patientId].push(newImage);
    localStorage.setItem(`patient_images_${currentUser.id}`, JSON.stringify(patientImages));
    return newImage;
}
function getPatientImages(patientId) { const allImages = JSON.parse(localStorage.getItem(`patient_images_${currentUser.id}`) || '{}'); return allImages[patientId] || []; }
function deletePatientImage(patientId, imageId) { let patientImages = JSON.parse(localStorage.getItem(`patient_images_${currentUser.id}`) || '{}'); if (patientImages[patientId]) { patientImages[patientId] = patientImages[patientId].filter(img => img.id !== imageId); localStorage.setItem(`patient_images_${currentUser.id}`, JSON.stringify(patientImages)); } return patientImages[patientId] || []; }
function renderPatientImages(patientId) {
    const images = getPatientImages(patientId);
    const container = document.getElementById(`imagesContainer_${patientId}`);
    if (!container) return;
    if (images.length === 0) { container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">📷 لا توجد صور لهذا المريض</div>'; return; }
    container.innerHTML = `<div class="images-grid">${images.map(img => `<div class="image-card" onclick="viewFullImage('${img.data}')"><img src="${img.data}" alt="${escapeHtml(img.caption) || 'صورة المريض'}"><div class="image-actions" onclick="event.stopPropagation()"><button class="image-delete" onclick="deleteImageConfirm('${patientId}', '${img.id}')"><i class="fas fa-trash"></i></button></div>${img.caption ? `<div class="image-badge">${escapeHtml(img.caption)}</div>` : ''}${img.pendingSync ? '<div class="image-badge" style="background:#f59e0b;">📴</div>' : ''}</div>`).join('')}</div>`;
}
function viewFullImage(imageData) { const viewer = document.createElement('div'); viewer.className = 'image-viewer'; viewer.onclick = () => viewer.remove(); viewer.innerHTML = `<button class="image-viewer-close" onclick="this.parentElement.remove()">&times;</button><img src="${imageData}" alt="صورة مكبرة">`; document.body.appendChild(viewer); }
function deleteImageConfirm(patientId, imageId) { if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) { deletePatientImage(patientId, imageId); renderPatientImages(patientId); showAlert('dashboardAlert', '✅ تم حذف الصورة', 'success'); } }
let currentImagePatientId = null;
function openAddImageModal(patientId) { currentImagePatientId = patientId; document.getElementById('imageFileInput').value = ''; document.getElementById('imageCaption').value = ''; document.getElementById('imagePreview').style.display = 'none'; document.getElementById('addImageModal').style.display = 'flex'; }
document.addEventListener('DOMContentLoaded', () => { const fileInput = document.getElementById('imageFileInput'); if (fileInput) { fileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { const preview = document.getElementById('previewImg'); preview.src = e.target.result; document.getElementById('imagePreview').style.display = 'block'; }; reader.readAsDataURL(file); } }); } });
async function savePatientImage() {
    const fileInput = document.getElementById('imageFileInput');
    const caption = document.getElementById('imageCaption').value;
    if (!fileInput.files || !fileInput.files[0]) { showAlert('dashboardAlert', 'الرجاء اختيار صورة', 'error'); return; }
    const file = fileInput.files[0];
    showAlert('dashboardAlert', '🔄 جاري معالجة الصورة...', 'success');
    try {
        const compressedImageData = await compressImage(file, 1);
        savePatientImageLocally(currentImagePatientId, compressedImageData, caption);
        renderPatientImages(currentImagePatientId);
        closeModal('addImageModal');
        showAlert('dashboardAlert', '✅ تم حفظ الصورة بنجاح', 'success');
        if (navigator.onLine) { await syncPatientImagesToServer(); renderPatientImages(currentImagePatientId); showAlert('dashboardAlert', '✅ تمت مزامنة الصورة مع الخادم', 'success'); }
        else showAlert('dashboardAlert', '📴 تم حفظ الصورة محلياً - ستتم المزامنة عند استعادة الاتصال', 'warning');
    } catch (error) { console.error('Error:', error); showAlert('dashboardAlert', '❌ فشل في معالجة الصورة', 'error'); }
}
async function syncPatientImagesToServer() {
    if (!navigator.onLine || !currentUser) return;
    const allImages = JSON.parse(localStorage.getItem(`patient_images_${currentUser.id}`) || '{}');
    let synced = 0;
    for (const patientId in allImages) {
        const pendingImages = allImages[patientId].filter(img => img.pendingSync === true);
        for (const img of pendingImages) {
            try {
                const response = await fetch('/api/patient-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId, userId: currentUser.id, imageData: img.data, caption: img.caption, imageId: img.id }) });
                if (response.ok) { img.pendingSync = false; synced++; }
            } catch (e) { console.error('Error syncing image:', e); }
        }
    }
    if (synced > 0) { localStorage.setItem(`patient_images_${currentUser.id}`, JSON.stringify(allImages)); showAlert('dashboardAlert', `✅ تمت مزامنة ${synced} صورة مع الخادم`, 'success'); }
}
async function sharePatientWithImages(patientId) {
    const patient = allPatients.find(p => p._id === patientId);
    if (!patient) return;
    const images = getPatientImages(patientId);
    let message = `*🦷 بيانات المريض - ${patient.name}*\n━━━━━━━━━━━━━━━━━━━━\n\n👤 الاسم: ${patient.name}\n📞 الهاتف: ${patient.phone || 'غير مسجل'}\n📅 العمر: ${patient.age} سنة\n📍 العنوان: ${patient.address || 'غير مسجل'}\n📝 ملاحظات: ${patient.notes || 'لا توجد'}\n\n📸 عدد الصور: ${images.length} صورة\n\n🦷 *ClinicPro - نظام إدارة عيادات الأسنان*${images.length > 0 ? `\n\n*ملاحظة:* تم إرفاق ${images.length} صورة مع هذا التقرير` : ''}`;
    window.open(`https://wa.me/${patient.phone || '967773041464'}?text=${encodeURIComponent(message)}`, '_blank');
    if (images.length > 0 && images[0].data) setTimeout(() => showAlert('dashboardAlert', '📸 يمكنك مشاركة الصور بشكل منفصل عبر واتساب', 'info'), 1000);
}

// ============ ضغط الصور ============
async function compressImage(file, maxSizeMB = 1, quality = 0.7) {
    return new Promise((resolve, reject) => {
        if (file.size <= maxSizeMB * 1024 * 1024) { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.onerror = reject; reader.readAsDataURL(file); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width, height = img.height;
                const maxDimension = 1920;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) { height = (height * maxDimension) / width; width = maxDimension; }
                    else { width = (width * maxDimension) / height; height = maxDimension; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
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

// زر تثبيت التطبيق
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('✅ يمكن تثبيت التطبيق');
    setTimeout(() => {
        if (document.getElementById('installButton')) return;
        const installBtn = document.createElement('div');
        installBtn.id = 'installButton';
        installBtn.innerHTML = `<button style="position: fixed; bottom: 20px; left: 20px; background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 50px; z-index: 10000; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px;"><i class="fas fa-download"></i>تثبيت التطبيق</button>`;
        installBtn.querySelector('button').onclick = async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; deferredPrompt = null; installBtn.remove(); } };
        document.body.appendChild(installBtn);
        setTimeout(() => { if (installBtn) installBtn.remove(); }, 30000);
    }, 2000);
});
window.addEventListener('appinstalled', (evt) => { console.log('✅ App installed successfully!'); const installBtn = document.getElementById('installButton'); if (installBtn) installBtn.remove(); });
function checkOnlineStatus() { if (navigator.onLine) { console.log('✅ Online'); document.body.classList.remove('offline-mode'); } else { console.log('📴 Offline'); document.body.classList.add('offline-mode'); showOfflineNotification(); } }
function showOfflineNotification() {
    const oldOffline = document.getElementById('offlineNotification');
    if (oldOffline) oldOffline.remove();
    const offlineDiv = document.createElement('div');
    offlineDiv.id = 'offlineNotification';
    offlineDiv.innerHTML = `<div style="position: fixed; top: 70px; left: 20px; right: 20px; background: #ef4444; color: white; padding: 10px; border-radius: 12px; text-align: center; z-index: 10000; display: flex; align-items: center; justify-content: center; gap: 10px;"><i class="fas fa-wifi-slash"></i><span>لا يوجد اتصال بالإنترنت. سيتم حفظ البيانات محلياً والمزامنة تلقائياً عند استعادة الاتصال.</span><button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 20px; cursor: pointer;">إغلاق</button></div>`;
    document.body.appendChild(offlineDiv);
    setTimeout(() => { if (offlineDiv) offlineDiv.remove(); }, 8000);
}
async function clearOldCaches() { if ('caches' in window) { try { const cacheKeys = await caches.keys(); const currentVersion = Date.now(); for (const key of cacheKeys) { if (key.includes('clinicpro') && !key.includes(currentVersion.toString())) { console.log('🗑️ Deleting old cache:', key); await caches.delete(key); } } } catch (error) { console.log('Error clearing caches:', error); } } }
window.addEventListener('online', () => { console.log('🔄 Connection restored'); const offlineDiv = document.getElementById('offlineNotification'); if (offlineDiv) offlineDiv.remove(); if (typeof syncAllDataWithServer === 'function') syncAllDataWithServer(); if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(registrations => { registrations.forEach(registration => { registration.update(); }); }); } });
window.addEventListener('offline', () => { console.log('📴 Connection lost'); showOfflineNotification(); });
clearOldCaches();
checkOnlineStatus();
document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) { console.log('🔄 Page visible, checking for updates...'); if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(registrations => { registrations.forEach(registration => { registration.update(); }); }); } if (typeof syncAllDataWithServer === 'function') syncAllDataWithServer(); } });
