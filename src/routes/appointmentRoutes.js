const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  getPractitioners,
  getTherapyTypes,
  getAnalytics,
  uploadPrescription
} = require('../controllers/appointmentController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Appointment routes
router.post('/appointments', createAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);

// Practitioners route
router.get('/practitioners', getPractitioners);

// Therapy types route
router.get('/therapy-types', getTherapyTypes);

// Admin analytics
router.get('/admin/analytics', getAnalytics);

// Upload prescription
router.put('/appointments/:id/prescription', uploadPrescription);

module.exports = router;