const DoctorPrescription = require('../models/DoctorPrescription');
const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');

// Get patients with appointments for this doctor
const getPatientsWithAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access this endpoint.' });
    }

    // Find all appointments for this doctor and get unique patients
    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name email dateOfBirth gender')
      .sort({ startTime: -1 });

    // Group appointments by patient and get patient info with appointment count
    const patientMap = new Map();
    
    appointments.forEach(appointment => {
      const patientId = appointment.patientId._id.toString();
      
      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          id: patientId,
          name: appointment.patientId.name,
          email: appointment.patientId.email,
          age: appointment.patientId.dateOfBirth ? 
            Math.floor((new Date() - new Date(appointment.patientId.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
            null,
          gender: appointment.patientId.gender,
          lastAppointmentDate: appointment.startTime,
          appointmentCount: 1,
          status: appointment.status === 'completed' ? 'active' : appointment.status
        });
      } else {
        const patient = patientMap.get(patientId);
        patient.appointmentCount += 1;
        // Keep the most recent appointment date
        if (new Date(appointment.startTime) > new Date(patient.lastAppointmentDate)) {
          patient.lastAppointmentDate = appointment.startTime;
        }
      }
    });

    // Convert map to array
    const patientsWithAppointments = Array.from(patientMap.values());

    res.json(patientsWithAppointments);
  } catch (error) {
    console.error('Error fetching patients with appointments:', error);
    res.status(500).json({ message: 'Failed to fetch patients with appointments' });
  }
};

// Get prescriptions created by this doctor
const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;
    
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access this endpoint.' });
    }

    // Build query
    const query = { doctor: doctorId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get prescriptions with pagination
    const prescriptions = await DoctorPrescription.find(query)
      .populate('patient', 'name email')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await DoctorPrescription.countDocuments(query);

    // Format response
    const formattedPrescriptions = prescriptions.map(prescription => ({
      id: prescription._id,
      patientName: prescription.patient.name,
      patientId: prescription.patient._id,
      prescriptionText: prescription.details,
      date: prescription.date,
      status: prescription.status,
      prescriptionId: prescription.prescriptionId
    }));

    res.json({
      prescriptions: formattedPrescriptions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

// Create new prescription
const createPrescription = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, prescriptionText, date } = req.body;
    
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can create prescriptions.' });
    }

    // Validate required fields
    if (!patientId || !prescriptionText) {
      return res.status(400).json({ message: 'Patient ID and prescription details are required' });
    }

    // Verify patient exists and is a patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create prescription
    const prescription = new DoctorPrescription({
      doctor: doctorId,
      patient: patientId,
      details: prescriptionText,
      date: date ? new Date(date) : new Date()
    });

    await prescription.save();

    // Populate patient and doctor info for response
    await prescription.populate('patient', 'name email');
    await prescription.populate('doctor', 'name');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: {
        id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        patientName: prescription.patient.name,
        doctorName: prescription.doctor.name,
        details: prescription.details,
        date: prescription.date,
        status: prescription.status
      }
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
};

// Get patient details by ID (for doctors)
const getPatientById = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId } = req.params;
    
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can access patient details.' });
    }

    // Verify doctor has had appointments with this patient
    const hasAppointment = await Appointment.findOne({ 
      doctorId, 
      patientId 
    });

    if (!hasAppointment) {
      return res.status(403).json({ message: 'Access denied. You can only view patients you have appointments with.' });
    }

    // Get patient details
    const patient = await User.findById(patientId).select('name email dateOfBirth gender phone address');
    
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get last appointment date
    const lastAppointment = await Appointment.findOne({ 
      doctorId, 
      patientId 
    }).sort({ startTime: -1 });

    // Calculate age if date of birth is available
    const age = patient.dateOfBirth ? 
      Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
      null;

    res.json({
      id: patient._id,
      name: patient.name,
      email: patient.email,
      age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      lastAppointmentDate: lastAppointment ? lastAppointment.startTime : null
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ message: 'Failed to fetch patient details' });
  }
};

// Update prescription status
const updatePrescriptionStatus = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { prescriptionId } = req.params;
    const { status } = req.body;
    
    // Verify user is a doctor
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can update prescriptions.' });
    }

    // Validate status
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find and update prescription
    const prescription = await DoctorPrescription.findOneAndUpdate(
      { _id: prescriptionId, doctor: doctorId },
      { status },
      { new: true }
    ).populate('patient', 'name email');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Prescription status updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription status:', error);
    res.status(500).json({ message: 'Failed to update prescription status' });
  }
};

module.exports = {
  getPatientsWithAppointments,
  getPrescriptionsByDoctor,
  createPrescription,
  getPatientById,
  updatePrescriptionStatus
};
