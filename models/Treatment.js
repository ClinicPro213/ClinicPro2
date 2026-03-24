const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toothNumber: {
        type: Number,
        required: [true, 'رقم السن مطلوب'],
        min: 1,
        max: 32,
        validate: {
            validator: function(v) {
                return v >= 1 && v <= 32;
            },
            message: 'رقم السن يجب أن يكون بين 1 و 32'
        }
    },
    treatmentType: {
        type: String,
        required: [true, 'نوع المعالجة مطلوب'],
        enum: ['حشو', 'خلع', 'تنظيف', 'تلبيس', 'زراعة', 'تقويم', 'تبييض', 'علاج عصب', 'أخرى'],
        default: 'أخرى'
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    cost: {
        type: Number,
        default: 0,
        min: 0
    },
    treatmentDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
treatmentSchema.index({ patientId: 1, treatmentDate: -1 });

module.exports = mongoose.model('Treatment', treatmentSchema);