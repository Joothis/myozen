// test-bluetooth.js - Test script for Bluetooth connectivity

// Load environment variables
require("dotenv").config();

// Import the Bluetooth service
const { setupBluetoothClient } = require("./services/bluetooth.service");

console.log("🔍 Starting Bluetooth test script...");
console.log("This script will scan for Bluetooth devices and attempt to connect to healthcare devices.");

// Initialize the Bluetooth client
const bluetoothClient = setupBluetoothClient();

// Set up a timeout to exit after 60 seconds
console.log("⏱️ Test will run for 60 seconds...");
setTimeout(() => {
  console.log("⏱️ Test complete. Disconnecting...");
  
  if (bluetoothClient && typeof bluetoothClient.disconnect === "function") {
    bluetoothClient.disconnect();
  }
  
  console.log("✅ Test finished.");
  process.exit(0);
}, 60000);

// Handle Ctrl+C
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted. Disconnecting...");
  
  if (bluetoothClient && typeof bluetoothClient.disconnect === "function") {
    bluetoothClient.disconnect();
  }
  
  console.log("✅ Test finished.");
  process.exit(0);
});

// Start scanning for devices
if (bluetoothClient && typeof bluetoothClient.startScanning === "function") {
  bluetoothClient.startScanning();
}

console.log("🔍 Scanning for Bluetooth devices...");
console.log("Press Ctrl+C to stop the test.");
