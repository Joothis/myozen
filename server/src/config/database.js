// database.js - MongoDB connection configuration

const mongoose = require('mongoose');

/**
 * Connect to MongoDB
 * @returns {Promise} Mongoose connection promise
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;
    
    console.log(`🔄 Connecting to MongoDB: ${mongoURI.split('@')[1] || mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Initialize database with default data
 * This function can be expanded to include seeding initial data
 */
const initializeDB = async () => {
  try {
    // Check if collections exist and create them if needed
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📋 Existing collections: ${collectionNames.join(', ') || 'None'}`);
    
    // You can add code here to seed initial data if needed
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error(`❌ Database initialization error: ${error.message}`);
  }
};

/**
 * Close MongoDB connection
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  initializeDB,
  closeDB
};
