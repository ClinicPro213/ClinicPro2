const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Treatment = require('../models/Treatment');
const { protect } = require('../middleware/auth');

// Get all patients for logged in user
router.get('/', protect, async (req, res) => {
    try {
        const patients = await Patient.find({ userId: req.user._id }).sort({ createdAt: -1 });
        
        // Get treatment count for each patient
        const patientsWithTreatments = await Promise.all(patients.map(async (patient) => {
            const treatmentCount = await Treatment.countDocuments({ patientId: patient._id });
            const lastTreatment = await Treatment.findOne({ patientId: patient._id }).sort({ treatmentDate: -1 });
            return {
                ...patient.toObject(),
                treatmentCount,
                lastTreatmentDate: lastTreatment ? lastTreatment.treatmentDate : null
            };
        }));
        
        res.json(patientsWithTreatments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب المرضى', error: error.message });
    }
});

// Get single patient with treatments
router.get('/:id', protect, async (req, res) => {
    try {
        const patient = await Patient.findOne({ _id: req.params.id, userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        const treatments = await Treatment.find({ patientId: patient._id }).sort({ treatmentDate: -1 });
        
        res.json({ patient, treatments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المريض', error: error.message });
    }
});

// Add new patient
router.post('/', protect, [
    body('name').notEmpty().withMessage('اسم المريض مطلوب'),
    body('phone').matches(/^[0-9]{10,15}$/).withMessage('رقم الهاتف غير صالح'),
    body('age').isInt({ min: 0, max: 120 }).withMessage('العمر يجب أن يكون بين 0 و 120')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // Check if user can add more patients
        const currentPatientCount = await Patient.countDocuments({ userId: req.user._id });
        const canAdd = await req.user.canAddPatient(currentPatientCount);
        
        if (!canAdd) {
            return res.status(403).json({ 
                message: 'لقد وصلت للحد الأقصى من المرضى المجانيين (5 مرضى). يرجى الاشتراك لإضافة المزيد من المرضى',
                needSubscription: true 
            });
        }
        
        const patient = await Patient.create({
            ...req.body,
            userId: req.user._id
        });
        
        res.status(201).json({ success: true, patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في إضافة المريض', error: error.message });
    }
});

// Update patient
router.put('/:id', protect, [
    body('name').optional().notEmpty().withMessage('اسم المريض لا يمكن أن يكون فارغاً'),
    body('phone').optional().matches(/^[0-9]{10,15}$/).withMessage('رقم الهاتف غير صالح'),
    body('age').optional().isInt({ min: 0, max: 120 }).withMessage('العمر يجب أن يكون بين 0 و 120')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        res.json({ success: true, patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في تحديث المريض', error: error.message });
    }
});

// Delete patient
router.delete('/:id', protect, async (req, res) => {
    try {
        // Delete all treatments for this patient first
        await Treatment.deleteMany({ patientId: req.params.id });
        
        const patient = await Patient.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        res.json({ success: true, message: 'تم حذف المريض وجميع معالجاته بنجاح' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في حذف المريض', error: error.message });
    }
});

// Search patients
router.get('/search/:query', protect, async (req, res) => {
    try {
        const searchRegex = new RegExp(req.params.query, 'i');
        const patients = await Patient.find({
            userId: req.user._id,
            $or: [
                { name: searchRegex },
                { phone: searchRegex },
                { address: searchRegex }
            ]
        }).sort({ createdAt: -1 });
        
        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'خطأ في البحث', error: error.message });
    }
});

module.exports = router;