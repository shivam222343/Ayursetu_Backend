const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId; } },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    required: true,
  },
  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String },
  picture: { type: String },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  
  // Profile Information
  profile: {
    // Basic Information
    fullName: { type: String },
    phone: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    height: { type: String },
    weight: { type: String },
    
    // Contact Information
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    emergencyContact: { type: String },
    emergencyPhone: { type: String },
    
    // Ayurvedic Profile (mainly for patients)
    prakriti: { type: String },
    vikriti: { type: String },
    agni: { type: String },
    koshtha: { type: String },
    satva: { type: String },
    
    // Medical History
    allergies: { type: String },
    chronicConditions: { type: String },
    currentMedications: { type: String },
    
    // Professional Info (for doctors)
    specialization: { type: String },
    experience: { type: Number },
    qualification: { type: String },
    licenseNumber: { type: String },
    clinicAddress: { type: String },
    consultationFee: { type: Number },
    
    // Lifestyle
    diet: { type: String },
    sleepPattern: { type: String },
    exercise: { type: String },
    
    // Additional Notes
    notes: { type: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
