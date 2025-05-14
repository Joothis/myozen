// patient.controller.js - Patient controller

const Patient = require('../models/patient.model');
const Device = require('../models/device.model');

/**
 * Get all patients for the logged-in doctor
 * @route GET /api/patients
 * @access Private
 */
exports.getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ assignedDoctor: req.user._id })
      .select('-contactInformation.address -medicalInformation')
      .populate('devices', 'name type serialNumber');
    
    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single patient by ID
 * @route GET /api/patients/:id
 * @access Private
 */
exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('devices', 'name type serialNumber batteryLevel lastConnected');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if patient belongs to the logged-in doctor
    if (patient.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this patient'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new patient
 * @route POST /api/patients
 * @access Private
 */
exports.registerPatient = async (req, res, next) => {
  try {
    // Add the logged-in doctor as the assigned doctor
    req.body.assignedDoctor = req.user._id;
    
    const patient = await Patient.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a patient
 * @route PUT /api/patients/:id
 * @access Private
 */
exports.updatePatient = async (req, res, next) => {
  try {
    let patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if patient belongs to the logged-in doctor
    if (patient.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this patient'
      });
    }
    
    // Update patient
    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a patient
 * @route DELETE /api/patients/:id
 * @access Private
 */
exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if patient belongs to the logged-in doctor
    if (patient.assignedDoctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this patient'
      });
    }
    
    // Update any devices assigned to this patient
    await Device.updateMany(
      { assignedPatient: patient._id },
      { $unset: { assignedPatient: 1 } }
    );
    
    await patient.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
