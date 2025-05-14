// test-db.js - Test MongoDB connection

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
    
    // List all collections
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('📋 Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Close connection
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
