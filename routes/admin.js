const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const Treatment = require('../models/Treatment');
const { protect, adminOnly } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(protect, adminOnly);

// Get all users with their stats
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const patientCount = await Patient.countDocuments({ userId: user._id });
            const treatmentCount = await Treatment.countDocuments({ userId: user._id });
            const totalCost = await Treatment.aggregate([
                { $match: { userId: user._id } },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]);
            
            return {
                ...user.toObject(),
                patientCount,
                treatmentCount,
                totalCost: totalCost[0]?.total || 0
            };
        }));
        
        res.json(usersWithStats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب المستخدمين', error: error.message });
    }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        const patients = await Patient.find({ userId: user._id });
        const treatments = await Treatment.find({ userId: user._id }).populate('patientId', 'name');
        
        res.json({
            user,
            patients,
            treatments,
            patientCount: patients.length,
            treatmentCount: treatments.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المستخدم', error: error.message });
    }
});

// Update user subscription
router.put('/users/:id/subscription', async (req, res) => {
    try {
        const { isSubscribed, subscriptionExpiry } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        user.isSubscribed = isSubscribed;
        if (subscriptionExpiry) {
            user.subscriptionExpiry = new Date(subscriptionExpiry);
        } else if (isSubscribed) {
            // Default 1 year subscription
            user.subscriptionExpiry = new Date();
            user.subscriptionExpiry.setFullYear(user.subscriptionExpiry.getFullYear() + 1);
        } else {
            user.subscriptionExpiry = null;
        }
        
        await user.save();
        
        res.json({ success: true, user: user.toObject() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في تحديث الاشتراك', error: error.message });
    }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
    try {
        // Prevent deleting self
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });
        }
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        // Delete all user's data
        await Patient.deleteMany({ userId: user._id });
        await Treatment.deleteMany({ userId: user._id });
        await user.deleteOne();
        
        res.json({ success: true, message: 'تم حذف المستخدم وجميع بياناته بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في حذف المستخدم', error: error.message });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalPatients = await Patient.countDocuments();
        const totalTreatments = await Treatment.countDocuments();
        const subscribedUsers = await User.countDocuments({ isSubscribed: true });
        
        const totalRevenue = await Treatment.aggregate([
            { $group: { _id: null, total: { $sum: '$cost' } } }
        ]);
        
        const treatmentsByType = await Treatment.aggregate([
            { $group: { _id: '$treatmentType', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalUsers,
            totalPatients,
            totalTreatments,
            subscribedUsers,
            totalRevenue: totalRevenue[0]?.total || 0,
            treatmentsByType,
            freeUsers: totalUsers - subscribedUsers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب الإحصائيات', error: error.message });
    }
});

module.exports = router;