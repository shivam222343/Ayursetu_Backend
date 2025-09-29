const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  
  // Prescription details
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  
  // Medications
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    timing: {
      type: String, // e.g., "Before meals", "After meals", "With food"
    },
    duration: {
      start: {
        type: Date,
        default: Date.now
      },
      end: {
        type: Date,
        required: true
      }
    },
    instructions: {
      type: String
    },
    category: {
      type: String,
      enum: ['Ayurvedic Medicine', 'Allopathic Medicine', 'Supplement', 'Herbal'],
      default: 'Ayurvedic Medicine'
    },
    type: {
      type: String, // e.g., "Tablet", "Capsule", "Syrup", "Powder", "Oil"
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'discontinued', 'paused'],
      default: 'active'
    }
  }],
  
  // Lifestyle prescriptions
  lifestyle: {
    diet: [{
      recommendation: String,
      duration: String,
      notes: String
    }],
    exercise: [{
      type: String,
      duration: String,
      frequency: String,
      instructions: String
    }],
    yoga: [{
      asana: String,
      duration: String,
      frequency: String,
      benefits: String
    }],
    meditation: [{
      type: String,
      duration: String,
      frequency: String,
      instructions: String
    }],
    sleep: {
      bedtime: String,
      wakeTime: String,
      duration: String,
      recommendations: [String]
    }
  },
  
  // General instructions
  generalInstructions: {
    type: String
  },
  followUpDate: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  
  // Notes
  doctorNotes: {
    type: String
  },
  patientNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate prescription number
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionNumber = `RX${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
prescriptionSchema.index({ patientId: 1, date: -1 });
prescriptionSchema.index({ doctorId: 1, date: -1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
