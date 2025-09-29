const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getPrescription,
  updatePrescription,
  updateMedicationStatus,
  addPatientNotes,
  getActiveMedications,
  getLifestylePrescriptions
} = require('../controllers/prescriptionController');

// Create new prescription (doctors only)
router.post('/', verifyToken, createPrescription);

// Get prescriptions for current patient
router.get('/patient', verifyToken, getPatientPrescriptions);

// Get prescriptions for specific patient (doctors/admins only)
router.get('/patient/:patientId', verifyToken, getPatientPrescriptions);

// Get prescriptions created by current doctor
router.get('/doctor', verifyToken, getDoctorPrescriptions);

// Get active medications for current patient
router.get('/medications/active', verifyToken, getActiveMedications);

// Get active medications for specific patient
router.get('/medications/active/:patientId', verifyToken, getActiveMedications);

// Get lifestyle prescriptions for current patient
router.get('/lifestyle', verifyToken, getLifestylePrescriptions);

// Get lifestyle prescriptions for specific patient
router.get('/lifestyle/:patientId', verifyToken, getLifestylePrescriptions);

// Get single prescription
router.get('/:id', verifyToken, getPrescription);

// Update prescription (doctors only)
router.put('/:id', verifyToken, updatePrescription);

// Update medication status (patients only)
router.patch('/:id/medication-status', verifyToken, updateMedicationStatus);

// Add patient notes
router.patch('/:id/notes', verifyToken, addPatientNotes);

module.exports = router;
