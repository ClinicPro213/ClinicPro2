const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Treatment = require('../models/Treatment');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');

// Get all treatments for a patient
router.get('/patient/:patientId', protect, async (req, res) => {
    try {
        // Verify patient belongs to user
        const patient = await Patient.findOne({ _id: req.params.patientId, userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        const treatments = await Treatment.find({ patientId: req.params.patientId }).sort({ treatmentDate: -1 });
        res.json(treatments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب المعالجات', error: error.message });
    }
});

// Add new treatment
router.post('/', protect, [
    body('patientId').notEmpty().withMessage('معرف المريض مطلوب'),
    body('toothNumber').isInt({ min: 1, max: 32 }).withMessage('رقم السن يجب أن يكون بين 1 و 32'),
    body('treatmentType').notEmpty().withMessage('نوع المعالجة مطلوب'),
    body('treatmentDate').optional().isISO8601().withMessage('تاريخ المعالجة غير صالح')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Verify patient belongs to user
        const patient = await Patient.findOne({ _id: req.body.patientId, userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        // Auto-set treatment date to now if not provided
        const treatmentData = {
            ...req.body,
            userId: req.user._id,
            treatmentDate: req.body.treatmentDate || new Date()
        };
        
        const treatment = await Treatment.create(treatmentData);
        
        res.status(201).json({ success: true, treatment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في إضافة المعالجة', error: error.message });
    }
});

// Update treatment
router.put('/:id', protect, [
    body('toothNumber').optional().isInt({ min: 1, max: 32 }).withMessage('رقم السن يجب أن يكون بين 1 و 32'),
    body('treatmentType').optional().notEmpty().withMessage('نوع المعالجة لا يمكن أن يكون فارغاً')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            return res.status(404).json({ message: 'المعالجة غير موجودة' });
        }
        
        // Verify patient belongs to user
        const patient = await Patient.findOne({ _id: treatment.patientId, userId: req.user._id });
        if (!patient) {
            return res.status(403).json({ message: 'غير مصرح لك بتعديل هذه المعالجة' });
        }
        
        const updatedTreatment = await Treatment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        res.json({ success: true, treatment: updatedTreatment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في تحديث المعالجة', error: error.message });
    }
});

// Delete treatment
router.delete('/:id', protect, async (req, res) => {
    try {
        const treatment = await Treatment.findById(req.params.id);
        if (!treatment) {
            return res.status(404).json({ message: 'المعالجة غير موجودة' });
        }
        
        // Verify patient belongs to user
        const patient = await Patient.findOne({ _id: treatment.patientId, userId: req.user._id });
        if (!patient) {
            return res.status(403).json({ message: 'غير مصرح لك بحذف هذه المعالجة' });
        }
        
        await treatment.deleteOne();
        
        res.json({ success: true, message: 'تم حذف المعالجة بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في حذف المعالجة', error: error.message });
    }
});

// Get treatment statistics
router.get('/stats/summary', protect, async (req, res) => {
    try {
        const treatments = await Treatment.find({ userId: req.user._id });
        
        const stats = {
            total: treatments.length,
            byType: {},
            totalCost: treatments.reduce((sum, t) => sum + (t.cost || 0), 0),
            recentTreatments: treatments.slice(0, 10)
        };
        
        treatments.forEach(t => {
            stats.byType[t.treatmentType] = (stats.byType[t.treatmentType] || 0) + 1;
        });
        
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب الإحصائيات', error: error.message });
    }
});

module.exports = router;