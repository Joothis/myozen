// seed.js - Seed script for initializing the database with test data

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Device = require('../models/device.model');
const Patient = require('../models/patient.model');
const { EMGData, EMSData } = require('../models/data.model');

// Sample data
const users = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'doctor',
    specialization: 'Neurology',
    licenseNumber: 'MD12345',
    phoneNumber: '555-123-4567'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'doctor',
    specialization: 'Physical Therapy',
    licenseNumber: 'PT54321',
    phoneNumber: '555-987-6543'
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('📊 Connected to MongoDB');
    seedDatabase();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Seed the database
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Device.deleteMany({});
    await Patient.deleteMany({});
    await EMGData.deleteMany({});
    await EMSData.deleteMany({});
    
    console.log('🧹 Cleared existing data');
    
    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      
      createdUsers.push(user);
    }
    
    console.log(`👤 Created ${createdUsers.length} users`);
    
    // Create patients for each doctor
    const patients = [];
    for (const user of createdUsers.filter(u => u.role === 'doctor')) {
      // Create 3 patients per doctor
      for (let i = 1; i <= 3; i++) {
        const patient = await Patient.create({
          firstName: `Patient${i}`,
          lastName: `${user.lastName}${i}`,
          dateOfBirth: new Date(1980, 0, i),
          gender: i % 2 === 0 ? 'female' : 'male',
          contactInformation: {
            email: `patient${i}.${user.lastName.toLowerCase()}@example.com`,
            phoneNumber: `555-${i}00-${user._id.toString().substring(0, 4)}`,
            address: {
              street: `${i}23 Main St`,
              city: 'Anytown',
              state: 'CA',
              zipCode: `9${i}000`,
              country: 'USA'
            }
          },
          medicalInformation: {
            medicalConditions: ['Muscle weakness', 'Nerve damage'],
            allergies: [],
            medications: ['Vitamin D'],
            notes: `Test patient ${i} for Dr. ${user.lastName}`
          },
          assignedDoctor: user._id,
          treatmentPlan: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            goals: ['Improve muscle strength', 'Reduce pain'],
            frequency: '3 times per week',
            notes: 'Focus on upper body exercises'
          }
        });
        
        patients.push(patient);
      }
    }
    
    console.log(`👨‍👩‍👧‍👦 Created ${patients.length} patients`);
    
    // Create devices
    const devices = [];
    const deviceTypes = ['EMG', 'EMS', 'COMBO'];
    
    for (const user of createdUsers.filter(u => u.role === 'doctor')) {
      // Get patients for this doctor
      const doctorPatients = patients.filter(p => p.assignedDoctor.toString() === user._id.toString());
      
      // Create 2 devices per doctor
      for (let i = 1; i <= 2; i++) {
        const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        const patient = doctorPatients[i - 1]; // Assign to different patients
        
        const device = await Device.create({
          serialNumber: `DEV-${user._id.toString().substring(0, 4)}-${i}`,
          name: `${deviceType} Device ${i}`,
          type: deviceType,
          macAddress: `00:11:22:33:44:${i}${user._id.toString().substring(0, 2)}`,
          firmwareVersion: '1.0.0',
          batteryLevel: 85,
          lastConnected: new Date(),
          assignedDoctor: user._id,
          assignedPatient: patient._id,
          connectionDetails: {
            connectionType: 'bluetooth',
            bluetoothId: `BT-${i}${user._id.toString().substring(0, 4)}`
          }
        });
        
        devices.push(device);
        
        // Update patient's devices array
        await Patient.findByIdAndUpdate(
          patient._id,
          { $push: { devices: device._id } }
        );
      }
    }
    
    console.log(`🔌 Created ${devices.length} devices`);
    
    // Create sample data records
    let emgCount = 0;
    let emsCount = 0;
    
    for (const device of devices) {
      const patient = await Patient.findById(device.assignedPatient);
      
      if (device.type === 'EMG' || device.type === 'COMBO') {
        // Create EMG data
        await EMGData.create({
          device: device._id,
          patient: patient._id,
          doctor: device.assignedDoctor,
          sessionId: `EMG-${Date.now()}-${device._id.toString().substring(0, 4)}`,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          endTime: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
          dataPoints: Array.from({ length: 10 }, (_, i) => ({
            timestamp: new Date(Date.now() - (24 * 60 * 60 * 1000) + (i * 60 * 1000)),
            value: Math.random() * 100,
            channel: 1
          })),
          metadata: {
            muscleGroup: 'Biceps',
            activity: 'Flexion',
            notes: 'Sample EMG data',
            deviceSettings: {
              samplingRate: 1000,
              filterSettings: {
                lowPass: 500,
                highPass: 20,
                notchFilter: true
              }
            }
          },
          syncStatus: {
            synced: true,
            syncedAt: new Date()
          }
        });
        
        emgCount++;
      }
      
      if (device.type === 'EMS' || device.type === 'COMBO') {
        // Create EMS data
        await EMSData.create({
          device: device._id,
          patient: patient._id,
          doctor: device.assignedDoctor,
          sessionId: `EMS-${Date.now()}-${device._id.toString().substring(0, 4)}`,
          startTime: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          endTime: new Date(Date.now() - 47 * 60 * 60 * 1000), // 47 hours ago
          stimulationParameters: {
            frequency: 50,
            pulseWidth: 300,
            amplitude: 20,
            waveform: 'square',
            duration: 300,
            restPeriod: 120
          },
          stimulationPattern: 'burst',
          responseData: Array.from({ length: 5 }, (_, i) => ({
            timestamp: new Date(Date.now() - (48 * 60 * 60 * 1000) + (i * 60 * 1000)),
            value: Math.random() * 50,
            channel: 1
          })),
          metadata: {
            muscleGroup: 'Quadriceps',
            treatmentGoal: 'Muscle strengthening',
            notes: 'Sample EMS data'
          },
          syncStatus: {
            synced: true,
            syncedAt: new Date()
          }
        });
        
        emsCount++;
      }
    }
    
    console.log(`📊 Created ${emgCount} EMG data records and ${emsCount} EMS data records`);
    
    console.log('✅ Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('- Doctor: john.doe@example.com / password123');
    console.log('- Admin: admin@example.com / admin123');
    
    // Disconnect from database
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}
