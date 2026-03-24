const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Register new user
router.post('/register', [
    body('fullName').notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('username').isLength({ min: 3 }).withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('phone').optional().custom((value) => {
        if (!value) return true;
        const cleanPhone = value.replace(/[^\d+]/g, '');
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
            return true;
        }
        throw new Error('رقم الهاتف يجب أن يكون بين 8 و 15 رقم');
    }),
    body('age').isInt({ min: 18, max: 100 }).withMessage('العمر يجب أن يكون بين 18 و 100'),
    body('clinicName').notEmpty().withMessage('اسم العيادة مطلوب'),
    body('address').notEmpty().withMessage('العنوان مطلوب')
], async (req, res) => {
    try {
        console.log('📝 Registration request received:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ 
                message: errors.array()[0].msg,
                errors: errors.array() 
            });
        }

        const { fullName, username, password, phone, age, clinicName, address } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            console.log('❌ Username already exists:', username);
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }

        // Clean phone number if provided
        let cleanPhone = '';
        if (phone) {
            cleanPhone = phone.replace(/[^\d+]/g, '');
        }

        // Create user
        const user = await User.create({
            fullName,
            username,
            password,
            phone: cleanPhone,
            age: parseInt(age),
            clinicName,
            address,
            role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
            isSubscribed: username.toLowerCase() === 'admin' ? true : false
        });

        console.log('✅ User created successfully:', user.username);

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key_change_this',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role,
                isSubscribed: user.isSubscribed
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            message: 'خطأ في إنشاء الحساب', 
            error: error.message 
        });
    }
});

// Login user
router.post('/login', [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
    try {
        console.log('🔐 Login request received:', req.body.username);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', username);
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Check subscription expiry
        if (user.isSubscribed && user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
            user.isSubscribed = false;
            await user.save();
            console.log('⚠️ Subscription expired for user:', username);
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key_change_this',
            { expiresIn: '7d' }
        );

        console.log('✅ User logged in successfully:', username);

        res.json({
            success: true,
            token,
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
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'خطأ في تسجيل الدخول', error: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const Patient = require('../models/Patient');
        const patientCount = await Patient.countDocuments({ userId: req.user._id });
        const canAdd = await req.user.canAddPatient(patientCount);
        const remainingSlots = req.user.role === 'admin' ? 'غير محدود' : req.user.isSubscribed ? 'غير محدود' : Math.max(0, 5 - patientCount);
        
        res.json({
            user: req.user,
            patientCount,
            canAddMore: canAdd,
            remainingSlots
        });
    } catch (error) {
        console.error('❌ Error getting user info:', error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
    }
});

module.exports = router;
