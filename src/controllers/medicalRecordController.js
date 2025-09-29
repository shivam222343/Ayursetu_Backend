const MedicalRecord = require('../models/medicalRecordModel');

// Get patient's complete medical record
const getMedicalRecord = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    
    let record = await MedicalRecord.findOne({ patientId })
      .populate('patientId', 'name email profile')
      .populate('vitalSigns.recordedBy', 'name')
      .populate('medications.prescribedBy', 'name')
      .populate('conditions.diagnosedBy', 'name')
      .populate('therapySessions.practitioner', 'name')
      .populate('labResults.orderedBy', 'name');

    if (!record) {
      record = new MedicalRecord({ patientId });
      await record.save();
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add vital signs
const addVitalSigns = async (req, res) => {
  try {
    const { patientId, ...vitalData } = req.body;
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: targetPatientId },
      { 
        $push: { 
          vitalSigns: { 
            ...vitalData, 
            recordedBy: req.user.id,
            recordedAt: new Date()
          } 
        },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.vitalSigns[record.vitalSigns.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add medication
const addMedication = async (req, res) => {
  try {
    const { patientId, ...medicationData } = req.body;
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: targetPatientId },
      { 
        $push: { 
          medications: { 
            ...medicationData, 
            prescribedBy: req.user.id 
          } 
        },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.medications[record.medications.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add condition
const addCondition = async (req, res) => {
  try {
    const { patientId, ...conditionData } = req.body;
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: targetPatientId },
      { 
        $push: { 
          conditions: { 
            ...conditionData, 
            diagnosedBy: req.user.id 
          } 
        },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.conditions[record.conditions.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add therapy session
const addTherapySession = async (req, res) => {
  try {
    const { patientId, ...sessionData } = req.body;
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: targetPatientId },
      { 
        $push: { 
          therapySessions: { 
            ...sessionData, 
            practitioner: req.user.id 
          } 
        },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.therapySessions[record.therapySessions.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add lab result
const addLabResult = async (req, res) => {
  try {
    const { patientId, ...labData } = req.body;
    const targetPatientId = req.user.role === 'patient' ? req.user.id : patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId: targetPatientId },
      { 
        $push: { 
          labResults: { 
            ...labData, 
            orderedBy: req.user.id 
          } 
        },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.labResults[record.labResults.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lifestyle information
const updateLifestyle = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.body.patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId },
      { 
        lifestyle: req.body.lifestyle,
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    res.json(record.lifestyle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get health summary
const getHealthSummary = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    
    const record = await MedicalRecord.findOne({ patientId })
      .populate('patientId', 'name email profile');
    
    if (!record) {
      return res.json({
        activeMedications: 0,
        activeConditions: 0,
        totalTherapySessions: 0,
        totalLabResults: 0,
        recentVitals: null,
        lastUpdated: null,
        patientName: req.user.name || 'Unknown Patient'
      });
    }

    // Calculate active medications and conditions
    const activeMedications = record.medications.filter(med => med.status === 'active').length;
    const activeConditions = record.conditions.filter(condition => condition.status === 'active').length;
    
    // Get recent vital signs
    const recentVitals = record.vitalSigns.length > 0 
      ? record.vitalSigns.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0]
      : null;

    const summary = {
      activeMedications,
      activeConditions,
      totalTherapySessions: record.therapySessions.length,
      totalLabResults: record.labResults.length,
      totalMedications: record.medications.length,
      totalConditions: record.conditions.length,
      totalVitalSigns: record.vitalSigns.length,
      recentVitals,
      lastUpdated: record.lastUpdated,
      patientName: record.patientId?.name || req.user.name || 'Unknown Patient',
      bloodType: record.bloodType,
      allergies: record.allergies.length,
      // Recent activity for dashboard
      recentActivity: [
        ...record.therapySessions.slice(-3).map(session => ({
          type: `${session.therapyType} Therapy Session`,
          date: session.sessionDate,
          category: 'therapy'
        })),
        ...record.labResults.slice(-2).map(lab => ({
          type: `${lab.testName} Lab Test`,
          date: lab.testDate,
          category: 'lab'
        })),
        ...record.medications.slice(-2).map(med => ({
          type: `${med.name} Prescribed`,
          date: med.startDate,
          category: 'medication'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching health summary:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get specific section data
const getSectionData = async (req, res) => {
  try {
    const { section } = req.params;
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    
    const record = await MedicalRecord.findOne({ patientId });
    
    if (!record) {
      return res.json([]);
    }

    let sectionData;
    switch (section) {
      case 'basic-info':
        sectionData = {
          height: record.vitalSigns.length > 0 ? record.vitalSigns[record.vitalSigns.length - 1].height : null,
          weight: record.vitalSigns.length > 0 ? record.vitalSigns[record.vitalSigns.length - 1].weight : null,
          bloodType: record.bloodType,
          emergencyContact: record.emergencyContact
        };
        break;
      case 'conditions':
        sectionData = record.conditions;
        break;
      case 'allergies':
        sectionData = record.allergies;
        break;
      case 'medications':
        sectionData = record.medications;
        break;
      case 'lifestyle':
        sectionData = record.lifestyle;
        break;
      case 'vitals':
        sectionData = record.vitalSigns;
        break;
      case 'therapy-sessions':
        sectionData = record.therapySessions;
        break;
      case 'lab-results':
        sectionData = record.labResults;
        break;
      case 'family-history':
        sectionData = record.familyHistory;
        break;
      default:
        return res.status(400).json({ message: 'Invalid section' });
    }

    res.json(sectionData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add data to specific section
const addSectionData = async (req, res) => {
  try {
    const { section } = req.params;
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    const sectionData = req.body;

    let updateQuery = {};
    let newData = {};

    switch (section) {
      case 'basic-info':
        // Update basic info fields
        if (sectionData.bloodType) {
          updateQuery.bloodType = sectionData.bloodType;
        }
        if (sectionData.emergencyContact) {
          updateQuery.emergencyContact = sectionData.emergencyContact;
        }
        // Add height/weight as vital signs if provided
        if (sectionData.height || sectionData.weight) {
          updateQuery.$push = {
            vitalSigns: {
              height: sectionData.height,
              weight: sectionData.weight,
              bmi: sectionData.height && sectionData.weight ? 
                (sectionData.weight / Math.pow(sectionData.height / 100, 2)).toFixed(1) : null,
              recordedBy: req.user.id,
              recordedAt: new Date()
            }
          };
        }
        break;
      case 'conditions':
        updateQuery.$push = {
          conditions: {
            ...sectionData,
            diagnosedBy: req.user.id
          }
        };
        break;
      case 'allergies':
        updateQuery.$push = {
          allergies: sectionData
        };
        break;
      case 'medications':
        updateQuery.$push = {
          medications: {
            ...sectionData,
            prescribedBy: req.user.id
          }
        };
        break;
      case 'lifestyle':
        updateQuery.lifestyle = sectionData;
        break;
      case 'vitals':
        updateQuery.$push = {
          vitalSigns: {
            ...sectionData,
            recordedBy: req.user.id,
            recordedAt: new Date()
          }
        };
        break;
      case 'therapy-sessions':
        updateQuery.$push = {
          therapySessions: {
            ...sectionData,
            practitioner: req.user.id
          }
        };
        break;
      case 'lab-results':
        updateQuery.$push = {
          labResults: {
            ...sectionData,
            orderedBy: req.user.id
          }
        };
        break;
      case 'family-history':
        updateQuery.$push = {
          familyHistory: sectionData
        };
        break;
      default:
        return res.status(400).json({ message: 'Invalid section' });
    }

    updateQuery.lastUpdated = new Date();
    updateQuery.updatedBy = req.user.id;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId },
      updateQuery,
      { new: true, upsert: true }
    );

    // Return the newly added item or updated section
    let responseData;
    switch (section) {
      case 'basic-info':
        responseData = {
          height: record.vitalSigns.length > 0 ? record.vitalSigns[record.vitalSigns.length - 1].height : null,
          weight: record.vitalSigns.length > 0 ? record.vitalSigns[record.vitalSigns.length - 1].weight : null,
          bloodType: record.bloodType,
          emergencyContact: record.emergencyContact
        };
        break;
      case 'conditions':
        responseData = record.conditions[record.conditions.length - 1];
        break;
      case 'allergies':
        responseData = record.allergies[record.allergies.length - 1];
        break;
      case 'medications':
        responseData = record.medications[record.medications.length - 1];
        break;
      case 'lifestyle':
        responseData = record.lifestyle;
        break;
      case 'vitals':
        responseData = record.vitalSigns[record.vitalSigns.length - 1];
        break;
      case 'therapy-sessions':
        responseData = record.therapySessions[record.therapySessions.length - 1];
        break;
      case 'lab-results':
        responseData = record.labResults[record.labResults.length - 1];
        break;
      case 'family-history':
        responseData = record.familyHistory[record.familyHistory.length - 1];
        break;
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update specific item in a section
const updateSectionItem = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;
    const updateData = req.body;

    let updateQuery = {};
    const sectionPath = `${section}.$.`;

    // Build update query based on section
    Object.keys(updateData).forEach(key => {
      updateQuery[`${sectionPath}${key}`] = updateData[key];
    });

    updateQuery.lastUpdated = new Date();
    updateQuery.updatedBy = req.user.id;

    const record = await MedicalRecord.findOneAndUpdate(
      { 
        patientId,
        [`${section}._id`]: itemId
      },
      { $set: updateQuery },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record or item not found' });
    }

    const updatedItem = record[section].find(item => item._id.toString() === itemId);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete specific item from a section
const deleteSectionItem = async (req, res) => {
  try {
    const { section, itemId } = req.params;
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;

    const record = await MedicalRecord.findOneAndUpdate(
      { patientId },
      { 
        $pull: { [section]: { _id: itemId } },
        lastUpdated: new Date(),
        updatedBy: req.user.id
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};