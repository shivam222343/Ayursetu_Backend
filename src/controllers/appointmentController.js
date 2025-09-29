const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const { createNotification } = require('./notificationController');
const { sendAcceptanceEmail } = require('../services/emailService');

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const { practitionerId, therapyId, startTime, duration = 60, notes } = req.body;
    const patientId = req.user.id;

    if (!practitionerId || !therapyId || !startTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000); // duration in minutes

    // Validate that appointment is not in the past
    if (start < new Date()) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    // Check for conflicts
    const conflict = await Appointment.findOne({
      practitionerId,
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } }
      ],
      status: { $in: ['requested', 'accepted'] }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Slot unavailable' });
    }

    const appointment = new Appointment({
      patientId,
      practitionerId,
      therapyId,
      startTime: start,
      endTime: end,
      notes: notes || ''
    });

    await appointment.save();
    await appointment.populate(['patientId', 'practitionerId']);

    // Create notification for doctor
    await createNotification(
      practitionerId,
      'appointment_request',
      'New Appointment Request',
      `${appointment.patientId.name} has requested an appointment for ${therapyId}`,
      appointment._id
    );

    // Send booking confirmation email to patient
    try {
      const { sendAcceptanceEmailNodemailer } = require('../services/nodemailerService');
      await sendAcceptanceEmailNodemailer(appointment, appointment.patientId, appointment.practitionerId);
      console.log('Booking confirmation email sent to patient');
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
    }

    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Slot unavailable' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get appointments
const getAppointments = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.practitionerId = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email profile')
      .populate('practitionerId', 'name email profile')
      .sort({ startTime: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, startTime, endTime, notes } = req.body;

    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If time is being changed, check for conflicts
    if (startTime || endTime) {
      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const newStart = startTime ? new Date(startTime) : appointment.startTime;
      const newEnd = endTime ? new Date(endTime) : appointment.endTime;

      const conflict = await Appointment.findOne({
        _id: { $ne: id },
        practitionerId: appointment.practitionerId,
        $or: [
          { startTime: { $lt: newEnd }, endTime: { $gt: newStart } }
        ],
        status: { $in: ['requested', 'accepted'] }
      });

      if (conflict) {
        return res.status(409).json({ message: 'Slot unavailable' });
      }

      updateData.startTime = newStart;
      updateData.endTime = newEnd;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate(['patientId', 'practitionerId']);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Create notification and send email for patient when status changes
    if (status && status !== 'requested') {
      const notificationTypes = {
        accepted: 'appointment_accepted',
        cancelled: 'appointment_cancelled',
        completed: 'appointment_completed'
      };
      
      const messages = {
        accepted: `Your appointment with Dr. ${appointment.practitionerId.name} has been accepted`,
        cancelled: `Your appointment with Dr. ${appointment.practitionerId.name} has been cancelled`,
        completed: `Your appointment with Dr. ${appointment.practitionerId.name} has been completed`
      };

      await createNotification(
        appointment.patientId._id,
        notificationTypes[status],
        `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        messages[status],
        appointment._id
      );

      // Send acceptance email when appointment is accepted
      if (status === 'accepted') {
        try {
          await sendAcceptanceEmail(appointment, appointment.patientId, appointment.practitionerId);
          await Appointment.findByIdAndUpdate(id, {
            'emailReminders.acceptanceEmailSent': true
          });
        } catch (emailError) {
          console.error('Failed to send acceptance email:', emailError);
        }
      }
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get practitioners
const getPractitioners = async (req, res) => {
  try {
    const practitioners = await User.find(
      { role: 'doctor' },
      'name email profile.specialization profile.experience profile.availability'
    );
    res.json(practitioners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get therapy types
const getTherapyTypes = async (req, res) => {
  try {
    const therapyTypes = [
      {
        id: 'vamana',
        name: 'Vamana (Therapeutic Vomiting)',
        description: 'Eliminates excess Kapha dosha through controlled vomiting',
        duration: 120,
        category: 'Panchakarma'
      },
      {
        id: 'virechana',
        name: 'Virechana (Purgation)',
        description: 'Eliminates excess Pitta dosha through controlled purgation',
        duration: 90,
        category: 'Panchakarma'
      },
      {
        id: 'basti',
        name: 'Basti (Medicated Enema)',
        description: 'Eliminates excess Vata dosha through medicated enemas',
        duration: 60,
        category: 'Panchakarma'
      },
      {
        id: 'nasya',
        name: 'Nasya (Nasal Treatment)',
        description: 'Administration of medicines through nasal passages',
        duration: 45,
        category: 'Panchakarma'
      },
      {
        id: 'raktamokshana',
        name: 'Raktamokshana (Blood Purification)',
        description: 'Purification of blood through various methods',
        duration: 75,
        category: 'Panchakarma'
      },
      {
        id: 'abhyanga',
        name: 'Abhyanga (Full Body Massage)',
        description: 'Therapeutic full body oil massage',
        duration: 60,
        category: 'Therapy'
      },
      {
        id: 'shirodhara',
        name: 'Shirodhara (Oil Pouring)',
        description: 'Continuous pouring of warm oil on forehead',
        duration: 45,
        category: 'Therapy'
      },
      {
        id: 'swedana',
        name: 'Swedana (Steam Therapy)',
        description: 'Herbal steam therapy for detoxification',
        duration: 30,
        category: 'Therapy'
      },
      {
        id: 'consultation',
        name: 'Ayurvedic Consultation',
        description: 'Initial consultation and diagnosis',
        duration: 30,
        category: 'Consultation'
      },
      {
        id: 'follow-up',
        name: 'Follow-up Consultation',
        description: 'Follow-up consultation and treatment review',
        duration: 20,
        category: 'Consultation'
      }
    ];
    
    res.json(therapyTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin analytics
const getAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [statusStats, therapyStats, dailyStats] = await Promise.all([
      // Appointments by status
      Appointment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Appointments by therapy
      Appointment.aggregate([
        { $group: { _id: '$therapyId', count: { $sum: 1 } } }
      ]),
      
      // Daily appointments (last 7 days)
      Appointment.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      statusStats,
      therapyStats,
      dailyStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload prescription for appointment
const uploadPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { prescription } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can upload prescriptions' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { prescription },
      { new: true }
    ).populate(['patientId', 'practitionerId']);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Prescription uploaded successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  getPractitioners,
  getTherapyTypes,
  getAnalytics,
  uploadPrescription
};