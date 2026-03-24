const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'اسم المريض مطلوب'],
        trim: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'العمر مطلوب'],
        min: 0,
        max: 120
    },
    address: {
        type: String,
        default: '',
        trim: true
    },
    medicalHistory: {
        type: String,
        default: ''
    },
    notes: {
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
