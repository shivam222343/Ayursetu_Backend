const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  categories: {
    treatment: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    facilities: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);