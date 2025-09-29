const axios = require('axios');

const EMAILJS_CONFIG = {
  serviceId: process.env.EMAILJS_SERVICE_ID || 'service_cdrbx4u',
  publicKey: process.env.EMAILJS_PUBLIC_KEY || 'mM1kFa6fxocyoinMv',
  privateKey: process.env.EMAILJS_PRIVATE_KEY || 'bHFb4WRcDO8jfcf376zAg',
  templateIds: {
    acceptance: process.env.EMAILJS_ACCEPTANCE_TEMPLATE || 'template_6r4mmr4',
    reminder: process.env.EMAILJS_REMINDER_TEMPLATE || 'template_ss4zf6s'
  }
};

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

const sendEmail = async (templateId, templateParams) => {
  try {
    const response = await axios.post('https://api.emailjs.com/api/v1.0/email/send', {
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: templateId,
      user_id: EMAILJS_CONFIG.publicKey,
      template_params: templateParams
    });
    
    console.log('Email sent successfully');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Email sending failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

const sendAcceptanceEmail = async (appointment, patient, doctor) => {
  console.log('Sending acceptance email to:', patient.email);
  
  const templateParams = {
    to_email: patient.email,
    patientName: patient.name || patient.profile?.fullName || 'Patient',
    patientEmail: patient.email,
    doctorName: doctor.name || doctor.profile?.fullName || 'Doctor',
    therapyType: appointment.therapyId,
    appointmentDate: new Date(appointment.startTime).toLocaleDateString(),
    appointmentTime: new Date(appointment.startTime).toLocaleTimeString(),
    prescription: appointment.prescription || defaultPrescription,
    preCareInstructions,
    postCareInstructions
  };

  console.log('Template params:', templateParams);
  return await sendEmail(EMAILJS_CONFIG.templateIds.acceptance, templateParams);
};

const sendReminderEmail = async (appointment, patient, doctor, isPostReminder = false) => {
  const templateParams = {
    to_email: patient.email,
    patientName: patient.name || patient.profile?.fullName || 'Patient',
    patientEmail: patient.email,
    doctorName: doctor.name || doctor.profile?.fullName || 'Doctor',
    therapyType: appointment.therapyId,
    appointmentDate: new Date(appointment.startTime).toLocaleDateString(),
    appointmentTime: new Date(appointment.startTime).toLocaleTimeString(),
    prescription: appointment.prescription || defaultPrescription,
    preCareInstructions,
    postCareInstructions,
    isPostReminder
  };

  return await sendEmail(EMAILJS_CONFIG.templateIds.reminder, templateParams);
};

module.exports = {
  sendAcceptanceEmail,
  sendReminderEmail
};