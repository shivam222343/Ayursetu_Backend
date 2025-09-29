const express = require('express');
const { submitFeedback, getFeedbackByAppointment, getPractitionerFeedback } = require('../controllers/feedbackController.js');
const verifyToken = require('../middleware/authMiddleware.js');

const router = express.Router();

// Submit feedback
router.post('/', verifyToken, submitFeedback);

// Get feedback by appointment ID
router.get('/appointment/:appointmentId', verifyToken, getFeedbackByAppointment);

// Get practitioner feedback (for current doctor)
router.get('/practitioner', verifyToken, getPractitionerFeedback);

module.exports = router;