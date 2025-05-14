// data.controller.js - Data controller for EMG/EMS data

const { EMGData, EMSData } = require('../models/data.model');
const Device = require('../models/device.model');
const Patient = require('../models/patient.model');

/**
 * Post new EMG data
 * @route POST /api/data/emg
 * @access Private
 */
exports.postEMGData = async (req, res, next) => {
  try {
    const { deviceId, sessionId, dataPoints, metadata } = req.body;
    
    // Validate device
    const device = await Device.findById(deviceId);
    
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
        message: 'Not authorized to post data for this device'
      });
    }
    
    // Check if device has an assigned patient
    if (!device.assignedPatient) {
      return res.status(400).json({
        success: false,
        message: 'Device must be assigned to a patient to record data'
      });
    }
    
    // Create EMG data record
    const emgData = await EMGData.create({
      device: deviceId,
      patient: device.assignedPatient,
      doctor: req.user._id,
      sessionId,
      dataPoints,
      metadata,
      syncStatus: {
        synced: false
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'EMG data recorded successfully',
      data: {
        id: emgData._id,
        sessionId: emgData.sessionId,
        startTime: emgData.startTime,
        pointsCount: emgData.dataPoints.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post new EMS data
 * @route POST /api/data/ems
 * @access Private
 */
exports.postEMSData = async (req, res, next) => {
  try {
    const { 
      deviceId, 
      sessionId, 
      stimulationParameters, 
      stimulationPattern, 
      responseData, 
      metadata 
    } = req.body;
    
    // Validate device
    const device = await Device.findById(deviceId);
    
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
        message: 'Not authorized to post data for this device'
      });
    }
    
    // Check if device has an assigned patient
    if (!device.assignedPatient) {
      return res.status(400).json({
        success: false,
        message: 'Device must be assigned to a patient to record data'
      });
    }
    
    // Create EMS data record
    const emsData = await EMSData.create({
      device: deviceId,
      patient: device.assignedPatient,
      doctor: req.user._id,
      sessionId,
      stimulationParameters,
      stimulationPattern,
      responseData,
      metadata,
      syncStatus: {
        synced: false
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'EMS data recorded successfully',
      data: {
        id: emsData._id,
        sessionId: emsData.sessionId,
        startTime: emsData.startTime
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get EMG data for a patient
 * @route GET /api/data/emg/patient/:patientId
 * @access Private
 */
exports.getPatientEMGData = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, page = 1, startDate, endDate } = req.query;
    
    // Validate patient
    const patient = await Patient.findById(patientId);
    
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
        message: 'Not authorized to access data for this patient'
      });
    }
    
    // Build query
    const query = { patient: patientId, doctor: req.user._id };
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get data
    const emgData = await EMGData.find(query)
      .select('-dataPoints') // Exclude large data arrays
      .populate('device', 'name type serialNumber')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await EMGData.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: emgData.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: emgData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get EMS data for a patient
 * @route GET /api/data/ems/patient/:patientId
 * @access Private
 */
exports.getPatientEMSData = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { limit = 10, page = 1, startDate, endDate } = req.query;
    
    // Validate patient
    const patient = await Patient.findById(patientId);
    
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
        message: 'Not authorized to access data for this patient'
      });
    }
    
    // Build query
    const query = { patient: patientId, doctor: req.user._id };
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get data
    const emsData = await EMSData.find(query)
      .select('-responseData') // Exclude large data arrays
      .populate('device', 'name type serialNumber')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const total = await EMSData.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: emsData.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: emsData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific EMG session data
 * @route GET /api/data/emg/:id
 * @access Private
 */
exports.getEMGSession = async (req, res, next) => {
  try {
    const emgData = await EMGData.findById(req.params.id)
      .populate('device', 'name type serialNumber')
      .populate('patient', 'firstName lastName');
    
    if (!emgData) {
      return res.status(404).json({
        success: false,
        message: 'EMG data session not found'
      });
    }
    
    // Check if data belongs to the logged-in doctor
    if (emgData.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }
    
    res.status(200).json({
      success: true,
      data: emgData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific EMS session data
 * @route GET /api/data/ems/:id
 * @access Private
 */
exports.getEMSSession = async (req, res, next) => {
  try {
    const emsData = await EMSData.findById(req.params.id)
      .populate('device', 'name type serialNumber')
      .populate('patient', 'firstName lastName');
    
    if (!emsData) {
      return res.status(404).json({
        success: false,
        message: 'EMS data session not found'
      });
    }
    
    // Check if data belongs to the logged-in doctor
    if (emsData.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }
    
    res.status(200).json({
      success: true,
      data: emsData
    });
  } catch (error) {
    next(error);
  }
};
