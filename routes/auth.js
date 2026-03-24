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
    body('phone').matches(/^[0-9]{10,15}$/).withMessage('رقم الهاتف غير صالح'),
    body('age').isInt({ min: 18, max: 100 }).withMessage('العمر يجب أن يكون بين 18 و 100'),
    body('clinicName').notEmpty().withMessage('اسم العيادة مطلوب'),
    body('address').notEmpty().withMessage('العنوان مطلوب')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, fullName, phone, age, clinicName, address } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }

        // Create user
        const user = await User.create({
            fullName,
            username,
            password,
            phone,
            age,
            clinicName,
            address,
            role: username === 'admin' ? 'admin' : 'user'
        });

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
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
        console.error(error);
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Login user
router.post('/login', [
    body('username').notEmpty().withMessage('اسم المستخدم مطلوب'),
    body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Check subscription expiry
        if (user.isSubscribed && user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
            user.isSubscribed = false;
            await user.save();
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
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
        console.error(error);
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get current user
router.get('/me', protect, async (req, res) => {
    try {
        const patientCount = await require('../models/Patient').countDocuments({ userId: req.user._id });
        res.json({
            user: req.user,
            patientCount,
            canAddMore: await req.user.canAddPatient(patientCount),
            remainingSlots: req.user.role === 'admin' ? 'غير محدود' : req.user.isSubscribed ? 'غير محدود' : Math.max(0, 5 - patientCount)
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;