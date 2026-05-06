const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
// زيادة حجم الطلب المسموح به لاستقبال الصور (حد أقصى 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));
// زيادة حد حجم الطلب
app.use((req, res, next) => {
    express.json({ limit: '10mb' })(req, res, (err) => {
        if (err) {
            console.error('❌ Body too large:', err);
            return res.status(413).json({ error: 'الصورة كبيرة جداً، الحد الأقصى 10MB' });
        }
        next();
    });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ClinicPro:admin8899@cluster0.ufglcnq.mongodb.net/?appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Please make sure MongoDB is running. Run "mongod" in terminal');
});

// User Schema (بدون قيود على phone و age و address)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    originalUsername: { type: String, default: '' },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    age: { type: Number, default: 0 },
    clinicName: { type: String, required: true },
    address: { type: String, default: '' },
    role: { type: String, default: 'user' },
    isSubscribed: { type: Boolean, default: false },
    subscriptionType: { type: String, enum: ['free', 'student', 'clinic'], default: 'free' }, // ✅ أضف هذا السطر
    subscriptionExpiry: Date,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Patient Schema
const patientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    age: Number,
    address: String,
    medicalHistory: String,
    notes: String,
    nextAppointment: { type: Date, default: null }, // الموعد القادم
    nextAppointmentNotes: { type: String, default: '' }, // ملاحظات الموعد
    createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

// ============ NOTIFICATION SCHEMA ============
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
    targetUsers: { type: String, enum: ['all', 'specific'], default: 'all' },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentByName: { type: String },
    buttonText: { type: String, default: '' },      // ✅ أضف هذا
    buttonLink: { type: String, default: '' },      // ✅ أضف هذا
    buttonColor: { type: String, default: 'blue' }, // ✅ أضف هذا
    createdAt: { type: Date, default: Date.now }
});

// ============ USER NOTIFICATION READ STATUS ============
const userNotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);
const UserNotification = mongoose.model('UserNotification', userNotificationSchema);
// Treatment Schema
// في ملف models/Treatment.js
const treatmentSchema = new mongoose.Schema({
    patientId: { type: String, required: true },
    userId: { type: String, required: true },
    toothNumber: { type: mongoose.Schema.Types.Mixed, required: true }, // قبول رقم أو نص
    treatmentType: { type: String, required: true },
    cost: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    payments: { type: Array, default: [] },     // حفظ الدفعات
    followUps: { type: Array, default: [] },    // حفظ العوائد
    notes: { type: String, default: '' },
    treatmentDate: { type: Date, default: Date.now }
});

const Treatment = mongoose.model('Treatment', treatmentSchema);

// منع التخزين المؤقت لكل الملفات
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// ============ API للعوائد (Follow-ups) ============

const FollowUpSchema = new mongoose.Schema({
    treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Treatment', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, required: true },
    amountPaid: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

const FollowUp = mongoose.model('FollowUp', FollowUpSchema);
// ============================================
// دالة لتحويل patientId و userId فقط في المعالجات
// ============================================
// ============================================
// دالة تحويل بسيطة وقوية
// ============================================
async function convertTreatmentIdsToStrings() {
    console.log('🔄 بدء تحويل patientId و userId في المعالجات...');
    
    try {
        // استخدام updateMany مع شرط التحقق من النوع
        // تحويل patientId
        const patientResult = await Treatment.updateMany(
            { patientId: { $type: 'objectId' } },
            [{ $set: { patientId: { $toString: '$patientId' } } }]
        );
        
        // تحويل userId
        const userResult = await Treatment.updateMany(
            { userId: { $type: 'objectId' } },
            [{ $set: { userId: { $toString: '$userId' } } }]
        );
        
        console.log(`\n✅ اكتمل التحويل!`);
        console.log(`📊 patientId: تم تحديث ${patientResult.modifiedCount || 0} معالجة`);
        console.log(`📊 userId: تم تحديث ${userResult.modifiedCount || 0} معالجة`);
        
        return { 
            patientIdFixed: patientResult.modifiedCount || 0, 
            userIdFixed: userResult.modifiedCount || 0 
        };
        
    } catch (error) {
        console.error('❌ خطأ في التحويل:', error);
        
        // إذا فشلت الطريقة الأولى، جرب الطريقة البديلة
        console.log('🔄 تجربة الطريقة البديلة...');
        
        const treatments = await Treatment.find();
        let updated = 0;
        
        for (const t of treatments) {
            let changed = false;
            
            if (t.patientId && t.patientId.toString && t.patientId.toString().match(/^[a-f0-9]{24}$/i)) {
                t.patientId = t.patientId.toString();
                changed = true;
            }
            
            if (t.userId && t.userId.toString && t.userId.toString().match(/^[a-f0-9]{24}$/i)) {
                t.userId = t.userId.toString();
                changed = true;
            }
            
            if (changed) {
                await t.save();
                updated++;
            }
        }
        
        console.log(`📊 الطريقة البديلة: تم تحديث ${updated} معالجة`);
        return { patientIdFixed: updated, userIdFixed: updated };
    }
}

// API لتشغيل الدالة (للمدير فقط)
app.post('/api/admin/convert-treatment-ids', async (req, res) => {
    try {
        const { adminKey } = req.body;
        if (adminKey !== 'CLINICPRO_ADMIN_8899') {
            return res.status(403).json({ error: 'غير مصرح به - مفتاح غير صحيح' });
        }
        
        const result = await convertTreatmentIdsToStrings();
        res.json({ success: true, ...result });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// تشغيل التحويل مباشرة عند بدء السيرفر مع تأخير وفحص
mongoose.connection.once('open', async () => {
    console.log('✅ جاهز للتحويل...');
    
    // تأخير 3 ثواني للتأكد من اكتمال الاتصال
    setTimeout(async () => {
        // فحص عدد المعالجات التي تحتاج تحويل
        const treatmentsWithObjectId = await Treatment.find({
            $or: [
                { patientId: { $type: 'objectId' } },
                { userId: { $type: 'objectId' } }
            ]
        });
        
        console.log(`📋 عدد المعالجات التي تحتاج تحويل: ${treatmentsWithObjectId.length}`);
        
        if (treatmentsWithObjectId.length > 0) {
            console.log('🔄 بدء التحويل التلقائي...');
            await convertTreatmentIdsToStrings();
            console.log('✅ اكتمل التحويل التلقائي!');
        } else {
            console.log('✅ جميع المعرفات بالفعل نصوص، لا حاجة للتحويل');
        }
    }, 3000);
});
// API للتحويل المباشر (يمكن استدعاؤه من المتصفح)
app.get('/api/force-convert-now', async (req, res) => {
    try {
        console.log('🔄 بدء التحويل الفوري...');
        
        const treatments = await Treatment.find();
        let updatedPatientId = 0;
        let updatedUserId = 0;
        
        for (const treatment of treatments) {
            let needsUpdate = false;
            
            if (treatment.patientId && typeof treatment.patientId === 'object') {
                treatment.patientId = treatment.patientId.toString();
                updatedPatientId++;
                needsUpdate = true;
            }
            
            if (treatment.userId && typeof treatment.userId === 'object') {
                treatment.userId = treatment.userId.toString();
                updatedUserId++;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await treatment.save();
            }
        }
        
        console.log(`✅ تم التحويل: patientId=${updatedPatientId}, userId=${updatedUserId}`);
        
        res.json({
            success: true,
            message: 'تم التحويل بنجاح',
            updatedPatientId,
            updatedUserId
        });
        
    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة عودة جديدة
app.post('/api/followups', async (req, res) => {
    try {
        const { treatmentId, patientId, userId, notes, amountPaid, date } = req.body;
        
        const followUp = new FollowUp({
            treatmentId, patientId, userId, notes, amountPaid, date
        });
        
        await followUp.save();
        
        // تحديث المعالجة بإضافة العودة
        await Treatment.findByIdAndUpdate(treatmentId, {
            $push: { followUps: followUp._id }
        });
        
        res.status(201).json({ success: true, followUp });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// جلب عوائد معالجة معينة
app.get('/api/followups/treatment/:treatmentId', async (req, res) => {
    try {
        const followUps = await FollowUp.find({ treatmentId: req.params.treatmentId }).sort({ date: -1 });
        res.json({ success: true, followUps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// أضف هذا التعبير المنتظم في بداية الملف (بعد الـ requires)
const usernameRegex = /^[a-zA-Z0-9]+$/;

app.post('/api/register', async (req, res) => {
    try {
        console.log('📝 Register request:', req.body);
        
        const { fullName, username, password, phone, age, clinicName, address } = req.body;
        
        // ✅ تحويل اسم المستخدم إلى أحرف صغيرة (لتجنب التكرار بحالة الأحرف)
        const normalizedUsername = username.toLowerCase();
        
        // ✅ التحقق من كلمة المرور
        const passwordRegex = /^[A-Za-z0-9]{6,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'كلمة المرور يجب أن تحتوي على حروف إنجليزية وأرقام فقط، وأن تكون 6 خانات على الأقل' 
            });
        }
        
        // ✅ التحقق من اسم المستخدم (حروف إنجليزية وأرقام فقط)
        const usernameRegex = /^[a-zA-Z0-9]+$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({ message: 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط' });
        }
        
        // ✅ التحقق من رقم الهاتف
        const phoneRegex = /^7[0-9]{8}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بالرقم 7' });
        }
        
        // ✅ التحقق من الاسم الكامل
        if (!fullName || fullName.trim().length < 3) {
            return res.status(400).json({ message: 'الاسم الكامل يجب أن يكون 3 أحرف على الأقل' });
        }
        
        // ✅ التحقق من العمر
        if (!age || age < 18 || age > 100) {
            return res.status(400).json({ message: 'العمر يجب أن يكون بين 18 و 100 سنة' });
        }
        
        // ✅ التحقق من اسم العيادة
        if (!clinicName || clinicName.trim().length < 2) {
            return res.status(400).json({ message: 'اسم العيادة مطلوب' });
        }
        
        // ✅ التحقق من عدم تكرار اسم المستخدم (بغض النظر عن حالة الأحرف)
        const existingUser = await User.findOne({ 
            username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
        });
        if (existingUser) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        // ✅ التحقق من عدم تكرار رقم الهاتف
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'رقم الهاتف مسجل بالفعل' });
        }
        
        // إنشاء مستخدم جديد (تخزين اسم المستخدم بالأحرف الصغيرة)
        const user = new User({
            fullName: fullName.trim(),
            username: normalizedUsername,
            originalUsername: username, // حفظ الاسم الأصلي للعرض
            password: password,
            phone: phone,
            age: parseInt(age),
            clinicName: clinicName.trim(),
            address: address ? address.trim() : '',
            role: username === 'admin' ? 'admin' : 'user'
        });
        
        await user.save();
        
        console.log('✅ User created:', normalizedUsername, 'with ID:', user._id);
        
        res.json({
    success: true,
    user: {
        id: user._id.toString(),
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isSubscribed: user.isSubscribed,
        clinicName: user.clinicName || '',      // ✅ أضف هذا
        phone: user.phone || ''                 // ✅ أضف هذا
    }
});
    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ message: 'اسم المستخدم أو رقم الهاتف موجود بالفعل' });
        }
        
        res.status(500).json({ message: 'خطأ في التسجيل: ' + error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('🔐 Login request:', req.body.username);
        
        const { username, password } = req.body;
        
        // ✅ تحويل اسم المستخدم إلى أحرف صغيرة (للمقارنة)
        const normalizedUsername = username.toLowerCase();
        
        // ✅ البحث عن المستخدم (بغض النظر عن حالة الأحرف)
        const user = await User.findOne({ 
            username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
        });
        
        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        if (user.password !== password) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        console.log('✅ Login successful:', user.username, 'ID:', user._id);
        
        res.json({
    success: true,
    user: {
        id: user._id.toString(),
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isSubscribed: user.isSubscribed,
        subscriptionType: user.subscriptionType || 'free',
        subscriptionExpiry: user.subscriptionExpiry,
        clinicName: user.clinicName || '',      // ✅ أضف هذا
        phone: user.phone || ''                 // ✅ أضف هذا
    }
});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'خطأ في تسجيل الدخول' });
    }
});
// تغيير نوع اشتراك المستخدم (تحديث)
// تغيير نوع اشتراك المستخدم مع تحديد المدة
app.put('/api/admin/users/:userId/subscription-type', async (req, res) => {
    try {
        const { subscriptionType, duration } = req.body; // duration: 'monthly' or 'yearly'
        const userId = req.params.userId;
        
        // حساب تاريخ انتهاء الاشتراك
        let subscriptionExpiry = null;
        let isSubscribed = subscriptionType !== 'free';
        
        if (isSubscribed) {
            subscriptionExpiry = new Date();
            if (duration === 'yearly') {
                subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
            } else {
                subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
            }
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                subscriptionType: subscriptionType, 
                isSubscribed: isSubscribed,
                subscriptionExpiry: subscriptionExpiry
            },
            { new: true }
        );
        
        console.log(`✅ تم تحديث اشتراك ${user.username} إلى: ${subscriptionType}`);
        console.log(`📅 ينتهي في: ${subscriptionExpiry}`);
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating subscription type:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// تجديد اشتراك المستخدم
app.post('/api/admin/renew-subscription', async (req, res) => {
    try {
        const { userId, subscriptionType, duration } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        
        let subscriptionExpiry = new Date();
        if (duration === 'yearly') {
            subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
        } else {
            subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
        }
        
        user.subscriptionType = subscriptionType;
        user.isSubscribed = true;
        user.subscriptionExpiry = subscriptionExpiry;
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'تم تجديد الاشتراك بنجاح',
            subscriptionExpiry: subscriptionExpiry
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// حذف معالجة
app.delete('/api/treatments/:id', async (req, res) => {
    try {
        const treatmentId = req.params.id;
        
        // حذف المعالجة من قاعدة البيانات
        const deletedTreatment = await Treatment.findByIdAndDelete(treatmentId);
        
        if (!deletedTreatment) {
            return res.status(404).json({ success: false, message: 'المعالجة غير موجودة' });
        }
        
        // حذف الدفعات المرتبطة بهذه المعالجة
        await Payment.deleteMany({ treatmentId: treatmentId });
        
        // حذف العوائد المرتبطة بهذه المعالجة
        await FollowUp.deleteMany({ treatmentId: treatmentId });
        
        res.json({ success: true, message: 'تم حذف المعالجة بنجاح' });
    } catch (error) {
        console.error('Error deleting treatment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// ============ API لإدارة الدفعات ============

// نموذج الدفعة (أضفه مع النماذج الأخرى)
const PaymentSchema = new mongoose.Schema({
    treatmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Treatment', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', PaymentSchema);

// إضافة دفعة جديدة
app.post('/api/payments', async (req, res) => {
    try {
        const { treatmentId, patientId, userId, amount, date, note } = req.body;
        
        const payment = new Payment({
            treatmentId,
            patientId,
            userId,
            amount,
            date: date || new Date(),
            note
        });
        
        await payment.save();
        
        // تحديث المعالجة بإضافة الـ payment وإعادة حساب المدفوع
        const treatment = await Treatment.findById(treatmentId);
        if (treatment) {
            if (!treatment.payments) treatment.payments = [];
            treatment.payments.push(payment._id);
            
            // حساب إجمالي المدفوع
            const allPayments = await Payment.find({ treatmentId });
            let totalPaid = 0;
            for (let p of allPayments) totalPaid += p.amount;
            treatment.paid = totalPaid;
            
            await treatment.save();
        }
        
        res.status(201).json({ success: true, payment });
    } catch (error) {
        console.error('Error adding payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// جلب دفعات معالجة معينة
app.get('/api/payments/treatment/:treatmentId', async (req, res) => {
    try {
        const payments = await Payment.find({ treatmentId: req.params.treatmentId }).sort({ date: -1 });
        res.json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// جلب دفعات مريض معين
app.get('/api/payments/patient/:patientId', async (req, res) => {
    try {
        const payments = await Payment.find({ patientId: req.params.patientId }).sort({ date: -1 });
        res.json({ success: true, payments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// تفعيل اشتراك المستخدم بعد الدفع (للمدير)
app.post('/api/admin/activate-subscription', async (req, res) => {
    try {
        const { userId, subscriptionType, duration, transactionId } = req.body;
        
        if (!userId || !subscriptionType) {
            return res.status(400).json({ success: false, message: 'بيانات ناقصة' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        
        // حساب تاريخ الانتهاء
        let subscriptionExpiry = new Date();
        if (duration === 'yearly') {
            subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1);
        } else {
            subscriptionExpiry.setMonth(subscriptionExpiry.getMonth() + 1);
        }
        
        // تحديث بيانات المستخدم
        user.subscriptionType = subscriptionType;
        user.isSubscribed = true;
        user.subscriptionExpiry = subscriptionExpiry;
        
        await user.save();
        
        console.log(`✅ تم تفعيل اشتراك ${user.username} - النوع: ${subscriptionType}, حتى: ${subscriptionExpiry}`);
        
        res.json({ 
            success: true, 
            message: 'تم تفعيل الاشتراك بنجاح',
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                subscriptionType: user.subscriptionType,
                isSubscribed: user.isSubscribed,
                subscriptionExpiry: user.subscriptionExpiry
            }
        });
        
    } catch (error) {
        console.error('Error activating subscription:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        console.log('🔍 Fetching user with ID:', userId);
        
        // Check if userId is valid
        if (!userId || userId === 'undefined' || userId === 'null' || userId === '') {
            console.error('❌ Invalid user ID provided:', userId);
            return res.status(400).json({ message: 'معرف المستخدم غير صالح' });
        }
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('❌ Invalid ObjectId format:', userId);
            return res.status(400).json({ message: 'معرف المستخدم غير صالح' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            console.error('❌ User not found for ID:', userId);
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        const patientCount = await Patient.countDocuments({ userId: user._id });
        
        // ✅ التحقق من انتهاء صلاحية الاشتراك
        let isSubscribed = user.isSubscribed;
        let subscriptionExpiry = user.subscriptionExpiry;
        let subscriptionType = user.subscriptionType || 'free';
        
        if (user.isSubscribed && user.subscriptionExpiry) {
            const now = new Date();
            const expiryDate = new Date(user.subscriptionExpiry);
            
            if (now > expiryDate) {
                // الاشتراك انتهى - تحويل إلى مجاني
                isSubscribed = false;
                subscriptionType = 'free';
                subscriptionExpiry = null;
                
                // تحديث قاعدة البيانات
                user.isSubscribed = false;
                user.subscriptionType = 'free';
                user.subscriptionExpiry = null;
                await user.save();
                
                console.log(`⚠️ انتهى اشتراك المستخدم: ${user.username} في ${expiryDate.toLocaleDateString()}`);
            } else {
                // ✅ حساب الأيام المتبقية (للإشعارات)
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                console.log(`📅 متبقي ${daysLeft} يوم على انتهاء اشتراك ${user.username}`);
                
                // إرسال الأيام المتبقية مع الرد (اختياري)
                // يمكن إضافتها في الرد إذا أردت
            }
        }
        
        // Calculate remaining slots
        let remainingSlots;
        if (user.role === 'admin') {
            remainingSlots = 'غير محدود';
        } else if (isSubscribed) {
            remainingSlots = 'غير محدود';
        } else {
            remainingSlots = Math.max(0, 5 - patientCount);
        }
        
        console.log('✅ User data sent:', user.username, 'Patients:', patientCount, 'Subscription:', subscriptionType);
        
        res.json({
            user: {
                id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: isSubscribed,
                subscriptionType: subscriptionType,
                subscriptionExpiry: subscriptionExpiry,
                clinicName: user.clinicName || '',
                phone: user.phone || ''
            },
            patientCount,
            remainingSlots
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم: ' + error.message });
    }
});

// ============ NOTIFICATION ROUTES ============

// إرسال إشعار (للمدير فقط)
app.post('/api/notifications', async (req, res) => {
    try {
        const { title, body, type, targetUsers, userIds, senderId, buttonText, buttonLink, buttonColor } = req.body;
        
        const sender = await User.findById(senderId);
        if (!sender || sender.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح لك بإرسال الإشعارات' });
        }
        
        const notification = new Notification({
            title,
            body,
            type: type || 'info',
            targetUsers: targetUsers || 'all',
            userIds: targetUsers === 'specific' ? userIds : [],
            sentBy: senderId,
            sentByName: sender.fullName,
            buttonText: buttonText || '',
            buttonLink: buttonLink || '',
            buttonColor: buttonColor || 'blue',
            createdAt: new Date()
        });
        
        await notification.save();
        
        
        // تحديد المستخدمين المستهدفين
        let targetUserIds = [];
        if (targetUsers === 'all') {
            const allUsers = await User.find({ role: 'user' }); // فقط المستخدمين العاديين
            targetUserIds = allUsers.map(u => u._id);
        } else if (targetUsers === 'specific' && userIds && userIds.length > 0) {
            targetUserIds = userIds;
        }
        
        // إنشاء سجلات القراءة لكل مستخدم
        const userNotifications = targetUserIds.map(userId => ({
            userId,
            notificationId: notification._id,
            read: false,
            createdAt: new Date()
        }));
        
        await UserNotification.insertMany(userNotifications);
        
        console.log(`✅ Notification sent: "${title}" to ${targetUserIds.length} users`);
        
        res.json({ 
            success: true, 
            notification: notification,
            recipientCount: targetUserIds.length
        });
        
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: 'خطأ في إرسال الإشعار' });
    }
});
 


// جلب إشعارات المستخدم الحالي
app.get('/api/notifications/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'معرف المستخدم غير صالح' });
        }
        
        // جلب إشعارات المستخدم مع تفاصيل الإشعار
        const userNotifications = await UserNotification.find({ userId: userId })
            .populate('notificationId')
            .sort({ createdAt: -1 });
        
        // تنسيق البيانات
        const notifications = userNotifications.map(un => ({
            id: un.notificationId._id,
            title: un.notificationId.title,
            body: un.notificationId.body,
            type: un.notificationId.type,
            createdAt: un.notificationId.createdAt,
            read: un.read,
            readAt: un.readAt,
            sentByName: un.notificationId.sentByName,
            un.notificationId.buttonText,   // ✅ أضف هذا
            buttonLink: un.notificationId.buttonLink,   // ✅ أضف هذا
            buttonColor: un.notificationId.buttonColor  // ✅ أضف هذا
        }));
        
        // حساب عدد غير المقروء
        const unreadCount = notifications.filter(n => !n.read).length;
        
        res.json({
            success: true,
            notifications: notifications,
            unreadCount: unreadCount
        });
        
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'خطأ في جلب الإشعارات' });
    }
});

// تعيين إشعار كمقروء
app.put('/api/notifications/:notificationId/read/:userId', async (req, res) => {
    try {
        const { notificationId, userId } = req.params;
        
        const userNotification = await UserNotification.findOne({
            userId: userId,
            notificationId: notificationId
        });
        
        if (!userNotification) {
            return res.status(404).json({ message: 'الإشعار غير موجود' });
        }
        
        userNotification.read = true;
        userNotification.readAt = new Date();
        await userNotification.save();
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'خطأ في تحديث حالة الإشعار' });
    }
});

// تعيين كل الإشعارات كمقروءة
app.put('/api/notifications/read-all/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        await UserNotification.updateMany(
            { userId: userId, read: false },
            { read: true, readAt: new Date() }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'خطأ في تحديث الإشعارات' });
    }
});

// جلب عدد الإشعارات غير المقروءة (للمستخدم)
app.get('/api/notifications/unread-count/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const count = await UserNotification.countDocuments({
            userId: userId,
            read: false
        });
        
        res.json({ success: true, count: count });
        
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.json({ success: true, count: 0 });
    }
});

// جلب جميع المستخدمين لإرسال الإشعارات (للمدير)
app.get('/api/admin/users-list', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('_id fullName username');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'خطأ في جلب المستخدمين' });
    }
});

// ============ PATIENT ROUTES ============
app.get('/api/patients/:id/details', async (req, res) => {
    try {
        const patientId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'معرف المريض غير صالح' });
        }
        
        const patient = await Patient.findById(patientId).populate('userId', 'fullName clinicName');
        
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        const treatments = await Treatment.find({ patientId: patientId }).sort({ treatmentDate: -1 });
        
        let totalCost = 0;
        let totalPaid = 0;
        
        treatments.forEach(t => {
            totalCost += t.cost || 0;
            let paid = 0;
            if (t.notes) {
                const match = t.notes.match(/المدفوع:\s*([\d.]+)/);
                if (match) paid = parseFloat(match[1]);
            }
            totalPaid += paid;
        });
        
        const remaining = totalCost - totalPaid;
        
        res.json({
            patient,
            treatments,
            stats: {
                treatmentsCount: treatments.length,
                totalCost,
                totalPaid,
                remaining
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المريض' });
    }
});
app.get('/api/patients/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId || userId === 'undefined') {
            return res.status(400).json({ message: 'معرف المستخدم غير صالح' });
        }
        
        const patients = await Patient.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        console.error('Error getting patients:', error);
        res.status(500).json({ message: 'خطأ في جلب المرضى' });
    }
});

app.post('/api/patients', async (req, res) => {
    try {
        const { userId, name, phone, age, address, medicalHistory, notes } = req.body;
        
        if (!userId || userId === 'undefined') {
            return res.status(400).json({ message: 'معرف المستخدم غير صالح' });
        }
        
        // Check limit
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        const patientCount = await Patient.countDocuments({ userId });
        
        if (user.role !== 'admin' && !user.isSubscribed && patientCount >= 5) {
            return res.status(403).json({ 
                message: 'لقد وصلت للحد الأقصى (5 مرضى). يرجى الاشتراك',
                needSubscription: true 
            });
        }
        
        const patient = new Patient({
            userId,
            name,
            phone: phone || '',
            age: parseInt(age),
            address: address || '',
            medicalHistory: medicalHistory || '',
            notes: notes || ''
        });
        
        await patient.save();
        
        res.json({ success: true, patient });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ message: 'خطأ في إضافة المريض' });
    }
});

app.put('/api/patients/:id', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في التحديث' });
    }
});

app.delete('/api/patients/:id', async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        await Treatment.deleteMany({ patientId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الحذف' });
    }
});
// إضافة رؤوس PWA
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// خدمة ملف manifest.json
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// خدمة Service Worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

// جلب جميع معالجات المستخدم (لصفحة الدخل)
app.get('/api/treatments/user/:userId', async (req, res) => {
    try {
        const treatments = await Treatment.find({ userId: req.params.userId }).sort({ treatmentDate: -1 });
        res.json(treatments);
    } catch (error) {
        console.error('Error fetching user treatments:', error);
        res.status(500).json({ message: 'خطأ في جلب المعالجات' });
    }
});

// ============ TREATMENT ROUTES ============
app.get('/api/treatments/patient/:patientId', async (req, res) => {
    try {
        const treatments = await Treatment.find({ patientId: req.params.patientId }).sort({ treatmentDate: -1 });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});

// إضافة مسار جديد لجلب تفاصيل معالجة واحدة
app.get('/api/treatments/:id', async (req, res) => {
    try {
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            return res.status(404).json({ message: 'المعالجة غير موجودة' });
        }
        res.json(treatment);
    } catch (error) {
        console.error('Error fetching treatment:', error);
        res.status(500).json({ message: 'خطأ في جلب تفاصيل المعالجة' });
    }
});

app.post('/api/treatments', async (req, res) => {
    try {
        const treatment = new Treatment(req.body);
        await treatment.save();
        res.json({ success: true, treatment });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المعالجة' });
    }
});

app.delete('/api/treatments/:id', async (req, res) => {
    try {
        await Treatment.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الحذف' });
    }
});
app.put('/api/treatments/:id', async (req, res) => {
    try {
        const treatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, treatment });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في تحديث المعالجة' });
    }
});

// ============ ADMIN ROUTES ============
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const patientCount = await Patient.countDocuments({ userId: user._id });
            const treatmentCount = await Treatment.countDocuments({ userId: user._id });
            return { ...user.toObject(), patientCount, treatmentCount };
        }));
        res.json(usersWithStats);
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});
// جلب جميع المرضى من جميع المستخدمين (للمدير فقط)
app.get('/api/admin/patients', async (req, res) => {
    try {

        const patients = await Patient.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName clinicName');

        const patientsWithData = await Promise.all(
            patients.map(async (p) => {

                const treatments = await Treatment.find({
                    patientId: p._id
                }).sort({ treatmentDate: -1 });

                return {
                    ...p.toObject(),
                    doctorName: p.userId ? p.userId.fullName : 'غير معروف',
                    clinicName: p.userId ? p.userId.clinicName : 'غير معروف',
                    treatments: treatments
                };

            })
        );

        res.json(patientsWithData);

    } catch (error) {

        console.error('Error fetching admin patients:', error);

        res.status(500).json({
            message: 'خطأ في جلب بيانات المرضى'
        });

    }
});

app.put('/api/admin/users/:id/subscription', async (req, res) => {
    try {
        const userId = req.params.id;
        const isSubscribed = Boolean(req.body.isSubscribed);
        
        console.log(`🔧 Updating subscription for ${userId} to ${isSubscribed}`);
        
        // التحقق من صحة الـ ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'معرف غير صالح' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        // تحديث الحالة
        user.isSubscribed = isSubscribed;
        
        if (isSubscribed) {
            // تفعيل الاشتراك لمدة شهر
            const expiry = new Date();
expiry.setMonth(expiry.getMonth() + 1);
user.subscriptionExpiry = expiry;
        } else {
            user.subscriptionExpiry = null;
        }
        
        await user.save();
        
        console.log(`✅ User ${user.username} subscription updated to: ${user.isSubscribed}`);
        console.log(`✅ Expiry: ${user.subscriptionExpiry}`);
        
        res.json({ 
            success: true, 
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                isSubscribed: user.isSubscribed,
                subscriptionExpiry: user.subscriptionExpiry
            }
        });
    } catch (error) {
        console.error('❌ Error updating subscription:', error);
        res.status(500).json({ message: 'خطأ في تحديث الاشتراك: ' + error.message });
    }
});
// ============ CREATE DEFAULT ADMIN USER ============
async function createDefaultAdmin() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const adminUser = new User({
                fullName: 'مدير النظام',
                username: 'admin',
                password: 'admin123',
                phone: '0000000000',
                age: 30,
                clinicName: 'النظام الرئيسي',
                address: 'المركز الرئيسي',
                role: 'admin',
                isSubscribed: true,
                subscriptionExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 10)) // 10 years
            });
            await adminUser.save();
            console.log('✅ Default admin user created:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Call this after MongoDB connection
mongoose.connection.once('open', () => {
    createDefaultAdmin();
});
// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`📱 Open: http://localhost:${PORT}`);
    console.log(`📝 Press Ctrl+C to stop\n`);
});
