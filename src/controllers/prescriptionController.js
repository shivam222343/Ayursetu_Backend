const Prescription = require('../models/prescriptionModel');
const User = require('../models/userModel');

// Create new prescription
const createPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, medications, lifestyle, generalInstructions, followUpDate, appointmentId } = req.body;

    // Verify doctor role
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create prescriptions' });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescription = new Prescription({
      patientId,
      doctorId,
      appointmentId,
      medications: medications || [],
      lifestyle: lifestyle || {},
      generalInstructions,
      followUpDate
    });

    await prescription.save();
    await prescription.populate(['patientId', 'doctorId'], 'name email');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
};

// Get prescriptions for patient
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { patientId };
    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'startTime')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

// Get prescriptions created by doctor
const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, patientId, limit = 10, page = 1 } = req.query;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { doctorId };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email dateOfBirth')
      .populate('appointmentId', 'startTime')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

// Get single prescription
const getPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email dateOfBirth')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'startTime');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Check access permissions
    if (userRole === 'patient' && prescription.patientId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (userRole === 'doctor' && prescription.doctorId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Failed to fetch prescription' });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const updates = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can update prescriptions' });
    }

    const prescription = await Prescription.findOne({ _id: id, doctorId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or access denied' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'patientId' && key !== 'doctorId') {
        prescription[key] = updates[key];
      }
    });

    await prescription.save();
    await prescription.populate(['patientId', 'doctorId'], 'name email');

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ message: 'Failed to update prescription' });
  }
};

// Update medication status (for patients)
const updateMedicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicationIndex, status } = req.body;
    const patientId = req.user.id;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update medication status' });
    }

    const prescription = await Prescription.findOne({ _id: id, patientId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (medicationIndex >= 0 && medicationIndex < prescription.medications.length) {
      prescription.medications[medicationIndex].status = status;
      await prescription.save();
    }

    res.json({
      message: 'Medication status updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating medication status:', error);
    res.status(500).json({ message: 'Failed to update medication status' });
  }
};

// Add patient notes
const addPatientNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const patientId = req.user.id;

    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add notes' });
    }

    const prescription = await Prescription.findOne({ _id: id, patientId });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.patientNotes = notes;
    await prescription.save();

    res.json({
      message: 'Notes added successfully',
      prescription
    });
  } catch (error) {
    console.error('Error adding patient notes:', error);
    res.status(500).json({ message: 'Failed to add notes' });
  }
};

// Get active medications for patient
const getActiveMedications = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;

    const prescriptions = await Prescription.find({
      patientId,
      status: 'active',
      'medications.status': 'active'
    }).populate('doctorId', 'name specialization');

    // Extract active medications
    const activeMedications = [];
    prescriptions.forEach(prescription => {
      prescription.medications.forEach(medication => {
        if (medication.status === 'active' && new Date(medication.duration.end) > new Date()) {
          activeMedications.push({
            ...medication.toObject(),
            prescriptionId: prescription._id,
            prescriptionNumber: prescription.prescriptionNumber,
            doctor: prescription.doctorId.name,
            prescriptionDate: prescription.date
          });
        }
      });
    });

    res.json(activeMedications);
  } catch (error) {
    console.error('Error fetching active medications:', error);
    res.status(500).json({ message: 'Failed to fetch active medications' });
  }
};

// Get lifestyle prescriptions
const getLifestylePrescriptions = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;

    const prescriptions = await Prescription.find({
      patientId,
      status: 'active'
    }).populate('doctorId', 'name specialization')
      .sort({ date: -1 });

    // Extract lifestyle recommendations
    const lifestyleRecommendations = {
      diet: [],
      exercise: [],
      yoga: [],
      meditation: [],
      sleep: []
    };

    prescriptions.forEach(prescription => {
      if (prescription.lifestyle) {
        Object.keys(lifestyleRecommendations).forEach(key => {
          if (prescription.lifestyle[key]) {
            if (Array.isArray(prescription.lifestyle[key])) {
              lifestyleRecommendations[key].push(...prescription.lifestyle[key].map(item => ({
                ...item,
                prescriptionId: prescription._id,
                doctor: prescription.doctorId.name,
                date: prescription.date
              })));
            } else {
              lifestyleRecommendations[key].push({
                ...prescription.lifestyle[key],
                prescriptionId: prescription._id,
                doctor: prescription.doctorId.name,
                date: prescription.date
              });
            }
          }
        });
      }
    });

    res.json(lifestyleRecommendations);
  } catch (error) {
    console.error('Error fetching lifestyle prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch lifestyle prescriptions' });
  }
};

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getDoctorPrescriptions,
  getPrescription,
  updatePrescription,
  updateMedicationStatus,
  addPatientNotes,
  getActiveMedications,
  getLifestylePrescriptions
};
