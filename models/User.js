const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'الاسم الكامل مطلوب'],
        trim: true
    },
    username: {
        type: String,
        required: [true, 'اسم المستخدم مطلوب'],
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: [true, 'كلمة المرور مطلوبة'],
        minlength: 6
    },
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        validate: {
            validator: function(v) {
                // Remove all non-digit characters for validation
                const cleanPhone = v.replace(/[^\d+]/g, '');
                // Allow numbers with optional + at start, total length between 8 and 15 digits
                return /^[\+]?[0-9]{8,15}$/.test(cleanPhone);
            },
            message: 'رقم الهاتف غير صالح. يجب أن يكون بين 8 و 15 رقمًا'
        }
    },
    age: {
        type: Number,
        required: [true, 'العمر مطلوب'],
        min: 18,
        max: 100
    },
    clinicName: {
        type: String,
        required: [true, 'اسم العيادة مطلوب'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'العنوان مطلوب'],
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    subscriptionExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can add more patients (max 5 if not subscribed)
userSchema.methods.canAddPatient = async function(currentPatientCount) {
    if (this.role === 'admin') return true;
    if (this.isSubscribed) {
        if (this.subscriptionExpiry && new Date() > this.subscriptionExpiry) {
            this.isSubscribed = false;
            await this.save();
            return currentPatientCount < 5;
        }
        return true;
    }
    return currentPatientCount < 5;
};

module.exports = mongoose.model('User', userSchema);
