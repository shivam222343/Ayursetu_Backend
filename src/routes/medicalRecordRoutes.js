const express = require('express');
const router = express.Router();
const {
  getMedicalRecord,
  addVitalSigns,
  addMedication,
  addCondition,
  addTherapySession,
  addLabResult,
  updateLifestyle,
  getHealthSummary,
  getSectionData,
  addSectionData,
  updateSectionItem,
  deleteSectionItem
} = require('../controllers/medicalRecordController');
const protect = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get complete medical record
router.get('/', getMedicalRecord);
router.get('/:patientId', getMedicalRecord);

// Get health summary
router.get('/summary', getHealthSummary);
router.get('/summary/:patientId', getHealthSummary);

// Add medical data
router.post('/vitals', addVitalSigns);
router.post('/medications', addMedication);
router.post('/conditions', addCondition);
router.post('/therapy-sessions', addTherapySession);
router.post('/lab-results', addLabResult);

// Update lifestyle
router.put('/lifestyle', updateLifestyle);

// Section-specific routes for real-time data management
// GET /api/medical-records/:patientId/:section - fetch all records for that section
router.get('/:patientId/:section', getSectionData);
router.get('/section/:section', getSectionData); // For current patient

// POST /api/medical-records/:patientId/:section - store form/modal data for that section
router.post('/:patientId/:section', addSectionData);
router.post('/section/:section', addSectionData); // For current patient

// PUT /api/medical-records/:patientId/:section/:itemId - update specific item in section
router.put('/:patientId/:section/:itemId', updateSectionItem);
router.put('/section/:section/:itemId', updateSectionItem); // For current patient

// DELETE /api/medical-records/:patientId/:section/:itemId - delete specific item from section
router.delete('/:patientId/:section/:itemId', deleteSectionItem);
router.delete('/section/:section/:itemId', deleteSectionItem); // For current patient

module.exports = router;