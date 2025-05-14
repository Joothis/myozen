// device.routes.js - Device routes

const express = require('express');
const router = express.Router();
const { 
  getDevices, 
  getDevice, 
  registerDevice, 
  updateDevice, 
  deleteDevice 
} = require('../controllers/device.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get all devices and register new device
router.route('/')
  .get(getDevices)
  .post(registerDevice);

// Get, update and delete a specific device
router.route('/:id')
  .get(getDevice)
  .put(updateDevice)
  .delete(deleteDevice);

module.exports = router;
