const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware.js');
const {
  generateHealthReport,
  exportMedicalRecords,
  generateAppointmentReport
} = require('../controllers/reportController.js');

// Generate comprehensive health report
// GET /api/reports/health?reportType=comprehensive&dateRange=last-month&format=pdf
router.get('/health', verifyToken, generateHealthReport);

// Export medical records
// GET /api/reports/medical-records?format=pdf
router.get('/medical-records', verifyToken, exportMedicalRecords);

// Generate appointment history report
// GET /api/reports/appointments?dateRange=last-month&format=csv
router.get('/appointments', verifyToken, generateAppointmentReport);

module.exports = router;
