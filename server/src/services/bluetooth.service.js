// bluetooth.service.js - Simulated Bluetooth service for IoT device communication

const Device = require("../models/device.model");
const { EMGData, EMSData } = require("../models/data.model");
const EventEmitter = require("events");

// Bluetooth Service configuration
const bluetoothConfig = {
  // Set to true for verbose logging (development only)
  verboseLogging: process.env.NODE_ENV === "development",
  // Scan interval in ms
  scanInterval: 5000,
  // Simulated device IDs (replace with your actual device IDs)
  simulatedDevices: [
    { id: "myozen-device-001", name: "MyoZen EMG Sensor 1" },
    { id: "myozen-device-002", name: "MyoZen EMG Sensor 2" },
  ],
};

// Track connection state
let connectionState = {
  isScanning: false,
  connectedDevices: new Map(), // Map of connected devices (deviceId -> device object)
  lastMessageTime: new Map(), // Map of last message times (deviceId -> timestamp)
  messageCount: 0,
  // Reset message count every 5 seconds to avoid flooding logs
  messageCountResetInterval: null,
  // Simulated data interval
  dataIntervals: new Map(), // Map of data intervals (deviceId -> interval)
};

// Create an event emitter for Bluetooth events
const bluetoothEvents = new EventEmitter();

/**
 * Setup Bluetooth client for IoT device communication
 */
exports.setupBluetoothClient = () => {
  console.log("🔄 Initializing Bluetooth service (Simulation Mode)");

  // Set up message count reset interval
  connectionState.messageCountResetInterval = setInterval(() => {
    if (connectionState.messageCount > 0 && bluetoothConfig.verboseLogging) {
      console.log(
        `📊 Processed ${connectionState.messageCount} Bluetooth messages in the last 5 seconds`
      );
    }
    connectionState.messageCount = 0;
  }, 5000);

  // Create a client object with methods to control the Bluetooth service
  const client = {
    // Start scanning for devices
    startScanning: async () => {
      if (connectionState.isScanning) {
        return;
      }

      console.log("🔍 Starting scan for Bluetooth devices (Simulation Mode)");
      connectionState.isScanning = true;

      // Simulate discovering devices after a short delay
      setTimeout(() => {
        bluetoothConfig.simulatedDevices.forEach((device) => {
          console.log(`📱 Discovered device: ${device.id} (${device.name})`);
          bluetoothEvents.emit("deviceDiscovered", device);

          // Automatically connect to the device
          client.connectToDevice(device.id);
        });
      }, 2000);

      return true;
    },

    // Stop scanning for devices
    stopScanning: () => {
      connectionState.isScanning = false;
      console.log("🔍 Stopped scanning for Bluetooth devices");
      return true;
    },

    // Connect to a specific device
    connectToDevice: async (deviceId) => {
      try {
        if (connectionState.connectedDevices.has(deviceId)) {
          console.log(`📱 Device ${deviceId} is already connected`);
          return true;
        }

        console.log(`🔌 Connecting to device: ${deviceId}`);

        // Simulate connection delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Find the device in the simulated devices list
        const deviceInfo = bluetoothConfig.simulatedDevices.find(
          (d) => d.id === deviceId
        );

        if (!deviceInfo) {
          throw new Error(`Device ${deviceId} not found`);
        }

        // Create a simulated device object
        const device = {
          id: deviceId,
          name: deviceInfo.name,
          batteryLevel: 85,
          firmwareVersion: "1.2.3",
          connected: true,
          lastDataTime: new Date(),
        };

        // Store the connected device
        connectionState.connectedDevices.set(deviceId, device);
        connectionState.lastMessageTime.set(deviceId, new Date());

        console.log(`✅ Connected to device: ${deviceId}`);

        // Find the device in the database
        const dbDevice = await Device.findOne({ serialNumber: deviceId });

        if (dbDevice) {
          // Update device connection status
          dbDevice.lastConnected = new Date();
          dbDevice.connectionStatus = "connected";
          await dbDevice.save();

          console.log(
            `📱 Updated device ${deviceId} connection status in database`
          );
        } else {
          console.log(`⚠️ Device ${deviceId} not found in database`);
        }

        // Start sending simulated data
        startSimulatedDataStream(deviceId);

        return true;
      } catch (error) {
        console.error(
          `❌ Error connecting to device ${deviceId}: ${error.message}`
        );
        return false;
      }
    },

    // Disconnect from a specific device
    disconnectDevice: (deviceId) => {
      if (!connectionState.connectedDevices.has(deviceId)) {
        console.log(`⚠️ Device ${deviceId} is not connected`);
        return false;
      }

      console.log(`🔌 Disconnecting from device: ${deviceId}`);

      // Stop simulated data
      stopSimulatedDataStream(deviceId);

      // Remove the device from connected devices
      connectionState.connectedDevices.delete(deviceId);
      connectionState.lastMessageTime.delete(deviceId);

      console.log(`✅ Disconnected from device: ${deviceId}`);
      return true;
    },

    // Disconnect from all devices
    disconnect: () => {
      // Clear the message count interval
      if (connectionState.messageCountResetInterval) {
        clearInterval(connectionState.messageCountResetInterval);
        connectionState.messageCountResetInterval = null;
      }

      // Disconnect from all connected devices
      for (const deviceId of connectionState.connectedDevices.keys()) {
        client.disconnectDevice(deviceId);
      }

      // Stop scanning
      client.stopScanning();

      console.log("🔌 Disconnected from all Bluetooth devices");
      return true;
    },

    // Get connection status
    getStatus: () => {
      return {
        isScanning: connectionState.isScanning,
        connectedDevices: Array.from(connectionState.connectedDevices.keys()),
        messageCount: connectionState.messageCount,
        simulationMode: true,
      };
    },

    // Send command to a device
    sendCommand: async (deviceId, command) => {
      if (!connectionState.connectedDevices.has(deviceId)) {
        throw new Error(`Device not connected: ${deviceId}`);
      }

      console.log(
        `📤 Sent command to device ${deviceId}: ${JSON.stringify(command)}`
      );

      // Simulate command response after a short delay
      setTimeout(() => {
        const responseData = {
          deviceId,
          commandId: command.id || Math.floor(Math.random() * 1000),
          status: "success",
          timestamp: new Date().toISOString(),
        };

        bluetoothEvents.emit("commandResponse", responseData);

        if (bluetoothConfig.verboseLogging) {
          console.log(
            `📥 Received response from device ${deviceId}: ${JSON.stringify(
              responseData
            )}`
          );
        }
      }, 500);

      return true;
    },

    // Subscribe to Bluetooth events
    on: (event, callback) => {
      bluetoothEvents.on(event, callback);
      return client;
    },

    // Unsubscribe from Bluetooth events
    off: (event, callback) => {
      bluetoothEvents.off(event, callback);
      return client;
    },
  };

  return client;
};

/**
 * Start sending simulated data from a device
 * @param {string} deviceId - Device ID
 */
function startSimulatedDataStream(deviceId) {
  // Stop any existing data stream
  stopSimulatedDataStream(deviceId);

  console.log(`� Starting simulated data stream for device: ${deviceId}`);

  // Create a data interval that sends both EMG and EMS data
  const dataInterval = setInterval(async () => {
    try {
      // Generate a random session ID if needed
      const sessionId = `session-${Math.floor(Math.random() * 1000)}`;

      // Alternate between EMG and EMS data
      const dataType = Math.random() > 0.5 ? "emg" : "ems";

      if (dataType === "emg") {
        // Generate simulated EMG data
        const emgData = generateSimulatedEMGData(deviceId, sessionId);
        await handleDeviceData(deviceId, emgData);
      } else {
        // Generate simulated EMS data
        const emsData = generateSimulatedEMSData(deviceId, sessionId);
        await handleDeviceData(deviceId, emsData);
      }

      // Also send a status update occasionally
      if (Math.random() > 0.8) {
        const statusData = {
          batteryLevel: Math.floor(70 + Math.random() * 30), // 70-100%
          firmwareVersion: "1.2.3",
          timestamp: new Date().toISOString(),
        };

        await handleDeviceStatus(deviceId, statusData);
      }
    } catch (error) {
      console.error(`❌ Error generating simulated data: ${error.message}`);
    }
  }, 5000); // Send data every 5 seconds

  // Store the interval
  connectionState.dataIntervals.set(deviceId, dataInterval);
}

/**
 * Check if a discovered peripheral is a target healthcare device
 * @param {Object} peripheral - Noble peripheral object
 * @returns {boolean} - Whether this is a target device
 */
function isTargetDevice(peripheral) {
  // Check if the device has the required service UUID
  // This is a simple check - you might need more sophisticated filtering
  const serviceUuids = peripheral.advertisement.serviceUuids || [];
  return serviceUuids.some(
    (uuid) => uuid.toLowerCase() === bluetoothConfig.serviceUUID.toLowerCase()
  );
}

/**
 * Connect to a Bluetooth device
 * @param {Object} peripheral - Noble peripheral object
 */
async function connectToDevice(peripheral) {
  try {
    console.log(
      `🔌 Connecting to device: ${peripheral.id} (${
        peripheral.advertisement.localName || "Unknown"
      })`
    );

    // Connect to the peripheral
    await peripheral.connectAsync();
    console.log(`✅ Connected to device: ${peripheral.id}`);

    // Store the connected device
    connectionState.connectedDevices.set(peripheral.id, peripheral);
    connectionState.reconnectCount.set(peripheral.id, 0);

    // Set up disconnect handler
    peripheral.once("disconnect", async () => {
      console.log(`🔌 Device disconnected: ${peripheral.id}`);
      connectionState.connectedDevices.delete(peripheral.id);

      // Try to reconnect if appropriate
      const reconnectCount =
        connectionState.reconnectCount.get(peripheral.id) || 0;

      if (reconnectCount < bluetoothConfig.maxReconnectAttempts) {
        connectionState.reconnectCount.set(peripheral.id, reconnectCount + 1);

        // Implement exponential backoff for reconnect delay
        const delay = Math.min(
          bluetoothConfig.reconnectDelay * Math.pow(2, reconnectCount),
          bluetoothConfig.maxReconnectDelay
        );

        console.log(
          `🔄 Will attempt to reconnect to device ${
            peripheral.id
          } in ${delay}ms (attempt ${reconnectCount + 1}/${
            bluetoothConfig.maxReconnectAttempts
          })`
        );

        setTimeout(async () => {
          try {
            await connectToDevice(peripheral);
          } catch (error) {
            console.error(
              `❌ Error reconnecting to device ${peripheral.id}: ${error.message}`
            );
          }
        }, delay);
      } else {
        console.log(
          `⚠️ Maximum reconnect attempts reached for device ${peripheral.id}`
        );
      }
    });

    // Discover services and characteristics
    const services = await peripheral.discoverServicesAsync([
      bluetoothConfig.serviceUUID,
    ]);

    if (services.length === 0) {
      throw new Error(`No matching services found on device: ${peripheral.id}`);
    }

    const service = services[0];

    // Discover characteristics
    const characteristics = await service.discoverCharacteristicsAsync([
      bluetoothConfig.dataCharacteristicUUID,
      bluetoothConfig.statusCharacteristicUUID,
    ]);

    // Set up notifications for data characteristic
    const dataCharacteristic = characteristics.find(
      (c) =>
        c.uuid.toLowerCase() ===
        bluetoothConfig.dataCharacteristicUUID.toLowerCase()
    );

    if (dataCharacteristic) {
      await dataCharacteristic.subscribeAsync();
      console.log(
        `📡 Subscribed to data notifications for device: ${peripheral.id}`
      );

      dataCharacteristic.on("data", async (data) => {
        await handleDeviceData(peripheral.id, data);
      });
    }

    // Set up notifications for status characteristic
    const statusCharacteristic = characteristics.find(
      (c) =>
        c.uuid.toLowerCase() ===
        bluetoothConfig.statusCharacteristicUUID.toLowerCase()
    );

    if (statusCharacteristic) {
      await statusCharacteristic.subscribeAsync();
      console.log(
        `📡 Subscribed to status notifications for device: ${peripheral.id}`
      );

      statusCharacteristic.on("data", async (data) => {
        await handleDeviceStatus(peripheral.id, data);
      });
    }

    // Find the device in the database
    const device = await Device.findOne({ serialNumber: peripheral.id });

    if (device) {
      // Update device connection status
      device.lastConnected = new Date();
      device.connectionStatus = "connected";
      await device.save();

      console.log(
        `📱 Updated device ${peripheral.id} connection status in database`
      );
    } else {
      console.log(`⚠️ Device ${peripheral.id} not found in database`);
    }
  } catch (error) {
    console.error(
      `❌ Error connecting to device ${peripheral.id}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Handle device data received via Bluetooth
 * @param {string} deviceId - Device ID
 * @param {Buffer} data - Raw data from device
 */
async function handleDeviceData(deviceId, data) {
  try {
    // Update message stats
    connectionState.lastMessageTime.set(deviceId, new Date());
    connectionState.messageCount++;

    // Only log every 10th message if verbose logging is disabled
    const shouldLog =
      bluetoothConfig.verboseLogging || connectionState.messageCount % 10 === 0;

    if (shouldLog) {
      console.log(`📩 Received data from device: ${deviceId}`);
    }

    // Find device in database
    const device = await Device.findOne({ serialNumber: deviceId });

    if (!device) {
      if (shouldLog) {
        console.warn(`⚠️ Device not found in database: ${deviceId}`);
      }
      return;
    }

    // Parse the data based on your device's data format
    // This is a placeholder - you'll need to implement this based on your device's data format
    const parsedData = parseDeviceData(data);

    if (!parsedData) {
      return;
    }

    // Process the data based on type
    if (parsedData.type === "emg") {
      await processEMGData(device, parsedData, shouldLog);
    } else if (parsedData.type === "ems") {
      await processEMSData(device, parsedData, shouldLog);
    }
  } catch (error) {
    console.error(`❌ Error handling device data: ${error.message}`);
  }
}

/**
 * Parse raw device data into a structured format
 * @param {Buffer} data - Raw data from device
 * @returns {Object|null} - Parsed data or null if invalid
 */
function parseDeviceData(data) {
  try {
    // This is a placeholder implementation
    // You'll need to implement this based on your device's data format

    // Example: First byte indicates data type (1 = EMG, 2 = EMS)
    const dataType = data[0];

    if (dataType === 1) {
      // EMG data
      // Example format: [1, sessionId(4 bytes), timestamp(8 bytes), value1, value2, ...]
      const sessionId = data.readUInt32LE(1).toString();
      const timestamp = new Date(data.readBigUInt64LE(5));

      // Extract data points (remaining bytes are values)
      const dataPoints = [];
      for (let i = 13; i < data.length; i += 2) {
        if (i + 1 < data.length) {
          dataPoints.push({
            timestamp,
            value: data.readInt16LE(i),
          });
        }
      }

      return {
        type: "emg",
        sessionId,
        dataPoints,
        metadata: {
          source: "bluetooth",
          deviceType: "myozen",
        },
      };
    } else if (dataType === 2) {
      // EMS data
      // Example format: [2, sessionId(4 bytes), timestamp(8 bytes), params...]
      const sessionId = data.readUInt32LE(1).toString();
      const timestamp = new Date(data.readBigUInt64LE(5));

      // Extract stimulation parameters
      const intensity = data[13];
      const frequency = data[14];
      const pulseWidth = data[15];

      return {
        type: "ems",
        sessionId,
        stimulationParameters: {
          intensity,
          frequency,
          pulseWidth,
        },
        responseData: [
          {
            timestamp,
            response: data.slice(16),
          },
        ],
        metadata: {
          source: "bluetooth",
          deviceType: "myozen",
        },
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Error parsing device data: ${error.message}`);
    return null;
  }
}

/**
 * Process EMG data from device
 * @param {Object} device - Device document
 * @param {Object} data - Parsed EMG data
 * @param {boolean} shouldLog - Whether to log processing details
 */
async function processEMGData(device, data, shouldLog = false) {
  try {
    // Update device last connected timestamp
    device.lastConnected = new Date();
    await device.save();

    // Find or create EMG session
    const existingSession = await EMGData.findOne({
      sessionId: data.sessionId,
      device: device._id,
    });

    if (existingSession) {
      // Append data to existing session
      await EMGData.findByIdAndUpdate(existingSession._id, {
        $push: { dataPoints: { $each: data.dataPoints } },
        endTime: new Date(),
      });

      if (shouldLog) {
        console.log(
          `📊 Updated EMG session ${data.sessionId} with ${
            data.dataPoints?.length || 0
          } new data points`
        );
      }
    } else {
      // Create new session
      const newSession = await EMGData.create({
        device: device._id,
        patient: device.assignedPatient,
        doctor: device.assignedDoctor,
        sessionId: data.sessionId,
        dataPoints: data.dataPoints,
        metadata: data.metadata,
        syncStatus: {
          synced: false,
        },
      });

      if (shouldLog) {
        console.log(
          `📊 Created new EMG session ${data.sessionId} with ID ${newSession._id}`
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error processing EMG data: ${error.message}`);
  }
}

/**
 * Process EMS data from device
 * @param {Object} device - Device document
 * @param {Object} data - Parsed EMS data
 * @param {boolean} shouldLog - Whether to log processing details
 */
async function processEMSData(device, data, shouldLog = false) {
  try {
    // Update device last connected timestamp
    device.lastConnected = new Date();
    await device.save();

    // Find or create EMS session
    const existingSession = await EMSData.findOne({
      sessionId: data.sessionId,
      device: device._id,
    });

    if (existingSession) {
      // Update existing session
      await EMSData.findByIdAndUpdate(existingSession._id, {
        $push: { responseData: { $each: data.responseData || [] } },
        endTime: new Date(),
      });

      if (shouldLog) {
        console.log(
          `📊 Updated EMS session ${data.sessionId} with ${
            data.responseData?.length || 0
          } new data points`
        );
      }
    } else {
      // Create new session
      const newSession = await EMSData.create({
        device: device._id,
        patient: device.assignedPatient,
        doctor: device.assignedDoctor,
        sessionId: data.sessionId,
        stimulationParameters: data.stimulationParameters,
        stimulationPattern: data.stimulationPattern,
        responseData: data.responseData || [],
        metadata: data.metadata,
        syncStatus: {
          synced: false,
        },
      });

      if (shouldLog) {
        console.log(
          `📊 Created new EMS session ${data.sessionId} with ID ${newSession._id}`
        );
      }
    }
  } catch (error) {
    console.error(`❌ Error processing EMS data: ${error.message}`);
  }
}

/**
 * Handle device status updates
 * @param {string} deviceId - Device ID
 * @param {Buffer} data - Raw status data from device
 */
async function handleDeviceStatus(deviceId, data) {
  try {
    // Parse the status data
    // This is a placeholder - you'll need to implement this based on your device's status format
    const status = parseDeviceStatus(data);

    if (!status) {
      return;
    }

    // Find device in database
    const device = await Device.findOne({ serialNumber: deviceId });

    if (!device) {
      console.warn(`⚠️ Device not found in database: ${deviceId}`);
      return;
    }

    // Update device status
    const updates = {};

    if (status.batteryLevel !== undefined) {
      updates.batteryLevel = status.batteryLevel;
    }

    if (status.firmwareVersion) {
      updates.firmwareVersion = status.firmwareVersion;
    }

    if (Object.keys(updates).length > 0) {
      updates.lastConnected = new Date();
      await Device.findByIdAndUpdate(device._id, updates);

      console.log(
        `📱 Updated device ${deviceId} status: ${JSON.stringify(updates)}`
      );
    }
  } catch (error) {
    console.error(`❌ Error handling device status: ${error.message}`);
  }
}

/**
 * Parse raw device status data
 * @param {Buffer} data - Raw status data from device
 * @returns {Object|null} - Parsed status or null if invalid
 */
function parseDeviceStatus(data) {
  try {
    // This is a placeholder implementation
    // You'll need to implement this based on your device's status format

    // Example: First byte is battery level (0-100)
    const batteryLevel = data[0];

    // Example: Next 4 bytes are firmware version (major.minor.patch.build)
    const major = data[1];
    const minor = data[2];
    const patch = data[3];
    const build = data[4];
    const firmwareVersion = `${major}.${minor}.${patch}.${build}`;

    return {
      batteryLevel,
      firmwareVersion,
    };
  } catch (error) {
    console.error(`❌ Error parsing device status: ${error.message}`);
    return null;
  }
}
