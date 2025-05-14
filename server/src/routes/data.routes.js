// data.routes.js - Routes for EMG/EMS data

const express = require('express');
const router = express.Router();
const { 
  postEMGData, 
  postEMSData, 
  getPatientEMGData, 
  getPatientEMSData, 
  getEMGSession, 
  getEMSSession 
} = require('../controllers/data.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// EMG data routes
router.post('/emg', postEMGData);
router.get('/emg/patient/:patientId', getPatientEMGData);
router.get('/emg/:id', getEMGSession);

// EMS data routes
router.post('/ems', postEMSData);
router.get('/ems/patient/:patientId', getPatientEMSData);
router.get('/ems/:id', getEMSSession);

module.exports = router;
