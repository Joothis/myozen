// mqtt.service.js - MQTT service for IoT device communication

const mqtt = require("mqtt");
const Device = require("../models/device.model");
const { EMGData, EMSData } = require("../models/data.model");

// MQTT Service configuration
const mqttConfig = {
  // Set to true for verbose logging (development only)
  verboseLogging: process.env.NODE_ENV === "development",
  // Maximum number of connection attempts
  maxReconnectAttempts: 10,
  // Initial reconnect delay in ms (will increase with backoff)
  reconnectDelay: 1000,
  // Maximum reconnect delay in ms
  maxReconnectDelay: 30000,
  // Connection timeout in ms
  connectTimeout: 10000,
  // Keep alive interval in seconds
  keepalive: 60,
};

// Track connection state
let connectionState = {
  isConnected: false,
  reconnectCount: 0,
  lastMessageTime: null,
  messageCount: 0,
  // Reset message count every 5 seconds to avoid flooding logs
  messageCountResetInterval: null,
};

/**
 * Setup MQTT client for IoT device communication
 */
exports.setupMqttClient = () => {
  // Check if MQTT broker URL is configured
  if (!process.env.MQTT_BROKER_URL) {
    console.warn(
      "⚠️ MQTT broker URL not configured. MQTT client will not be started."
    );
    return null;
  }

  console.log(`🔄 Connecting to MQTT broker: ${process.env.MQTT_BROKER_URL}`);

  // Connect to MQTT broker with improved options
  const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `healthcare_backend_${Math.random()
      .toString(16)
      .substring(2, 8)}`,
    clean: true,
    connectTimeout: mqttConfig.connectTimeout,
    reconnectPeriod: mqttConfig.reconnectDelay,
    keepalive: mqttConfig.keepalive,
  });

  // Set up message count reset interval
  connectionState.messageCountResetInterval = setInterval(() => {
    if (connectionState.messageCount > 0 && mqttConfig.verboseLogging) {
      console.log(
        `📊 Processed ${connectionState.messageCount} MQTT messages in the last 5 seconds`
      );
    }
    connectionState.messageCount = 0;
  }, 5000);

  // Handle connection
  client.on("connect", () => {
    connectionState.isConnected = true;
    connectionState.reconnectCount = 0;
    console.log("🔌 Connected to MQTT broker");

    // Subscribe to device topics
    client.subscribe("devices/+/data", (err) => {
      if (err) {
        console.error("MQTT subscription error:", err);
      } else if (mqttConfig.verboseLogging) {
        console.log("📡 Subscribed to device data topics");
      }
    });

    client.subscribe("devices/+/status", (err) => {
      if (err) {
        console.error("MQTT subscription error:", err);
      } else if (mqttConfig.verboseLogging) {
        console.log("📡 Subscribed to device status topics");
      }
    });
  });

  // Handle disconnect
  client.on("disconnect", () => {
    connectionState.isConnected = false;
    console.log("🔌 Disconnected from MQTT broker");
  });

  // Handle close
  client.on("close", () => {
    connectionState.isConnected = false;
    if (mqttConfig.verboseLogging) {
      console.log("🔌 MQTT connection closed");
    }
  });

  // Handle errors
  client.on("error", (err) => {
    console.error("❌ MQTT client error:", err.message);

    // If we've exceeded max reconnect attempts, stop trying
    if (connectionState.reconnectCount >= mqttConfig.maxReconnectAttempts) {
      console.error(
        `❌ Maximum MQTT reconnect attempts (${mqttConfig.maxReconnectAttempts}) reached. Stopping reconnect.`
      );
      client.end(true);

      // Clear the message count interval
      if (connectionState.messageCountResetInterval) {
        clearInterval(connectionState.messageCountResetInterval);
        connectionState.messageCountResetInterval = null;
      }
    }
  });

  // Handle reconnect
  client.on("reconnect", () => {
    connectionState.reconnectCount++;

    // Implement exponential backoff for reconnect delay
    const newDelay = Math.min(
      mqttConfig.reconnectDelay * Math.pow(2, connectionState.reconnectCount),
      mqttConfig.maxReconnectDelay
    );

    client.options.reconnectPeriod = newDelay;

    if (mqttConfig.verboseLogging || connectionState.reconnectCount % 5 === 0) {
      console.log(
        `🔄 Reconnecting to MQTT broker... (Attempt ${connectionState.reconnectCount})`
      );
    }
  });

  // Handle messages
  client.on("message", async (topic, message) => {
    try {
      // Update message stats
      connectionState.lastMessageTime = new Date();
      connectionState.messageCount++;

      // Only log every 10th message if verbose logging is disabled
      const shouldLog =
        mqttConfig.verboseLogging || connectionState.messageCount % 10 === 0;

      if (shouldLog) {
        console.log(`📩 Received message on topic: ${topic}`);
      }

      // Parse topic to get device ID
      const topicParts = topic.split("/");
      const deviceId = topicParts[1];
      const messageType = topicParts[2];

      // Find device in database
      const device = await Device.findOne({ serialNumber: deviceId });

      if (!device) {
        if (shouldLog) {
          console.warn(`⚠️ Device not found: ${deviceId}`);
        }
        return;
      }

      // Parse message
      const data = JSON.parse(message.toString());

      // Handle different message types
      if (messageType === "data") {
        await handleDeviceData(device, data, shouldLog);
      } else if (messageType === "status") {
        await handleDeviceStatus(device, data, shouldLog);
      }
    } catch (error) {
      console.error("❌ Error processing MQTT message:", error.message);
    }
  });

  // Add a method to properly disconnect
  client.disconnect = () => {
    // Clear the message count interval
    if (connectionState.messageCountResetInterval) {
      clearInterval(connectionState.messageCountResetInterval);
      connectionState.messageCountResetInterval = null;
    }

    // End the client connection
    if (client.connected) {
      console.log("🔌 Disconnecting from MQTT broker...");
      client.end(true);
    }
  };

  // Add a method to get connection status
  client.getStatus = () => {
    return {
      isConnected: connectionState.isConnected,
      reconnectCount: connectionState.reconnectCount,
      lastMessageTime: connectionState.lastMessageTime,
      messageCount: connectionState.messageCount,
    };
  };

  return client;
};

/**
 * Handle device data messages
 * @param {Object} device - Device document
 * @param {Object} data - Data from device
 * @param {boolean} shouldLog - Whether to log processing details
 */
async function handleDeviceData(device, data, shouldLog = false) {
  try {
    // Update device last connected timestamp
    device.lastConnected = new Date();
    await device.save();

    // Check data type
    if (data.type === "emg") {
      // Handle EMG data
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
    } else if (data.type === "ems") {
      // Handle EMS data
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
    }
  } catch (error) {
    console.error("❌ Error handling device data:", error.message);
  }
}

/**
 * Handle device status messages
 * @param {Object} device - Device document
 * @param {Object} status - Status from device
 * @param {boolean} shouldLog - Whether to log processing details
 */
async function handleDeviceStatus(device, status, shouldLog = false) {
  try {
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

      if (shouldLog) {
        console.log(
          `📱 Updated device ${device.serialNumber} status: ${JSON.stringify(
            updates
          )}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error handling device status:", error.message);
  }
}
