const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
    password: { type: String, required: true },
    phone: { type: String, default: '' },           // لا يوجد unique
    age: { type: Number, default: 0 },              // لا يوجد قيود
    clinicName: { type: String, required: true },
    address: { type: String, default: '' },         // لا يوجد unique
    role: { type: String, default: 'user' },
    isSubscribed: { type: Boolean, default: false },
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
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // للمستخدمين المحددين
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sentByName: { type: String },
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
const treatmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toothNumber: Number,
    treatmentType: String,
    description: String,
    cost: Number,
    treatmentDate: { type: Date, default: Date.now },
    notes: String
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

// أضف هذا التعبير المنتظم في بداية الملف (بعد الـ requires)
const usernameRegex = /^[a-zA-Z0-9]+$/;

app.post('/api/register', async (req, res) => {
    try {
        console.log('📝 Register request:', req.body);
        
        const { fullName, username, password, phone, age, clinicName, address } = req.body;
        
        // ✅ التحقق من كلمة المرور (إنجليزي، أرقام، 6 خانات على الأقل)
        const passwordRegex = /^[a-zA-Z0-9]{6,}$/;
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
        
        // ✅ التحقق من رقم الهاتف (9 أرقام ويبدأ بـ 7)
        const phoneRegex = /^7[0-9]{8}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'رقم الهاتف يجب أن يكون 9 أرقام ويبدأ بالرقم 7' });
        }
        
        // ✅ التحقق من الاسم الكامل (3 أحرف على الأقل)
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
        
        // ✅ التحقق من عدم تكرار رقم الهاتف
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'رقم الهاتف مسجل بالفعل' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        // Create user
        const user = new User({
            fullName: fullName.trim(),
            username: username.trim(),
            password: password, // سيتم تخزينها كما هي
            phone: phone,
            age: parseInt(age),
            clinicName: clinicName.trim(),
            address: address ? address.trim() : '',
            role: username === 'admin' ? 'admin' : 'user'
        });
        
        await user.save();
        
        console.log('✅ User created:', username, 'with ID:', user._id);
        
        res.json({
            success: true,
            user: {
                id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: user.isSubscribed
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // رسالة خاصة لتكرار المفتاح
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
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        if (user.password !== password) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        console.log('✅ Login successful:', username, 'ID:', user._id);
        
        res.json({
            success: true,
            user: {
                id: user._id.toString(), // Ensure it's a string
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: user.isSubscribed,
                subscriptionExpiry: user.subscriptionExpiry
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'خطأ في تسجيل الدخول' });
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
        
        // Check if subscription is expired
        let isSubscribed = user.isSubscribed;
        let subscriptionExpiry = user.subscriptionExpiry;
        
        if (user.isSubscribed && user.subscriptionExpiry) {
            const now = new Date();
            if (now > user.subscriptionExpiry) {
                isSubscribed = false;
                user.isSubscribed = false;
                await user.save();
                subscriptionExpiry = null;
                console.log('⚠️ Subscription expired for user:', user.username);
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
        
        console.log('✅ User data sent:', user.username, 'Patients:', patientCount);
        
        res.json({
            user: {
                id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: isSubscribed,
                subscriptionExpiry: subscriptionExpiry
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
        const { title, body, type, targetUsers, userIds, senderId } = req.body;
        
        // التحقق من صلاحيات المدير
        const sender = await User.findById(senderId);
        if (!sender || sender.role !== 'admin') {
            return res.status(403).json({ message: 'غير مصرح لك بإرسال الإشعارات' });
        }
        
        // إنشاء الإشعار
        const notification = new Notification({
            title,
            body,
            type: type || 'info',
            targetUsers: targetUsers || 'all',
            userIds: targetUsers === 'specific' ? userIds : [],
            sentBy: senderId,
            sentByName: sender.fullName,
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
// API عام لعرض الصور (بدون تسجيل دخول)
app.get('/api/public/patient-images/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { token } = req.query;
        
        // التحقق من صحة التوكن
        // (يمكن تخزين التوكنات في قاعدة البيانات)
        
        // جلب بيانات المريض الأساسية (عامة فقط)
        const patient = await db.collection('patients').findOne({ _id: patientId });
        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        // جلب الصور (عامة)
        const images = await db.collection('patient_images')
            .find({ patientId: patientId })
            .sort({ createdAt: -1 })
            .toArray();
        
        // إخفاء البيانات الحساسة
        res.json({
            patient: {
                name: patient.name,
                phone: patient.phone,
                age: patient.age,
                address: patient.address
            },
            images: images.map(img => ({
                data: img.imageData,
                caption: img.caption,
                createdAt: img.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
            sentByName: un.notificationId.sentByName
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
