// ============ إصلاح Safari ============
(function() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS || isSafari) {
        console.log('🍎 Safari/iOS detected - PWA disabled');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(reg => reg.unregister());
            });
            navigator.serviceWorker.register = () => Promise.reject('SW disabled');
        }
        const manifest = document.querySelector('link[rel="manifest"]');
        if (manifest) manifest.remove();
        window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());
    }
    
    window.safeStorage = {
        set: function(key, value) {
            try { localStorage.setItem(key, value); return true; }
            catch(e) { 
                if (!window._memoryStorage) window._memoryStorage = {};
                window._memoryStorage[key] = value;
                return false;
            }
        },
        get: function(key) {
            try { return localStorage.getItem(key); }
            catch(e) { return window._memoryStorage ? window._memoryStorage[key] : null; }
        },
        remove: function(key) {
            try { localStorage.removeItem(key); }
            catch(e) { if (window._memoryStorage) delete window._memoryStorage[key]; }
        }
    };
})();

// ============ المتغيرات ============
let currentUser = null, allPatients = [], currentPatientId = null, allAdminUsers = [], allAdminPatients = [];

// ============ دوال مساعدة ============
function showAlert(id, msg, type) { 
    const a = document.getElementById(id); 
    if (a) { 
        a.textContent = msg; 
        a.className = `alert alert-${type}`; 
        a.style.display = 'block'; 
        setTimeout(() => a.style.display = 'none', 4000); 
    } 
}
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }
function showLogin() { 
    document.getElementById('loginPage').style.display = 'block'; 
    document.getElementById('registerPage').style.display = 'none'; 
    document.getElementById('dashboard').style.display = 'none'; 
    document.getElementById('adminPage').style.display = 'none'; 
}
function showRegister() { 
    document.getElementById('loginPage').style.display = 'none'; 
    document.getElementById('registerPage').style.display = 'block'; 
    document.getElementById('dashboard').style.display = 'none'; 
}
function logout() { 
    window.safeStorage.remove('userId'); 
    currentUser = null; 
    showLogin(); 
}
function checkConnectionStatus() {
    if (!navigator.onLine) { document.body.classList.add('offline-mode'); showAlert('dashboardAlert', '📴 وضع عدم الاتصال', 'warning'); } 
    else { document.body.classList.remove('offline-mode'); }
}

// ============ OFFLINE SYSTEM ============
function savePatientOffline(patientData) {
    let offlinePatients = JSON.parse(window.safeStorage.get(`offline_patients_${currentUser.id}`) || '[]');
    const newPatient = { ...patientData, _id: 'offline_' + Date.now(), createdAt: new Date().toISOString(), offline: true, pendingSync: true };
    offlinePatients.push(newPatient);
    window.safeStorage.set(`offline_patients_${currentUser.id}`, JSON.stringify(offlinePatients));
    return newPatient;
}
function getOfflinePatients() { return !currentUser ? [] : JSON.parse(window.safeStorage.get(`offline_patients_${currentUser.id}`) || '[]'); }
function saveTreatmentOffline(treatmentData) {
    let offlineTreatments = JSON.parse(window.safeStorage.get(`offline_treatments_${currentUser.id}`) || '[]');
    offlineTreatments.push({ ...treatmentData, _id: 'offline_tx_' + Date.now(), offline: true, pendingSync: true });
    window.safeStorage.set(`offline_treatments_${currentUser.id}`, JSON.stringify(offlineTreatments));
}
function getOfflineTreatmentsForPatient(patientId) {
    if (!currentUser) return [];
    return JSON.parse(window.safeStorage.get(`offline_treatments_${currentUser.id}`) || '[]').filter(t => t.patientId === patientId);
}
function saveOfflineAuth(user, password) { window.safeStorage.set('offlineAuth', JSON.stringify({ userId: user.id, username: user.username, password: password, userData: user, savedAt: new Date().toISOString() })); }
function getOfflineAuth() { const data = window.safeStorage.get('offlineAuth'); return data ? JSON.parse(data) : null; }
function saveCompleteOfflineData(user, patients, treatments) { window.safeStorage.set(`offline_data_${user.id}`, JSON.stringify({ user, patients, treatments, savedAt: new Date().toISOString() })); }
function getCompleteOfflineData(userId) { const data = window.safeStorage.get(`offline_data_${userId}`); return data ? JSON.parse(data) : null; }
function saveAllDataToLocal() {
    if (!currentUser) return;
    window.safeStorage.set(`offline_patients_${currentUser.id}`, JSON.stringify(allPatients));
    window.safeStorage.set(`offline_data_${currentUser.id}`, JSON.stringify({ user: currentUser, patients: allPatients, savedAt: new Date().toISOString() }));
    console.log('💾 All data saved');
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
function contactWhatsApp() { if (!currentUser) return; window.open(`https://wa.me/967773041464?text=${encodeURIComponent(`مرحباً، أنا ${currentUser.fullName || currentUser.username} من عيادة ${currentUser.clinicName || 'عيادة الأسنان'}`)}`, '_blank'); }
function contactTelegram() { window.open(`https://t.me/moatazdent`, '_blank'); }

// ============ نظام الاشتراك ============
function showSubscriptionAlert() {
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv && currentUser && currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        alertDiv.classList.add('show');
        window.safeStorage.set('subscriptionAlertShown', 'true');
    }
}
function closeSubscriptionAlert() {
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) { alertDiv.classList.remove('show'); window.safeStorage.set('subscriptionAlertClosed', Date.now().toString()); }
}
function sendSubscriptionRequest() {
    if (!currentUser) return;
    showSubscriptionPage();
    const alertDiv = document.getElementById('subscriptionAlert');
    if (alertDiv) alertDiv.classList.remove('show');
    window.safeStorage.set('subscriptionRequested', Date.now().toString());
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
    if (subBtn) subBtn.style.display = 'flex';
    const patientCount = allPatients.length;
    const remaining = Math.max(0, 5 - patientCount);
    const remainingSlots = document.getElementById('remainingSlots');
    if (remainingSlots) remainingSlots.textContent = remaining;
    if (patientCount >= 5) {
        const closedTime = window.safeStorage.get('subscriptionAlertClosed');
        if (!closedTime || (Date.now() - parseInt(closedTime)) > 24 * 60 * 60 * 1000) showSubscriptionAlert();
        const addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) { addBtn.disabled = true; addBtn.style.opacity = '0.5'; }
    } else {
        const addBtn = document.querySelector('.search-bar button:first-child');
        if (addBtn) { addBtn.disabled = false; addBtn.style.opacity = '1'; }
        if (patientCount >= 4) showAlert('dashboardAlert', `⚠️ تنبيه: لديك ${patientCount} من 5 مرضى`, 'warning');
    }
}

// ============ رسم الأسنان ============
function drawTeeth() { const t = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]; const c = document.getElementById('teethContainer'); if (c) c.innerHTML = t.map(n => `<div class="tooth" onclick="selectTooth(${n})">${n}</div>`).join(''); }
function selectTooth(t) { document.getElementById('toothNumber').value = t; document.getElementById('treatmentTypeSelect').value = ''; document.getElementById('treatmentNotesInput').value = ''; document.getElementById('treatmentCostInput').value = '0'; document.getElementById('treatmentPaidInput').value = '0'; calcRemaining(); }
function calcRemaining() { const c = parseFloat(document.getElementById('treatmentCostInput').value) || 0, p = parseFloat(document.getElementById('treatmentPaidInput').value) || 0, r = c - p; const s = document.getElementById('remainingSpan'); if(s) { s.textContent = r; s.style.color = r < 0 ? '#10b981' : r > 0 ? '#ef4444' : '#64748b'; } }
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
    let offlineTx = JSON.parse(window.safeStorage.get(`offline_treatments_${currentUser.id}`) || '[]');
    offlineTx.push(treatmentData);
    window.safeStorage.set(`offline_treatments_${currentUser.id}`, JSON.stringify(offlineTx));
    showAlert('dashboardAlert', `📴 تم حفظ معالجة السن ${tooth} محلياً`, 'warning');
    closeModal('treatmentModal');
    if (document.getElementById('patientDetailsModal').style.display === 'flex') await showPatientFullDetails(currentPatientId);
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
    if(!currentUser) return;
    try {
        const r = await fetch(`/api/patients/${currentUser.id}`);
        if (r.ok) {
            const serverPatients = await r.json();
            const offlinePatients = getOfflinePatients();
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
        allPatients = getOfflinePatients();
        renderPatients(allPatients);
    }
}
function renderPatients(pts) {
    const g = document.getElementById('patientsGrid');
    if (!g) return;
    if (!pts || !pts.length) { g.innerHTML = '<div style="text-align:center;padding:50px">لا يوجد مرضى. أضف مريضاً جديداً</div>'; return; }
    g.innerHTML = pts.map(p => { const isPending = p.pendingSync === true || p.offline === true; return `<div class="patient-card" onclick="showPatientFullDetails('${p._id}')"><div class="patient-header"><h3>${escapeHtml(p.name)} ${isPending ? '<span style="background:#f59e0b;font-size:10px;padding:2px 6px;border-radius:20px">📴</span>' : ''}</h3><div class="patient-actions" onclick="event.stopPropagation()"><button onclick="editPatient('${p._id}')"><i class="fas fa-edit"></i></button><button onclick="showTreatmentModal('${p._id}')"><i class="fas fa-stethoscope"></i></button><button onclick="deletePatient('${p._id}')"><i class="fas fa-trash"></i></button></div></div><div class="patient-body"><p><i class="fas fa-phone"></i> ${escapeHtml(p.phone || 'غير محدد')}</p><p><i class="fas fa-calendar"></i> العمر: ${p.age} سنة</p></div></div>`; }).join('');
}
async function addPatient(data) {
    if (currentUser.role !== 'admin' && !currentUser.isSubscribed && allPatients.length >= 5) {
        showAlert('dashboardAlert', '⚠️ لقد وصلت للحد الأقصى (5 مرضى)', 'error');
        showSubscriptionAlert();
        closeModal('patientModal');
        return;
    }
    if (allPatients.some(p => p.name === data.name)) { showAlert('dashboardAlert', '⚠️ هذا المريض موجود بالفعل', 'error'); closeModal('patientModal'); return; }
    const newPatient = { ...data, _id: 'offline_' + Date.now(), createdAt: new Date().toISOString(), offline: true, pendingSync: true };
    let offlinePatients = getOfflinePatients();
    offlinePatients.unshift(newPatient);
    window.safeStorage.set(`offline_patients_${currentUser.id}`, JSON.stringify(offlinePatients));
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
                if (idx !== -1) { updated[idx]._id = result.patient._id; updated[idx].offline = false; updated[idx].pendingSync = false; window.safeStorage.set(`offline_patients_${currentUser.id}`, JSON.stringify(updated)); }
                await loadPatients();
                showAlert('dashboardAlert', '✅ تم إضافة المريض ومزامنته', 'success');
            } else showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً', 'warning');
        } catch (e) { showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً', 'warning'); }
    } else showAlert('dashboardAlert', '📴 تم حفظ المريض محلياً', 'warning');
    saveAllDataToLocal();
}
async function updatePatient(id, data) { try { const r = await fetch(`/api/patients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (r.ok) { showAlert('dashboardAlert', 'تم التحديث', 'success'); closeModal('patientModal'); await loadPatients(); saveAllDataToLocal(); } } catch (e) { showAlert('dashboardAlert', 'خطأ', 'error'); } }
async function deletePatient(id) { if (confirm('هل أنت متأكد؟')) { await fetch(`/api/patients/${id}`, { method: 'DELETE' }); await loadPatients(); saveAllDataToLocal(); } }
async function loadStats() { try { const r = await fetch(`/api/user/${currentUser.id}`); const d = await r.json(); document.getElementById('totalPatients').textContent = d.patientCount || 0; let r2 = (currentUser.role === 'admin' || currentUser.isSubscribed) ? 'غير محدود' : Math.max(0, 5 - (d.patientCount || 0)); document.getElementById('remainingSlots').textContent = r2; } catch (e) { } }
function searchPatients() { const q = document.getElementById('searchInput').value.toLowerCase(); renderPatients(q ? allPatients.filter(p => p.name.toLowerCase().includes(q)) : allPatients); }
function showAddPatientModal() { document.getElementById('modalTitle').textContent = 'إضافة مريض'; document.getElementById('patientForm').reset(); document.getElementById('patientId').value = ''; document.getElementById('patientModal').style.display = 'flex'; }
function editPatient(id) { const p = allPatients.find(p => p._id === id); if (p) { document.getElementById('modalTitle').textContent = 'تعديل مريض'; document.getElementById('patientId').value = p._id; document.getElementById('patientName').value = p.name; document.getElementById('patientPhone').value = p.phone || ''; document.getElementById('patientAge').value = p.age; document.getElementById('patientAddress').value = p.address || ''; document.getElementById('patientNotes').value = p.notes || ''; document.getElementById('patientModal').style.display = 'flex'; } }
async function showPatientFullDetails(pid) {
    const patient = allPatients.find(p => p._id === pid);
    if (!patient) { showAlert('dashboardAlert', 'المريض غير موجود', 'error'); return; }
    const localTreatments = JSON.parse(window.safeStorage.get(`offline_treatments_${currentUser.id}`) || '[]');
    let treatments = localTreatments.filter(t => t.patientId === pid);
    let totalCost = 0, totalPaid = 0;
    treatments.forEach(t => { totalCost += t.cost || 0; totalPaid += t.paid || 0; });
    const remaining = totalCost - totalPaid;
    alert(`المريض: ${patient.name}\n📞 ${patient.phone}\n📅 ${patient.age} سنة\n💰 إجمالي التكلفة: ${totalCost}\n💵 المدفوع: ${totalPaid}\n⚠️ المتبقي: ${remaining}`);
}

// ============ صفحة الادمن ============
async function loadAdminUsers() { try { const r = await fetch('/api/admin/users'); allAdminUsers = await r.json(); renderAdminUsers(allAdminUsers); } catch (e) { } }
function renderAdminUsers(users) { const c = document.getElementById('adminUsersList'); if (!users || !users.length) { c.innerHTML = '<div style="padding:50px">لا يوجد مستخدمين</div>'; return; } c.innerHTML = users.map(u => `<div class="patient-card"><div class="patient-header"><h3>${escapeHtml(u.fullName)}</h3><div class="patient-actions"><button onclick="toggleUserSubscription('${u._id}',${!u.isSubscribed})">${u.isSubscribed ? 'تعطيل' : 'تفعيل'}</button></div></div><div class="patient-body"><p>@${u.username}</p><p>${u.clinicName}</p><p>المرضى: ${u.patientCount || 0}</p><p>الحالة: ${u.isSubscribed ? '✅ مشترك' : '📊 مجاني'}</p></div></div>`).join(''); }
async function loadAllPatients() { try { const r = await fetch('/api/admin/patients'); allAdminPatients = await r.json(); renderAdminPatients(allAdminPatients); } catch (e) { } }
function renderAdminPatients(pts) { const c = document.getElementById('adminPatientsList'); if (!pts || !pts.length) { c.innerHTML = '<div style="padding:50px">لا يوجد مرضى</div>'; return; } c.innerHTML = pts.map(p => `<div class="patient-card"><div class="patient-header"><h3>${escapeHtml(p.name)}</h3></div><div class="patient-body"><p>📞 ${p.phone || 'غير محدد'}</p><p>📅 ${p.age} سنة</p><p>👨‍⚕️ ${p.doctorName || 'غير معروف'}</p></div></div>`).join(''); }
async function toggleUserSubscription(uid, act) { await fetch(`/api/admin/users/${uid}/subscription`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isSubscribed: act }) }); await loadAdminUsers(); }
function searchAdminUsers() { const q = document.getElementById('adminUserSearch').value.toLowerCase(); renderAdminUsers(q ? allAdminUsers.filter(u => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) : allAdminUsers); }
function searchAdminPatients() { const q = document.getElementById('adminPatientSearch').value.toLowerCase(); renderAdminPatients(q ? allAdminPatients.filter(p => p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q))) : allAdminPatients); }
function showAdminPage() { document.getElementById('dashboard').style.display = 'none'; document.getElementById('adminPage').style.display = 'block'; document.getElementById('adminUserName').textContent = currentUser.fullName; loadAdminUsers(); loadAllPatients(); showAdminTab('users'); }
function showDashboard() { document.getElementById('adminPage').style.display = 'none'; document.getElementById('dashboard').style.display = 'block'; }
function showAdminTab(tab) { const us = document.getElementById('adminUsersSection'), ps = document.getElementById('adminPatientsSection'), ub = document.getElementById('tabUsersBtn'), pb = document.getElementById('tabPatientsBtn'); if (tab === 'users') { us.style.display = 'block'; ps.style.display = 'none'; if(ub) ub.style.background = '#3b82f6'; if(pb) pb.style.background = '#64748b'; } else { us.style.display = 'none'; ps.style.display = 'block'; if(ub) ub.style.background = '#64748b'; if(pb) pb.style.background = '#3b82f6'; } }

// ============ المصادقة ============
async function tryLocalLogin(username, password) {
    try {
        const savedAuth = getOfflineAuth();
        if (savedAuth && savedAuth.username === username && savedAuth.password === password) {
            const offlineData = getCompleteOfflineData(savedAuth.userId);
            if (offlineData) {
                currentUser = offlineData.user;
                allPatients = offlineData.patients || [];
                window.safeStorage.set('userId', currentUser.id);
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('userNameDisplay').textContent = currentUser.fullName;
                renderPatients(allPatients);
                document.getElementById('totalPatients').textContent = allPatients.length;
                const badge = document.getElementById('subscriptionBadge');
                if (currentUser.role === 'admin') badge.innerHTML = '👑 مدير';
                else if (currentUser.isSubscribed) badge.innerHTML = '✨ مشترك';
                else badge.innerHTML = '📊 مجاني';
                if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
                showAlert('dashboardAlert', '📴 وضع عدم الاتصال', 'warning');
                document.body.classList.add('offline-mode');
                return true;
            }
        }
        return false;
    } catch (e) { console.log('Local login error:', e); return false; }
}
async function login() {
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    if (!u || !p) { showAlert('loginAlert', 'يرجى إدخال اسم المستخدم وكلمة المرور', 'error'); return; }
    if (navigator.onLine) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }), signal: controller.signal });
            clearTimeout(timeoutId);
            const res = await r.json();
            if (r.ok && res.success) {
                currentUser = res.user;
                window.safeStorage.set('userId', currentUser.id);
                saveOfflineAuth(currentUser, p);
                try { const patientsRes = await fetch(`/api/patients/${currentUser.id}`); if (patientsRes.ok) { const patients = await patientsRes.json(); saveCompleteOfflineData(currentUser, patients, []); } } catch (e) { }
                await loadDashboard();
                showAlert('dashboardAlert', 'تم تسجيل الدخول', 'success');
            } else showAlert('loginAlert', res.message || 'فشل تسجيل الدخول', 'error');
        } catch (e) { console.log('Login error:', e); await tryLocalLogin(u, p); }
    } else await tryLocalLogin(u, p);
}
async function register() {
    const data = { fullName: document.getElementById('regFullName').value, username: document.getElementById('regUsername').value, password: document.getElementById('regPassword').value, phone: document.getElementById('regPhone').value, age: parseInt(document.getElementById('regAge').value), clinicName: document.getElementById('regClinicName').value, address: document.getElementById('regAddress').value };
    if (!data.fullName || !data.username || !data.password) { showAlert('registerAlert', 'املأ جميع الحقول', 'error'); return; }
    try {
        const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const res = await r.json();
        if (r.ok && res.success) { currentUser = res.user; window.safeStorage.set('userId', currentUser.id); await loadDashboard(); showAlert('dashboardAlert', 'تم إنشاء الحساب', 'success'); }
        else showAlert('registerAlert', res.message || 'فشل', 'error');
    } catch (e) { showAlert('registerAlert', 'خطأ في الاتصال', 'error'); }
}
async function loadDashboard() {
    let uid = window.safeStorage.get('userId');
    if (!uid && !currentUser) { showLogin(); return; }
    if (currentUser && !uid) uid = currentUser.id;
    let savedData = getCompleteOfflineData(uid);
    if (savedData) {
        currentUser = savedData.user;
        allPatients = savedData.patients || [];
        renderPatients(allPatients);
        document.getElementById('totalPatients').textContent = allPatients.length;
        document.getElementById('userNameDisplay').textContent = currentUser.fullName || currentUser.username;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        const badge = document.getElementById('subscriptionBadge');
        if (currentUser.role === 'admin') { badge.innerHTML = '👑 مدير'; }
        else if (currentUser.isSubscribed) { badge.innerHTML = '✨ مشترك'; }
        else { badge.innerHTML = '📊 مجاني'; }
        if (currentUser.role === 'admin') document.getElementById('adminBtn').style.display = 'block';
        if (navigator.onLine) {
            try {
                const r = await fetch(`/api/user/${uid}`);
                if (r.ok) {
                    const userData = await r.json();
                    currentUser = userData.user;
                    saveCompleteOfflineData(currentUser, allPatients, []);
                }
                await loadPatients();
            } catch (e) { console.log('Update error:', e); }
        }
        checkConnectionStatus();
        checkPatientLimit();
        return;
    }
    if (navigator.onLine) {
        try {
            const r = await fetch(`/api/user/${uid}`);
            if (r.ok) {
                const userData = await r.json();
                currentUser = userData.user;
                const patientsRes = await fetch(`/api/patients/${uid}`);
                if (patientsRes.ok) { allPatients = await patientsRes.json(); renderPatients(allPatients); saveCompleteOfflineData(currentUser, allPatients, []); }
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('userNameDisplay').textContent = currentUser.fullName;
            } else { showLogin(); return; }
        } catch (e) { showLogin(); return; }
    } else { showLogin(); return; }
    checkConnectionStatus();
    checkPatientLimit();
}

// ============ صور المرضى ============
function savePatientImageLocally(patientId, imageData, caption) {
    let patientImages = JSON.parse(window.safeStorage.get(`patient_images_${currentUser.id}`) || '{}');
    if (!patientImages[patientId]) patientImages[patientId] = [];
    const newImage = { id: 'img_' + Date.now(), data: imageData, caption: caption || '', createdAt: new Date().toISOString(), pendingSync: true };
    patientImages[patientId].push(newImage);
    window.safeStorage.set(`patient_images_${currentUser.id}`, JSON.stringify(patientImages));
    return newImage;
}
function getPatientImages(patientId) { const allImages = JSON.parse(window.safeStorage.get(`patient_images_${currentUser.id}`) || '{}'); return allImages[patientId] || []; }
function renderPatientImages(patientId) {
    const images = getPatientImages(patientId);
    const container = document.getElementById(`imagesContainer_${patientId}`);
    if (!container) return;
    if (images.length === 0) { container.innerHTML = '<div style="text-align:center;padding:20px;">📷 لا توجد صور</div>'; return; }
    container.innerHTML = `<div class="images-grid">${images.map(img => `<div class="image-card"><img src="${img.data}" style="width:100px;height:100px;object-fit:cover;"><button onclick="deleteImageConfirm('${patientId}','${img.id}')">🗑️</button></div>`).join('')}</div>`;
}
function openAddImageModal(patientId) { currentImagePatientId = patientId; document.getElementById('addImageModal').style.display = 'flex'; }
let currentImagePatientId = null;
async function savePatientImage() {
    const fileInput = document.getElementById('imageFileInput');
    const caption = document.getElementById('imageCaption').value;
    if (!fileInput.files || !fileInput.files[0]) { showAlert('dashboardAlert', 'اختر صورة', 'error'); return; }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        savePatientImageLocally(currentImagePatientId, e.target.result, caption);
        renderPatientImages(currentImagePatientId);
        closeModal('addImageModal');
        showAlert('dashboardAlert', '✅ تم حفظ الصورة', 'success');
    };
    reader.readAsDataURL(file);
}
function deleteImageConfirm(patientId, imageId) { deletePatientImage(patientId, imageId); renderPatientImages(patientId); }
function deletePatientImage(patientId, imageId) {
    let patientImages = JSON.parse(window.safeStorage.get(`patient_images_${currentUser.id}`) || '{}');
    if (patientImages[patientId]) { patientImages[patientId] = patientImages[patientId].filter(img => img.id !== imageId); window.safeStorage.set(`patient_images_${currentUser.id}`, JSON.stringify(patientImages)); }
}
async function sharePatientWithImages(patientId) {
    const patient = allPatients.find(p => p._id === patientId);
    if (!patient) return;
    let message = `*🦷 بيانات المريض - ${patient.name}*\n👤 الاسم: ${patient.name}\n📞 الهاتف: ${patient.phone || 'غير مسجل'}\n📅 العمر: ${patient.age} سنة\n🦷 ClinicPro`;
    window.open(`https://wa.me/${patient.phone || '967773041464'}?text=${encodeURIComponent(message)}`, '_blank');
}
async function compressImage(file) { return new Promise((resolve) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.readAsDataURL(file); }); }
async function syncPatientImagesToServer() { return true; }

// ============ المزامنة ============
async function syncAllOfflineData() { return true; }
async function syncAllDataWithServer() { if(navigator.onLine && currentUser) await loadPatients(); return true; }

// ============ أحداث ============
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', e => { e.preventDefault(); login(); });
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.addEventListener('submit', e => { e.preventDefault(); register(); });
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', e => {
            e.preventDefault();
            const data = { name: document.getElementById('patientName').value, phone: document.getElementById('patientPhone').value, age: parseInt(document.getElementById('patientAge').value), address: document.getElementById('patientAddress').value, notes: document.getElementById('patientNotes').value };
            if (document.getElementById('patientId').value) updatePatient(document.getElementById('patientId').value, data);
            else addPatient(data);
        });
    }
    if (window.safeStorage.get('userId')) loadDashboard();
    else showLogin();
    checkConnectionStatus();
});
window.addEventListener('online', () => { console.log('🔄 Online'); syncAllDataWithServer(); });
window.addEventListener('offline', () => { console.log('📴 Offline'); document.body.classList.add('offline-mode'); });
