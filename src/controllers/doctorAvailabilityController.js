const DoctorAvailability = require('../models/doctorAvailabilityModel');
const User = require('../models/userModel');

// Get doctor's availability
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const availability = await DoctorAvailability.find({ doctorId })
      .populate('doctorId', 'name profile.fullName profile.specialization')
      .sort({ dayOfWeek: 1 });
    
    res.json(availability);
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
};

// Update doctor's availability
const updateDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { dayOfWeek, isAvailable, timeSlots } = req.body;
    
    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctorId, dayOfWeek },
      { isAvailable, timeSlots },
      { upsert: true, new: true }
    );
    
    res.json(availability);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Failed to update availability' });
  }
};

// Get available slots for a specific doctor and date
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    // Get doctor's availability for the day
    const availability = await DoctorAvailability.findOne({ doctorId, dayOfWeek });
    
    if (!availability || !availability.isAvailable) {
      return res.json({ availableSlots: [] });
    }
    
    // Check for special dates (holidays, leaves)
    const specialDate = availability.specialDates.find(
      special => special.date.toDateString() === requestedDate.toDateString()
    );
    
    if (specialDate && !specialDate.isAvailable) {
      return res.json({ availableSlots: [], reason: specialDate.reason });
    }
    
    // Get existing appointments for the date
    const Appointment = require('../models/appointmentModel');
    const existingAppointments = await Appointment.find({
      practitionerId: doctorId,
      startTime: {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
      },
      status: { $in: ['requested', 'accepted'] }
    });
    
    // Filter available slots
    const bookedSlots = existingAppointments.map(apt => 
      apt.startTime.toTimeString().slice(0, 5)
    );
    
    const availableSlots = availability.timeSlots.filter(slot => 
      slot.isAvailable && !bookedSlots.includes(slot.startTime)
    );
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
};

// Add special date (holiday/leave)
const addSpecialDate = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, isAvailable, reason } = req.body;
    
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();
    
    let availability = await DoctorAvailability.findOne({ doctorId, dayOfWeek });
    
    // Create availability record if it doesn't exist
    if (!availability) {
      const defaultTimeSlots = [
        { startTime: '09:00', endTime: '10:00', isAvailable: true },
        { startTime: '10:00', endTime: '11:00', isAvailable: true },
        { startTime: '11:00', endTime: '12:00', isAvailable: true },
        { startTime: '14:00', endTime: '15:00', isAvailable: true },
        { startTime: '15:00', endTime: '16:00', isAvailable: true },
        { startTime: '16:00', endTime: '17:00', isAvailable: true }
      ];
      
      availability = new DoctorAvailability({
        doctorId,
        dayOfWeek,
        isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
        timeSlots: defaultTimeSlots,
        specialDates: []
      });
    }
    
    // Remove existing special date if any
    availability.specialDates = availability.specialDates.filter(
      special => special.date.toDateString() !== requestedDate.toDateString()
    );
    
    // Add new special date
    availability.specialDates.push({ date: requestedDate, isAvailable, reason });
    
    await availability.save();
    
    res.json(availability);
  } catch (error) {
    console.error('Error adding special date:', error);
    res.status(500).json({ message: 'Failed to add special date' });
  }
};

module.exports = {
  getDoctorAvailability,
  updateDoctorAvailability,
  getAvailableSlots,
  addSpecialDate
};