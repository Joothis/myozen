// db-init.js - Database initialization script

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('./database');
const User = require('../models/user.model');

/**
 * Create default admin user if no users exist
 */
const createDefaultAdmin = async () => {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('🔧 No users found. Creating default admin user...');
      
      // Create default admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      await adminUser.save();
      console.log('✅ Default admin user created successfully');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log(`👥 Found ${userCount} existing users. Skipping default user creation.`);
    }
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
  }
};

/**
 * Create default doctor user if no doctor users exist
 */
const createDefaultDoctor = async () => {
  try {
    // Check if any doctor users exist
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    
    if (doctorCount === 0) {
      console.log('🔧 No doctor users found. Creating default doctor user...');
      
      // Create default doctor user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('doctor123', salt);
      
      const doctorUser = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: 'doctor',
        specialization: 'Neurology',
        licenseNumber: 'MD12345',
        phoneNumber: '555-123-4567',
        isActive: true
      });
      
      await doctorUser.save();
      console.log('✅ Default doctor user created successfully');
      console.log('📧 Email: john.doe@example.com');
      console.log('🔑 Password: doctor123');
    } else {
      console.log(`👨‍⚕️ Found ${doctorCount} existing doctor users. Skipping default doctor creation.`);
    }
  } catch (error) {
    console.error('❌ Error creating default doctor user:', error);
  }
};

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    console.log('🔄 Initializing database...');
    
    // Create default users
    await createDefaultAdmin();
    await createDefaultDoctor();
    
    console.log('✅ Database initialization complete');
    
    // Close MongoDB connection
    await closeDB();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase();
