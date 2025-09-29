const express = require('express');
const router = express.Router();
const {
  getDoctorAvailability,
  updateDoctorAvailability,
  getAvailableSlots,
  addSpecialDate
} = require('../controllers/doctorAvailabilityController');
const authMiddleware = require('../middleware/authMIddleware');

// Get doctor's availability schedule (public)
router.get('/:doctorId', getDoctorAvailability);

// Get available slots for a specific date (public)
router.get('/:doctorId/slots/:date', getAvailableSlots);

// Update doctor's availability (protected route)
router.put('/:doctorId', authMiddleware, updateDoctorAvailability);

// Add special date (holiday/leave)
router.post('/:doctorId/special-date', authMiddleware, addSpecialDate);

module.exports = router;