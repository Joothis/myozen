// test-mqtt.js - Test MQTT connection without terminal flooding

// Load environment variables
require('dotenv').config();

const mqtt = require('mqtt');

console.log('Testing MQTT connection...');
console.log(`MQTT Broker URL: ${process.env.MQTT_BROKER_URL || 'Not configured'}`);

// Exit if MQTT broker URL is not configured
if (!process.env.MQTT_BROKER_URL) {
  console.error('❌ MQTT broker URL not configured. Please set MQTT_BROKER_URL in .env file.');
  process.exit(1);
}

// Connection options
const options = {
  clientId: `test_client_${Math.random().toString(16).substring(2, 8)}`,
  clean: true,
  connectTimeout: 5000,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
};

// Connect to MQTT broker
console.log('Connecting to MQTT broker...');
const client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

// Set a timeout to exit after 10 seconds
const timeout = setTimeout(() => {
  console.log('Test completed. Disconnecting...');
  client.end(true);
  process.exit(0);
}, 10000);

// Handle connection
client.on('connect', () => {
  console.log('✅ Successfully connected to MQTT broker');
  
  // Subscribe to a test topic
  client.subscribe('test/topic', (err) => {
    if (err) {
      console.error('❌ Subscription error:', err.message);
    } else {
      console.log('✅ Subscribed to test/topic');
      
      // Publish a test message
      client.publish('test/topic', JSON.stringify({ 
        message: 'Test message', 
        timestamp: new Date().toISOString() 
      }));
      
      console.log('✅ Published test message to test/topic');
    }
  });
});

// Handle errors
client.on('error', (err) => {
  console.error('❌ MQTT client error:', err.message);
});

// Handle reconnect
client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT broker...');
});

// Handle close
client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

// Handle messages
client.on('message', (topic, message) => {
  console.log(`📩 Received message on topic: ${topic}`);
  console.log(`📄 Message: ${message.toString()}`);
});

// Handle process termination
process.on('SIGINT', () => {
  clearTimeout(timeout);
  console.log('Disconnecting from MQTT broker...');
  client.end(true);
  process.exit(0);
});
