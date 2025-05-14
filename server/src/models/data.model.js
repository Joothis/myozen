// data.model.js - Model for EMG/EMS data

const mongoose = require('mongoose');

// Schema for individual data points
const dataPointSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  value: {
    type: Number,
    required: true
  },
  channel: {
    type: Number,
    required: true
  }
});

// Schema for EMG data
const emgDataSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device reference is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  dataPoints: [dataPointSchema],
  metadata: {
    muscleGroup: String,
    activity: String,
    notes: String,
    deviceSettings: {
      samplingRate: Number,
      filterSettings: {
        lowPass: Number,
        highPass: Number,
        notchFilter: Boolean
      }
    }
  },
  syncStatus: {
    synced: {
      type: Boolean,
      default: false
    },
    syncedAt: Date
  }
}, {
  timestamps: true
});

// Schema for EMS data
const emsDataSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device reference is required']
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient reference is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  stimulationParameters: {
    frequency: Number,
    pulseWidth: Number,
    amplitude: Number,
    waveform: {
      type: String,
      enum: ['square', 'sine', 'triangular']
    },
    duration: Number, // in seconds
    restPeriod: Number // in seconds
  },
  stimulationPattern: {
    type: String,
    enum: ['continuous', 'burst', 'ramp', 'custom']
  },
  responseData: [dataPointSchema], // For measuring response to stimulation
  metadata: {
    muscleGroup: String,
    treatmentGoal: String,
    notes: String
  },
  syncStatus: {
    synced: {
      type: Boolean,
      default: false
    },
    syncedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
emgDataSchema.index({ device: 1, patient: 1, startTime: -1 });
emgDataSchema.index({ sessionId: 1 });
emgDataSchema.index({ 'syncStatus.synced': 1 });

emsDataSchema.index({ device: 1, patient: 1, startTime: -1 });
emsDataSchema.index({ sessionId: 1 });
emsDataSchema.index({ 'syncStatus.synced': 1 });

// Create models
const EMGData = mongoose.model('EMGData', emgDataSchema);
const EMSData = mongoose.model('EMSData', emsDataSchema);

module.exports = {
  EMGData,
  EMSData
};
