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
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.log('⚠️  Please make sure MongoDB is running. Run "mongod" in terminal');
});

// User Schema
const userSchema = new mongoose.Schema({
    fullName: String,
    username: { type: String, unique: true },
    password: String,
    phone: String,
    age: Number,
    clinicName: String,
    address: String,
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
    createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);

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

// ============ AUTH ROUTES ============
app.post('/api/register', async (req, res) => {
    try {
        console.log('📝 Register request:', req.body);
        
        const { fullName, username, password, phone, age, clinicName, address } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        // Create user
        const user = new User({
            fullName,
            username,
            password, // Note: In production, you should hash this!
            phone,
            age: parseInt(age),
            clinicName,
            address,
            role: username === 'admin' ? 'admin' : 'user'
        });
        
        await user.save();
        
        console.log('✅ User created:', username);
        
        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: user.isSubscribed
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
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
        
        console.log('✅ Login successful:', username);
        
        res.json({
            success: true,
            user: {
                id: user._id,
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
        const user = await User.findById(req.params.userId);
        const patientCount = await Patient.countDocuments({ userId: user._id });
        
        res.json({
            user,
            patientCount,
            remainingSlots: user.role === 'admin' ? 'غير محدود' : (user.isSubscribed ? 'غير محدود' : Math.max(0, 5 - patientCount))
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});

// ============ PATIENT ROUTES ============
app.get('/api/patients/:userId', async (req, res) => {
    try {
        const patients = await Patient.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});

app.post('/api/patients', async (req, res) => {
    try {
        const { userId, name, phone, age, address, medicalHistory, notes } = req.body;
        
        // Check limit
        const user = await User.findById(userId);
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
            phone,
            age: parseInt(age),
            address: address || '',
            medicalHistory: medicalHistory || '',
            notes: notes || ''
        });
        
        await patient.save();
        
        res.json({ success: true, patient });
    } catch (error) {
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

// ============ TREATMENT ROUTES ============
app.get('/api/treatments/patient/:patientId', async (req, res) => {
    try {
        const treatments = await Treatment.find({ patientId: req.params.patientId }).sort({ treatmentDate: -1 });
        res.json(treatments);
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
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

app.put('/api/admin/users/:id/subscription', async (req, res) => {
    try {
        const { isSubscribed } = req.body;
        const user = await User.findById(req.params.id);
        
        if (isSubscribed) {
            user.isSubscribed = true;
            user.subscriptionExpiry = new Date();
            user.subscriptionExpiry.setMonth(user.subscriptionExpiry.getMonth() + 1);
        } else {
            user.isSubscribed = false;
            user.subscriptionExpiry = null;
        }
        
        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: 'خطأ' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`📱 Open: http://localhost:${PORT}`);
    console.log(`📝 Press Ctrl+C to stop\n`);
});
