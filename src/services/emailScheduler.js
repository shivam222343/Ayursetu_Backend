const cron = require('node-cron');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const { sendReminderEmail } = require('./emailService');

const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find appointments for 24h reminder
    const appointments24h = await Appointment.find({
      startTime: {
        $gte: twentyFourHoursLater,
        $lt: new Date(twentyFourHoursLater.getTime() + 60 * 60 * 1000)
      },
      status: 'accepted',
      'emailReminders.reminder24hSent': false
    }).populate('patientId practitionerId');

    // Find appointments for 4h reminder
    const appointments4h = await Appointment.find({
      startTime: {
        $gte: fourHoursLater,
        $lt: new Date(fourHoursLater.getTime() + 60 * 60 * 1000)
      },
      status: 'accepted',
      'emailReminders.reminder4hSent': false
    }).populate('patientId practitionerId');

    // Find appointments for post-care reminder
    const appointmentsPost = await Appointment.find({
      startTime: {
        $gte: twentyFourHoursAgo,
        $lt: new Date(twentyFourHoursAgo.getTime() + 60 * 60 * 1000)
      },
      status: { $in: ['completed', 'accepted'] },
      'emailReminders.postCareEmailSent': false
    }).populate('patientId practitionerId');

    // Send 24h reminders
    for (const appointment of appointments24h) {
      try {
        await sendReminderEmail(appointment, appointment.patientId, appointment.practitionerId, false);
        await Appointment.findByIdAndUpdate(appointment._id, {
          'emailReminders.reminder24hSent': true
        });
        console.log(`24h reminder sent for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`Failed to send 24h reminder for appointment ${appointment._id}:`, error);
      }
    }

    // Send 4h reminders
    for (const appointment of appointments4h) {
      try {
        await sendReminderEmail(appointment, appointment.patientId, appointment.practitionerId, false);
        await Appointment.findByIdAndUpdate(appointment._id, {
          'emailReminders.reminder4hSent': true
        });
        console.log(`4h reminder sent for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`Failed to send 4h reminder for appointment ${appointment._id}:`, error);
      }
    }

    // Send post-care reminders
    for (const appointment of appointmentsPost) {
      try {
        await sendReminderEmail(appointment, appointment.patientId, appointment.practitionerId, true);
        await Appointment.findByIdAndUpdate(appointment._id, {
          'emailReminders.postCareEmailSent': true
        });
        console.log(`Post-care reminder sent for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`Failed to send post-care reminder for appointment ${appointment._id}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in email scheduler:', error);
  }
};

const startEmailScheduler = () => {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    console.log('Running email reminder check...');
    checkAndSendReminders();
  });

  console.log('Email scheduler started - checking every hour');
};

module.exports = {
  startEmailScheduler,
  checkAndSendReminders
};