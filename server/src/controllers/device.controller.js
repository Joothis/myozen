// device.controller.js - Device controller

const Device = require('../models/device.model');
const Patient = require('../models/patient.model');

/**
 * Get all devices for the logged-in doctor
 * @route GET /api/devices
 * @access Private
 */
exports.getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ assignedDoctor: req.user._id })
      .populate('assignedPatient', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single device by ID
 * @route GET /api/devices/:id
 * @access Private
 */
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate('assignedPatient', 'firstName lastName dateOfBirth gender');
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Check if device belongs to the logged-in doctor
    if (device.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this device'
      });
    }
    
    res.status(200).json({
      success: true,
      data: device
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new device
 * @route POST /api/devices
 * @access Private
 */
exports.registerDevice = async (req, res, next) => {
  try {
    // Add the logged-in doctor as the assigned doctor
    req.body.assignedDoctor = req.user._id;
    
    const device = await Device.create(req.body);
    
    // If a patient is assigned, update the patient's devices array
    if (device.assignedPatient) {
      await Patient.findByIdAndUpdate(
        device.assignedPatient,
        { $push: { devices: device._id } }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      data: device
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a device
 * @route PUT /api/devices/:id
 * @access Private
 */
exports.updateDevice = async (req, res, next) => {
  try {
    let device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Check if device belongs to the logged-in doctor
    if (device.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this device'
      });
    }
    
    // Check if patient assignment is changing
    const oldPatientId = device.assignedPatient ? device.assignedPatient.toString() : null;
    const newPatientId = req.body.assignedPatient;
    
    // Update device
    device = await Device.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Handle patient device associations if patient assignment changed
    if (oldPatientId !== newPatientId) {
      // Remove device from old patient
      if (oldPatientId) {
        await Patient.findByIdAndUpdate(
          oldPatientId,
          { $pull: { devices: device._id } }
        );
      }
      
      // Add device to new patient
      if (newPatientId) {
        await Patient.findByIdAndUpdate(
          newPatientId,
          { $push: { devices: device._id } }
        );
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Device updated successfully',
      data: device
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a device
 * @route DELETE /api/devices/:id
 * @access Private
 */
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Check if device belongs to the logged-in doctor
    if (device.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this device'
      });
    }
    
    // Remove device from patient's devices array if assigned
    if (device.assignedPatient) {
      await Patient.findByIdAndUpdate(
        device.assignedPatient,
        { $pull: { devices: device._id } }
      );
    }
    
    await device.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
