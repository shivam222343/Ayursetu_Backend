const MedicalRecord = require('../models/medicalRecordModel');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');
const PDFDocument = require('pdfkit');
const json2csv = require('json2csv').parse;

// Generate comprehensive health report
const generateHealthReport = async (req, res) => {
  try {
    const { reportType, dateRange, format = 'pdf' } = req.query;
    const patientId = req.user.id;

    // Get patient information
    const patient = await User.findById(patientId).select('name email dateOfBirth');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get medical records
    const medicalRecord = await MedicalRecord.findOne({ patientId });
    
    // Get appointments based on date range
    const dateFilter = getDateFilter(dateRange);
    const appointments = await Appointment.find({
      patientId,
      startTime: dateFilter
    }).populate('practitionerId', 'name specialization');

    // Prepare report data
    const reportData = {
      patient: {
        name: patient.name,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth
      },
      generatedAt: new Date(),
      reportType,
      dateRange,
      medicalRecord: medicalRecord || {},
      appointments: appointments || []
    };

    if (format === 'pdf') {
      generatePDFReport(res, reportData);
    } else if (format === 'csv') {
      generateCSVReport(res, reportData);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Generate medical records export
const exportMedicalRecords = async (req, res) => {
  try {
    const { format = 'pdf' } = req.query;
    const patientId = req.user.id;

    const patient = await User.findById(patientId).select('name email');
    const medicalRecord = await MedicalRecord.findOne({ patientId });

    if (!medicalRecord) {
      return res.status(404).json({ message: 'No medical records found' });
    }

    const exportData = {
      patient,
      medicalRecord,
      exportedAt: new Date()
    };

    if (format === 'pdf') {
      generateMedicalRecordsPDF(res, exportData);
    } else if (format === 'csv') {
      generateMedicalRecordsCSV(res, exportData);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting medical records:', error);
    res.status(500).json({ message: 'Failed to export medical records' });
  }
};

// Generate appointment history report
const generateAppointmentReport = async (req, res) => {
  try {
    const { dateRange, format = 'pdf' } = req.query;
    const patientId = req.user.id;

    const patient = await User.findById(patientId).select('name email');
    const dateFilter = getDateFilter(dateRange);
    
    const appointments = await Appointment.find({
      patientId,
      startTime: dateFilter
    }).populate('practitionerId', 'name specialization')
      .populate('therapyId', 'name description')
      .sort({ startTime: -1 });

    const reportData = {
      patient,
      appointments,
      dateRange,
      generatedAt: new Date()
    };

    if (format === 'pdf') {
      generateAppointmentsPDF(res, reportData);
    } else if (format === 'csv') {
      generateAppointmentsCSV(res, reportData);
    } else {
      res.json(reportData);
    }
  } catch (error) {
    console.error('Error generating appointment report:', error);
    res.status(500).json({ message: 'Failed to generate appointment report' });
  }
};

// Helper function to get date filter based on range
const getDateFilter = (dateRange) => {
  const now = new Date();
  let startDate;

  switch (dateRange) {
    case 'last-week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'last-3-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'last-6-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case 'last-year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  return { $gte: startDate, $lte: now };
};

// Generate PDF report
const generatePDFReport = (res, data) => {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="health-report-${Date.now()}.pdf"`);
  
  doc.pipe(res);

  // Header
  doc.fontSize(20).text('AyurSetu Health Report', 50, 50);
  doc.fontSize(12).text(`Generated on: ${data.generatedAt.toLocaleDateString()}`, 50, 80);
  doc.text(`Patient: ${data.patient.name}`, 50, 100);
  doc.text(`Report Type: ${data.reportType}`, 50, 120);
  doc.text(`Date Range: ${data.dateRange}`, 50, 140);

  let yPosition = 180;

  // Medical Records Section
  if (data.medicalRecord) {
    doc.fontSize(16).text('Medical Information', 50, yPosition);
    yPosition += 30;

    if (data.medicalRecord.conditions && data.medicalRecord.conditions.length > 0) {
      doc.fontSize(14).text('Conditions:', 50, yPosition);
      yPosition += 20;
      data.medicalRecord.conditions.forEach(condition => {
        doc.fontSize(10).text(`• ${condition.name} (${condition.severity}) - ${condition.status}`, 70, yPosition);
        yPosition += 15;
      });
      yPosition += 10;
    }

    if (data.medicalRecord.medications && data.medicalRecord.medications.length > 0) {
      doc.fontSize(14).text('Medications:', 50, yPosition);
      yPosition += 20;
      data.medicalRecord.medications.forEach(medication => {
        doc.fontSize(10).text(`• ${medication.name} - ${medication.dosage} (${medication.frequency})`, 70, yPosition);
        yPosition += 15;
      });
      yPosition += 10;
    }
  }

  // Appointments Section
  if (data.appointments && data.appointments.length > 0) {
    doc.fontSize(16).text('Recent Appointments', 50, yPosition);
    yPosition += 30;
    
    data.appointments.slice(0, 10).forEach(appointment => {
      doc.fontSize(10).text(
        `${new Date(appointment.startTime).toLocaleDateString()} - ${appointment.practitionerId?.name || 'Unknown'} (${appointment.status})`,
        70, yPosition
      );
      yPosition += 15;
    });
  }

  doc.end();
};

// Generate CSV report
const generateCSVReport = (res, data) => {
  try {
    const csvData = [];

    // Add patient info
    csvData.push({
      Type: 'Patient Info',
      Name: data.patient.name,
      Email: data.patient.email,
      Date: data.generatedAt.toISOString()
    });

    // Add conditions
    if (data.medicalRecord?.conditions) {
      data.medicalRecord.conditions.forEach(condition => {
        csvData.push({
          Type: 'Condition',
          Name: condition.name,
          Severity: condition.severity,
          Status: condition.status,
          Notes: condition.notes || ''
        });
      });
    }

    // Add medications
    if (data.medicalRecord?.medications) {
      data.medicalRecord.medications.forEach(medication => {
        csvData.push({
          Type: 'Medication',
          Name: medication.name,
          Dosage: medication.dosage,
          Frequency: medication.frequency,
          Purpose: medication.purpose || ''
        });
      });
    }

    // Add appointments
    if (data.appointments) {
      data.appointments.forEach(appointment => {
        csvData.push({
          Type: 'Appointment',
          Date: new Date(appointment.startTime).toLocaleDateString(),
          Practitioner: appointment.practitionerId?.name || 'Unknown',
          Status: appointment.status,
          Notes: appointment.notes || ''
        });
      });
    }

    const csv = json2csv(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="health-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ message: 'Failed to generate CSV report' });
  }
};

// Generate medical records PDF
const generateMedicalRecordsPDF = (res, data) => {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="medical-records-${Date.now()}.pdf"`);
  
  doc.pipe(res);

  doc.fontSize(20).text('Medical Records Export', 50, 50);
  doc.fontSize(12).text(`Patient: ${data.patient.name}`, 50, 80);
  doc.fontSize(12).text(`Exported on: ${data.exportedAt.toLocaleDateString()}`, 50, 100);

  let yPosition = 140;

  // Add all medical record sections
  const sections = [
    { title: 'Basic Information', data: data.medicalRecord.basicInfo },
    { title: 'Conditions', data: data.medicalRecord.conditions },
    { title: 'Allergies', data: data.medicalRecord.allergies },
    { title: 'Medications', data: data.medicalRecord.medications },
    { title: 'Lifestyle', data: data.medicalRecord.lifestyle }
  ];

  sections.forEach(section => {
    if (section.data && (Array.isArray(section.data) ? section.data.length > 0 : Object.keys(section.data).length > 0)) {
      doc.fontSize(16).text(section.title, 50, yPosition);
      yPosition += 25;
      
      if (Array.isArray(section.data)) {
        section.data.forEach(item => {
          const text = typeof item === 'object' ? 
            Object.entries(item).map(([key, value]) => `${key}: ${value}`).join(', ') :
            item.toString();
          doc.fontSize(10).text(`• ${text}`, 70, yPosition);
          yPosition += 15;
        });
      } else {
        Object.entries(section.data).forEach(([key, value]) => {
          if (value) {
            doc.fontSize(10).text(`${key}: ${value}`, 70, yPosition);
            yPosition += 15;
          }
        });
      }
      yPosition += 10;
    }
  });

  doc.end();
};

// Generate medical records CSV
const generateMedicalRecordsCSV = (res, data) => {
  try {
    const csvData = [];
    const record = data.medicalRecord;

    // Basic info
    if (record.basicInfo) {
      Object.entries(record.basicInfo).forEach(([key, value]) => {
        if (value) {
          csvData.push({
            Section: 'Basic Info',
            Field: key,
            Value: value.toString()
          });
        }
      });
    }

    // Conditions
    if (record.conditions) {
      record.conditions.forEach((condition, index) => {
        csvData.push({
          Section: 'Conditions',
          Index: index + 1,
          Name: condition.name,
          Severity: condition.severity,
          Status: condition.status,
          Notes: condition.notes || ''
        });
      });
    }

    // Similar for other sections...
    
    const csv = json2csv(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="medical-records-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating medical records CSV:', error);
    res.status(500).json({ message: 'Failed to generate CSV export' });
  }
};

// Generate appointments PDF
const generateAppointmentsPDF = (res, data) => {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="appointments-${Date.now()}.pdf"`);
  
  doc.pipe(res);

  doc.fontSize(20).text('Appointment History', 50, 50);
  doc.fontSize(12).text(`Patient: ${data.patient.name}`, 50, 80);
  doc.fontSize(12).text(`Date Range: ${data.dateRange}`, 50, 100);
  doc.fontSize(12).text(`Generated on: ${data.generatedAt.toLocaleDateString()}`, 50, 120);

  let yPosition = 160;

  data.appointments.forEach(appointment => {
    doc.fontSize(12).text(
      `${new Date(appointment.startTime).toLocaleDateString()} - ${appointment.practitionerId?.name || 'Unknown'}`,
      50, yPosition
    );
    doc.fontSize(10).text(`Status: ${appointment.status}`, 70, yPosition + 15);
    if (appointment.notes) {
      doc.fontSize(10).text(`Notes: ${appointment.notes}`, 70, yPosition + 30);
      yPosition += 50;
    } else {
      yPosition += 35;
    }
  });

  doc.end();
};

// Generate appointments CSV
const generateAppointmentsCSV = (res, data) => {
  try {
    const csvData = data.appointments.map(appointment => ({
      Date: new Date(appointment.startTime).toLocaleDateString(),
      Time: new Date(appointment.startTime).toLocaleTimeString(),
      Practitioner: appointment.practitionerId?.name || 'Unknown',
      Specialization: appointment.practitionerId?.specialization || '',
      Therapy: appointment.therapyId?.name || '',
      Status: appointment.status,
      Notes: appointment.notes || ''
    }));

    const csv = json2csv(csvData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="appointments-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error generating appointments CSV:', error);
    res.status(500).json({ message: 'Failed to generate appointments CSV' });
  }
};

module.exports = {
  generateHealthReport,
  exportMedicalRecords,
  generateAppointmentReport
};
