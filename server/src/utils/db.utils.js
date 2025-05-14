// db.utils.js - Database utility functions

const mongoose = require('mongoose');

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected, false otherwise
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get MongoDB connection status
 * @returns {string} Connection status description
 */
const getConnectionStatus = () => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[mongoose.connection.readyState] || 'Unknown';
};

/**
 * Get MongoDB connection information
 * @returns {Object} Connection information
 */
const getConnectionInfo = () => {
  if (!isConnected()) {
    return {
      status: getConnectionStatus(),
      connected: false
    };
  }
  
  return {
    status: getConnectionStatus(),
    connected: true,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.models)
  };
};

/**
 * Check if a collection exists
 * @param {string} collectionName - Name of the collection to check
 * @returns {Promise<boolean>} True if collection exists, false otherwise
 */
const collectionExists = async (collectionName) => {
  if (!isConnected()) {
    throw new Error('MongoDB is not connected');
  }
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.some(col => col.name === collectionName);
};

/**
 * Get document count for a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<number>} Number of documents in the collection
 */
const getDocumentCount = async (collectionName) => {
  if (!isConnected()) {
    throw new Error('MongoDB is not connected');
  }
  
  return await mongoose.connection.db.collection(collectionName).countDocuments();
};

/**
 * Get all collection names
 * @returns {Promise<Array<string>>} Array of collection names
 */
const getCollections = async () => {
  if (!isConnected()) {
    throw new Error('MongoDB is not connected');
  }
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.map(col => col.name);
};

/**
 * Drop a collection
 * @param {string} collectionName - Name of the collection to drop
 * @returns {Promise<boolean>} True if collection was dropped, false otherwise
 */
const dropCollection = async (collectionName) => {
  if (!isConnected()) {
    throw new Error('MongoDB is not connected');
  }
  
  if (await collectionExists(collectionName)) {
    await mongoose.connection.db.dropCollection(collectionName);
    return true;
  }
  
  return false;
};

module.exports = {
  isConnected,
  getConnectionStatus,
  getConnectionInfo,
  collectionExists,
  getDocumentCount,
  getCollections,
  dropCollection
};
