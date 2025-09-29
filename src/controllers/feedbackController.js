const Feedback = require('../models/feedbackModel');
const Appointment = require('../models/appointmentModel');

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { appointmentId, rating, comment, categories } = req.body;
    const patientId = req.user.id;

    // Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== patientId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'Can only provide feedback for completed appointments' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ appointmentId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this appointment' });
    }

    const feedback = new Feedback({
      appointmentId,
      patientId,
      practitionerId: appointment.practitionerId,
      rating,
      comment,
      categories
    });

    await feedback.save();
    
    // Mark appointment as feedback submitted
    await Appointment.findByIdAndUpdate(appointmentId, { feedbackSubmitted: true });
    
    await feedback.populate(['patientId', 'practitionerId', 'appointmentId']);

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get feedback for appointment
const getFeedbackByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const feedback = await Feedback.findOne({ appointmentId })
      .populate('patientId', 'name')
      .populate('practitionerId', 'name')
      .populate('appointmentId');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all feedback for a practitioner
const getPractitionerFeedback = async (req, res) => {
  try {
    const practitionerId = req.user.role === 'doctor' ? req.user.id : req.params.practitionerId;
    
    const feedback = await Feedback.find({ practitionerId })
      .populate('patientId', 'name')
      .populate('appointmentId', 'therapyId startTime')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByAppointment,
  getPractitionerFeedback
};