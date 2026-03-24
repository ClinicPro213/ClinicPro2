const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_change_this');
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'المستخدم غير موجود' });
            }
            
            // Check if subscription expired
            if (req.user.isSubscribed && req.user.subscriptionExpiry) {
                const now = new Date();
                if (now > req.user.subscriptionExpiry) {
                    req.user.isSubscribed = false;
                    await req.user.save();
                    console.log(`⚠️ Subscription expired for user: ${req.user.username}`);
                }
            }
            
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'غير مصرح به، توكن غير صالح' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'غير مصرح به، لا يوجد توكن' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'غير مصرح به، هذه الصفحة للمدير فقط' });
    }
};

module.exports = { protect, adminOnly };
