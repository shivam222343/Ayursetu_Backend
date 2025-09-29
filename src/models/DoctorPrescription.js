const mongoose = require('mongoose');

const doctorPrescriptionSchema = new mongoose.Schema({
  // Doctor who created the prescription
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Patient receiving the prescription
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Prescription details (text format for simplicity)
  details: {
    type: String,
    required: true,
    trim: true
  },
  
  // Date of prescription
  date: {
    type: Date,
    default: Date.now
  },
  
  // Status of prescription
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Additional notes (optional)
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Indexes for better performance
doctorPrescriptionSchema.index({ doctor: 1, date: -1 });
doctorPrescriptionSchema.index({ patient: 1, date: -1 });
doctorPrescriptionSchema.index({ status: 1 });

// Virtual for prescription ID display
doctorPrescriptionSchema.virtual('prescriptionId').get(function() {
  return `RX${this._id.toString().slice(-6).toUpperCase()}`;
});

// Ensure virtual fields are serialized
doctorPrescriptionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('DoctorPrescription', doctorPrescriptionSchema);
