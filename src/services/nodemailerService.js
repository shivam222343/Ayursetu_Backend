const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

const defaultPrescription = `Take rest for 30 minutes after therapy.
Drink warm water throughout the day.
Avoid cold foods and beverages.
Follow a light, easily digestible diet.
Consult your doctor if you experience any discomfort.`;

const preCareInstructions = `- Arrive 15 minutes before your appointment
- Wear comfortable, loose-fitting clothes
- Avoid heavy meals 2 hours before therapy
- Stay hydrated but avoid excessive water intake
- Inform the doctor about any medications you're taking`;

const postCareInstructions = `- Rest for at least 30 minutes after therapy
- Drink warm water and herbal teas
- Avoid cold foods, ice cream, and cold beverages
- Take a warm shower (not hot) after 2-3 hours
- Follow a light, warm, and easily digestible diet
- Avoid strenuous activities for 24 hours
- Contact your doctor if you experience any unusual symptoms`;

const sendAcceptanceEmailNodemailer = async (appointment, patient, doctor) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@ayursutra.com',
      to: patient.email,
      subject: `Appointment Confirmed: ${appointment.therapyId}`,
      html: `
        <h2>Appointment Confirmed</h2>
        <p>Hello ${patient.name || patient.profile?.fullName || 'Patient'},</p>
        
        <p>Great news! Your appointment has been confirmed.</p>
        
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Therapy:</strong> ${appointment.therapyId}</li>
          <li><strong>Doctor:</strong> ${doctor.name || doctor.profile?.fullName || 'Doctor'}</li>
          <li><strong>Date:</strong> ${new Date(appointment.startTime).toLocaleDateString()}</li>
          <li><strong>Time:</strong> ${new Date(appointment.startTime).toLocaleTimeString()}</li>
        </ul>
        
        <h3>Prescription:</h3>
        <p>${appointment.prescription || defaultPrescription}</p>
        
        <h3>Pre-care Instructions:</h3>
        <p>${preCareInstructions}</p>
        
        <h3>Post-care Instructions:</h3>
        <p>${postCareInstructions}</p>
        
        <p>Please arrive 15 minutes early for your appointment.</p>
        
        <p>Best regards,<br>AyurSutra Team</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

const sendReminderEmailNodemailer = async (appointment, patient, doctor, isPostReminder = false) => {
  try {
    const subject = isPostReminder 
      ? `Post-Care Instructions: ${appointment.therapyId}`
      : `Appointment Reminder: ${appointment.therapyId}`;

    const content = isPostReminder 
      ? `
        <p>We hope your ${appointment.therapyId} session with ${doctor.name || doctor.profile?.fullName || 'Doctor'} went well.</p>
        
        <h3>Post-care Instructions:</h3>
        <p>${postCareInstructions}</p>
        
        <h3>Your Prescription:</h3>
        <p>${appointment.prescription || defaultPrescription}</p>
        
        <p>Please follow these instructions for the best results. Contact us if you have any concerns.</p>
      `
      : `
        <p>This is a reminder for your upcoming therapy: ${appointment.therapyId} with ${doctor.name || doctor.profile?.fullName || 'Doctor'} on ${new Date(appointment.startTime).toLocaleDateString()} at ${new Date(appointment.startTime).toLocaleTimeString()}.</p>
        
        <h3>Prescription:</h3>
        <p>${appointment.prescription || defaultPrescription}</p>
        
        <h3>Pre-care Instructions:</h3>
        <p>${preCareInstructions}</p>
        
        <p>Thank you,<br>AyurSutra Team</p>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@ayursutra.com',
      to: patient.email,
      subject: subject,
      html: `
        <h2>${subject}</h2>
        <p>Hello ${patient.name || patient.profile?.fullName || 'Patient'},</p>
        ${content}
        <p>Best regards,<br>AyurSutra Team</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Reminder email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Reminder email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAcceptanceEmailNodemailer,
  sendReminderEmailNodemailer
};