// device.model.js - Device model for EMG/EMS devices

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const deviceSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['EMG', 'EMS', 'COMBO'],
    required: [true, 'Device type is required']
  },
  macAddress: {
    type: String,
    trim: true
  },
  firmwareVersion: {
    type: String,
    trim: true
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastConnected: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    // EMG settings
    samplingRate: {
      type: Number,
      default: 1000 // Hz
    },
    filterSettings: {
      lowPass: {
        type: Number,
        default: 500 // Hz
      },
      highPass: {
        type: Number,
        default: 20 // Hz
      },
      notchFilter: {
        type: Boolean,
        default: true
      }
    },
    // EMS settings
    stimulationParameters: {
      frequency: {
        type: Number,
        default: 50 // Hz
      },
      pulseWidth: {
        type: Number,
        default: 300 // μs
      },
      amplitude: {
        type: Number,
        default: 20 // mA
      },
      waveform: {
        type: String,
        enum: ['square', 'sine', 'triangular'],
        default: 'square'
      }
    }
  },
  assignedPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Device must be assigned to a doctor']
  },
  connectionDetails: {
    connectionType: {
      type: String,
      enum: ['bluetooth', 'wifi', 'both'],
      default: 'bluetooth'
    },
    ipAddress: String,
    port: Number,
    bluetoothId: String
  },
  syncStatus: {
    lastSynced: Date,
    pendingSync: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Encrypt sensitive fields
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;

// Only encrypt sensitive fields
deviceSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ['macAddress', 'connectionDetails.ipAddress', 'connectionDetails.bluetoothId']
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
