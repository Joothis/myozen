// patient.routes.js - Patient routes

const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  getPatient, 
  registerPatient, 
  updatePatient, 
  deletePatient 
} = require('../controllers/patient.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all patients and register new patient
router.route('/')
  .get(getPatients)
  .post(registerPatient);

// Get, update and delete a specific patient
router.route('/:id')
  .get(getPatient)
  .put(updatePatient)
  .delete(deletePatient);

module.exports = router;
