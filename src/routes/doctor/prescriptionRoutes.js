const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const {
  getPatientsWithAppointments,
  getPrescriptionsByDoctor,
  createPrescription,
  getPatientById,
  updatePrescriptionStatus
} = require('../../controllers/doctorPrescriptionController');

// All routes require authentication and doctor role
router.use(verifyToken);

// GET /api/doctor/patients-with-appointments
// Get all patients who have had appointments with this doctor
router.get('/patients-with-appointments', getPatientsWithAppointments);

// GET /api/doctor/prescriptions
// Get all prescriptions created by this doctor
router.get('/prescriptions', getPrescriptionsByDoctor);

// POST /api/doctor/prescriptions
// Create a new prescription
router.post('/prescriptions', createPrescription);

// GET /api/doctor/patients/:patientId
// Get patient details by ID (only for patients with appointments)
router.get('/patients/:patientId', getPatientById);

// PUT /api/doctor/prescriptions/:prescriptionId/status
// Update prescription status
router.put('/prescriptions/:prescriptionId/status', updatePrescriptionStatus);

module.exports = router;
