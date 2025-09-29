const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // Format: "09:00"
  endTime: { type: String, required: true },   // Format: "10:00"
  isAvailable: { type: Boolean, default: true }
});

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6 // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timeSlots: [timeSlotSchema],
  // Special dates (holidays, leaves, etc.)
  specialDates: [{
    date: { type: Date, required: true },
    isAvailable: { type: Boolean, default: false },
    reason: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique availability per doctor per day
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('DoctorAvailability', availabilitySchema);