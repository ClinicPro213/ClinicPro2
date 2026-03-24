const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Treatment = require('../models/Treatment');
const User = require('../models/User');
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
        console.error('Error getting patients:', error);
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
        console.error('Error getting patient:', error);
        res.status(500).json({ message: 'خطأ في جلب بيانات المريض', error: error.message });
    }
});

// Add new patient
router.post('/', protect, [
    body('name').notEmpty().withMessage('اسم المريض مطلوب'),
    body('phone').optional().isString().withMessage('رقم الهاتف يجب أن يكون نصاً'),
    body('age').isInt({ min: 0, max: 120 }).withMessage('العمر يجب أن يكون بين 0 و 120')
], async (req, res) => {
    try {
        console.log('📝 Adding new patient for user:', req.user.username);
        console.log('Patient data:', req.body);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                message: errors.array()[0].msg,
                errors: errors.array() 
            });
        }
        
        // Get fresh user data with current patient count
        const currentUser = await User.findById(req.user._id);
        const currentPatientCount = await Patient.countDocuments({ userId: req.user._id });
        
        console.log(`Current patient count: ${currentPatientCount}, User subscribed: ${currentUser.isSubscribed}`);
        
        // Check if user can add more patients
        let canAdd = false;
        if (currentUser.role === 'admin') {
            canAdd = true;
        } else if (currentUser.isSubscribed) {
            if (currentUser.subscriptionExpiry && new Date() > currentUser.subscriptionExpiry) {
                currentUser.isSubscribed = false;
                await currentUser.save();
                canAdd = currentPatientCount < 5;
            } else {
                canAdd = true;
            }
        } else {
            canAdd = currentPatientCount < 5;
        }
        
        if (!canAdd) {
            return res.status(403).json({ 
                message: 'لقد وصلت للحد الأقصى من المرضى المجانيين (5 مرضى). يرجى الاشتراك لإضافة المزيد من المرضى',
                needSubscription: true 
            });
        }
        
        // Create patient
        const patient = await Patient.create({
            name: req.body.name,
            phone: req.body.phone || '',
            age: parseInt(req.body.age),
            address: req.body.address || '',
            medicalHistory: req.body.medicalHistory || '',
            notes: req.body.notes || '',
            userId: req.user._id
        });
        
        console.log('✅ Patient created successfully:', patient._id);
        
        res.status(201).json({ 
            success: true, 
            patient: patient.toObject(),
            message: 'تم إضافة المريض بنجاح'
        });
    } catch (error) {
        console.error('Error adding patient:', error);
        res.status(500).json({ 
            message: 'خطأ في إضافة المريض', 
            error: error.message 
        });
    }
});

// Update patient
router.put('/:id', protect, [
    body('name').optional().notEmpty().withMessage('اسم المريض لا يمكن أن يكون فارغاً'),
    body('phone').optional().isString().withMessage('رقم الهاتف يجب أن يكون نصاً'),
    body('age').optional().isInt({ min: 0, max: 120 }).withMessage('العمر يجب أن يكون بين 0 و 120')
], async (req, res) => {
    try {
        console.log('📝 Updating patient:', req.params.id);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }
        
        const patient = await Patient.findOne({ _id: req.params.id, userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        // Update fields
        if (req.body.name) patient.name = req.body.name;
        if (req.body.phone !== undefined) patient.phone = req.body.phone;
        if (req.body.age) patient.age = parseInt(req.body.age);
        if (req.body.address !== undefined) patient.address = req.body.address;
        if (req.body.medicalHistory !== undefined) patient.medicalHistory = req.body.medicalHistory;
        if (req.body.notes !== undefined) patient.notes = req.body.notes;
        patient.updatedAt = Date.now();
        
        await patient.save();
        
        console.log('✅ Patient updated successfully');
        
        res.json({ 
            success: true, 
            patient: patient.toObject(),
            message: 'تم تحديث المريض بنجاح'
        });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'خطأ في تحديث المريض', error: error.message });
    }
});

// Delete patient
router.delete('/:id', protect, async (req, res) => {
    try {
        console.log('🗑️ Deleting patient:', req.params.id);
        
        const patient = await Patient.findOne({ _id: req.params.id, userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ message: 'المريض غير موجود' });
        }
        
        // Delete all treatments for this patient
        await Treatment.deleteMany({ patientId: req.params.id });
        
        // Delete patient
        await patient.deleteOne();
        
        console.log('✅ Patient and treatments deleted successfully');
        
        res.json({ 
            success: true, 
            message: 'تم حذف المريض وجميع معالجاته بنجاح' 
        });
    } catch (error) {
        console.error('Error deleting patient:', error);
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
                { phone: searchRegex }
            ]
        }).sort({ createdAt: -1 });
        
        res.json(patients);
    } catch (error) {
        console.error('Error searching patients:', error);
        res.status(500).json({ message: 'خطأ في البحث', error: error.message });
    }
});

module.exports = router;
