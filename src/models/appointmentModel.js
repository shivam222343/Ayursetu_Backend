const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  therapyId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'completed', 'cancelled'],
    default: 'requested'
  },
  notes: {
    type: String,
    default: ''
  },
  prescription: {
    type: String,
    default: ''
  },
  emailReminders: {
    acceptanceEmailSent: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
    reminder4hSent: { type: Boolean, default: false },
    postCareEmailSent: { type: Boolean, default: false }
  },
  feedbackSubmitted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Unique index to prevent double booking
appointmentSchema.index({ practitionerId: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);