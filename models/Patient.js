const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'اسم المريض مطلوب'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'رقم الهاتف مطلوب'],
        match: [/^[0-9]{10,15}$/, 'رقم الهاتف غير صالح']
    },
    age: {
        type: Number,
        required: [true, 'العمر مطلوب'],
        min: 0,
        max: 120
    },
    address: {
        type: String,
        trim: true
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

patientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Patient', patientSchema);