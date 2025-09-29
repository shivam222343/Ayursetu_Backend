const mongoose = require('mongoose');

const vitalSignsSchema = new mongoose.Schema({
  bloodPressure: {
    systolic: { type: Number },
    diastolic: { type: Number }
  },
  heartRate: { type: Number },
  temperature: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  bmi: { type: Number },
  oxygenSaturation: { type: Number },
  recordedAt: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  purpose: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'completed', 'discontinued'], default: 'active' },
  notes: { type: String }
});

const allergySchema = new mongoose.Schema({
  allergen: { type: String, required: true },
  type: { type: String, enum: ['Food', 'Environmental', 'Medication', 'Other'], required: true },
  reaction: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
  diagnosedDate: { type: Date },
  notes: { type: String }
});

const conditionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  diagnosedDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'resolved', 'chronic'], default: 'active' },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
  diagnosedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  treatmentPlan: { type: String }
});

const therapySessionSchema = new mongoose.Schema({
  therapyType: { type: String, required: true },
  sessionDate: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  practitioner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String },
  progress: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  painLevel: { type: Number, min: 0, max: 10 },
  energyLevel: { type: Number, min: 0, max: 10 },
  feedback: { type: String },
  nextSession: { type: Date },
  exercises: [{ type: String }],
  goals: [{ type: String }],
  hasBefore: { type: Boolean, default: false },
  hasAfter: { type: Boolean, default: false }
});

const labResultSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  testDate: { type: Date, required: true },
  results: [{
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String },
    referenceRange: { type: String },
    status: { type: String, enum: ['normal', 'abnormal', 'critical'] }
  }],
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labName: { type: String },
  notes: { type: String }
});

const medicalRecordSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // Basic Health Information
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  
  // Medical History
  conditions: [conditionSchema],
  allergies: [allergySchema],
  medications: [medicationSchema],
  
  // Vital Signs History
  vitalSigns: [vitalSignsSchema],
  
  // Therapy & Treatment
  therapySessions: [therapySessionSchema],
  
  // Lab Results
  labResults: [labResultSchema],
  
  // Family History
  familyHistory: [{
    relation: { type: String, required: true },
    condition: { type: String, required: true },
    ageOfOnset: { type: Number },
    notes: { type: String }
  }],
  
  // Lifestyle Information
  lifestyle: {
    smokingStatus: { type: String, enum: ['never', 'former', 'current'] },
    smoking: { type: String },
    alcoholConsumption: { type: String, enum: ['none', 'occasional', 'moderate', 'heavy'] },
    alcohol: { type: String },
    exerciseFrequency: { type: String, enum: ['none', 'rarely', 'weekly', 'daily'] },
    exercise: { type: String },
    dietType: { type: String, enum: ['omnivore', 'vegetarian', 'vegan', 'other'] },
    diet: { type: String },
    sleepHours: { type: Number },
    sleep: { type: String },
    stressLevel: { type: String, enum: ['low', 'moderate', 'high'] },
    stress: { type: String }
  },
  
  // Insurance Information
  insurance: {
    provider: { type: String },
    policyNumber: { type: String },
    groupNumber: { type: String },
    expiryDate: { type: Date }
  },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes for better performance
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ 'therapySessions.sessionDate': -1 });
medicalRecordSchema.index({ 'vitalSigns.recordedAt': -1 });
medicalRecordSchema.index({ 'labResults.testDate': -1 });

// Virtual for latest vital signs
medicalRecordSchema.virtual('latestVitalSigns').get(function() {
  if (this.vitalSigns && this.vitalSigns.length > 0) {
    return this.vitalSigns.sort((a, b) => b.recordedAt - a.recordedAt)[0];
  }
  return null;
});

// Virtual for active medications
medicalRecordSchema.virtual('activeMedications').get(function() {
  return this.medications.filter(med => med.status === 'active');
});

// Virtual for active conditions
medicalRecordSchema.virtual('activeConditions').get(function() {
  return this.conditions.filter(condition => condition.status === 'active');
});

medicalRecordSchema.set('toJSON', { virtuals: true });
medicalRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);