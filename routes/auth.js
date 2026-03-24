// auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs'); // متوافق مع كل الأجهزة
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ===== REGISTER =====
router.post('/register', [
    body('fullName').notEmpty().withMessage('الاسم الكامل مطلوب'),
    body('username').isLength({ min: 3 }).withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('phone').optional().custom((value) => {
        if (!value) return true;
        const cleanPhone = value.replace(/[^\d+]/g, '');
        if (cleanPhone.length >= 8 && cleanPhone.length <= 15) return true;
        throw new Error('رقم الهاتف يجب أن يكون بين 8 و 15 رقم');
    }),
    body('age').isInt({ min: 18, max: 100 }).withMessage('العمر يجب أن يكون بين 18 و 100'),
    body('clinicName').notEmpty().withMessage('اسم العيادة مطلوب'),
    body('address').notEmpty().withMessage('العنوان مطلوب')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });

        const { fullName, username, password, phone, age, clinicName, address } = req.body;

        // تحقق من وجود المستخدم مسبقًا
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            username,
            password: hashedPassword,
            phone: phone ? phone.replace(/[^\d+]/g, '') : '',
            age: parseInt(age),
            clinicName,
            address,
            role: username.toLowerCase() === 'admin' ? 'admin' : 'user',
            isSubscribed: username.toLowerCase() === 'admin'
        });

        // توليد توكن JWT
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
        res.status(500).json({ message: 'خطأ في إنشاء الحساب', error: error.message });
    }
});

// ===== LOGIN =====
router.post('/login', [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });

        // تحقق من انتهاء الاشتراك
        if (user.isSubscribed && user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
            user.isSubscribed = false;
            await user.save();
        }

        // توليد توكن JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key_change_this',
            { expiresIn: '7d' }
        );

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
        res.status(500).json({ message: 'خطأ في تسجيل الدخول', error: error.message });
    }
});

// ===== GET CURRENT USER =====
router.get('/me', protect, async (req, res) => {
    try {
        const Patient = require('../models/Patient');
        const patientCount = await Patient.countDocuments({ userId: req.user._id });

        let remainingSlots = 'غير محدود';
        let daysRemaining = 0;

        if (req.user.role === 'admin') {
            remainingSlots = 'غير محدود (مدير)';
        } else if (req.user.isSubscribed && req.user.subscriptionExpiry) {
            const now = new Date();
            if (now > req.user.subscriptionExpiry) {
                remainingSlots = Math.max(0, 5 - patientCount);
            } else {
                remainingSlots = 'غير محدود (مشترك)';
                daysRemaining = Math.ceil((req.user.subscriptionExpiry - now) / (1000 * 60 * 60 * 24));
            }
        } else {
            remainingSlots = Math.max(0, 5 - patientCount);
        }

        res.json({
            user: req.user,
            patientCount,
            remainingSlots,
            daysRemaining
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
    }
});

module.exports = router;
