// server.js - Main entry point for the Healthcare IoT Backend

console.log("Starting Healthcare IoT Backend server...");

// Load environment variables
require("dotenv").config();
console.log("Environment variables loaded.");

// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http");
const socketIo = require("socket.io");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

// Import routes
const authRoutes = require("./routes/auth.routes");
const deviceRoutes = require("./routes/device.routes");
const patientRoutes = require("./routes/patient.routes");
const dataRoutes = require("./routes/data.routes");

// Import middleware
const { errorHandler } = require("./middleware/error.middleware");
const { authMiddleware } = require("./middleware/auth.middleware");

// Import services
const { setupBluetoothClient } = require("./services/bluetooth.service");
const { syncService } = require("./services/sync.service");

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Apply middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
); // Security headers with CSP configured for the login page
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("dev")); // HTTP request logger
app.use(express.static("src/public")); // Serve static files from public directory

// Apply rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Connect to MongoDB
const { connectDB, initializeDB } = require("./config/database");
connectDB()
  .then(() => {
    // Initialize database with default data if needed
    return initializeDB();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Setup WebSocket for real-time communication
io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  // Join a specific device room
  socket.on("join-device", (deviceId) => {
    socket.join(`device-${deviceId}`);
    console.log(`Client joined device-${deviceId} room`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});

// Setup Bluetooth client for IoT devices
const bluetoothClient = setupBluetoothClient();

// Add Bluetooth status endpoint
app.get("/api/bluetooth/status", authMiddleware, (_, res) => {
  res.json({
    success: true,
    data: bluetoothClient.getStatus(),
  });
});

// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/devices", authMiddleware, deviceRoutes);
app.use("/api/patients", authMiddleware, patientRoutes);
app.use("/api/data", authMiddleware, dataRoutes);

// API info route
app.get("/api", (_, res) => {
  const dbUtils = require("./utils/db.utils");
  const dbStatus = dbUtils.getConnectionStatus();

  res.json({
    message: "Healthcare IoT Backend API",
    version: "1.0.0",
    status: "running",
    database: {
      status: dbStatus,
      connected: dbUtils.isConnected(),
    },
    endpoints: {
      auth: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Login with email and password",
        },
        {
          method: "POST",
          path: "/api/auth/forgot-password",
          description: "Request password reset",
        },
        {
          method: "POST",
          path: "/api/auth/reset-password",
          description: "Reset password with token",
        },
        {
          method: "GET",
          path: "/api/auth/me",
          description: "Get current user profile (requires auth)",
        },
        {
          method: "PUT",
          path: "/api/auth/me",
          description: "Update user profile (requires auth)",
        },
        {
          method: "PUT",
          path: "/api/auth/change-password",
          description: "Change password (requires auth)",
        },
      ],
      devices: [
        {
          method: "GET",
          path: "/api/devices",
          description: "Get all devices (requires auth)",
        },
        {
          method: "POST",
          path: "/api/devices",
          description: "Register a new device (requires auth)",
        },
        {
          method: "GET",
          path: "/api/devices/:id",
          description: "Get a specific device (requires auth)",
        },
        {
          method: "PUT",
          path: "/api/devices/:id",
          description: "Update a device (requires auth)",
        },
        {
          method: "DELETE",
          path: "/api/devices/:id",
          description: "Delete a device (requires auth)",
        },
      ],
      patients: [
        {
          method: "GET",
          path: "/api/patients",
          description: "Get all patients (requires auth)",
        },
        {
          method: "POST",
          path: "/api/patients",
          description: "Register a new patient (requires auth)",
        },
        {
          method: "GET",
          path: "/api/patients/:id",
          description: "Get a specific patient (requires auth)",
        },
        {
          method: "PUT",
          path: "/api/patients/:id",
          description: "Update a patient (requires auth)",
        },
        {
          method: "DELETE",
          path: "/api/patients/:id",
          description: "Delete a patient (requires auth)",
        },
      ],
      data: [
        {
          method: "POST",
          path: "/api/data/emg",
          description: "Post new EMG data (requires auth)",
        },
        {
          method: "POST",
          path: "/api/data/ems",
          description: "Post new EMS data (requires auth)",
        },
        {
          method: "GET",
          path: "/api/data/emg/patient/:patientId",
          description: "Get EMG data for a patient (requires auth)",
        },
        {
          method: "GET",
          path: "/api/data/ems/patient/:patientId",
          description: "Get EMS data for a patient (requires auth)",
        },
        {
          method: "GET",
          path: "/api/data/emg/:id",
          description: "Get a specific EMG session (requires auth)",
        },
        {
          method: "GET",
          path: "/api/data/ems/:id",
          description: "Get a specific EMS session (requires auth)",
        },
      ],
      system: [
        {
          method: "GET",
          path: "/api/db/status",
          description: "Get database status",
        },
        {
          method: "GET",
          path: "/api/bluetooth/status",
          description: "Get Bluetooth connection status (requires auth)",
        },
      ],
    },
  });
});

// Database status route
app.get("/api/db/status", (_, res) => {
  const dbUtils = require("./utils/db.utils");

  res.json({
    success: true,
    data: dbUtils.getConnectionInfo(),
  });
});

// Root route - serve login page
app.get("/", (_, res) => {
  res.sendFile("login.html", { root: "src/public" });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
console.log(`Attempting to start server on port ${PORT}...`);

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Try accessing the API at http://localhost:${PORT}/`);
      console.log(`API info: http://localhost:${PORT}/api`);
      console.log(`Database status: http://localhost:${PORT}/api/db/status`);

      // Start cloud sync service
      syncService.startSyncJob();
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please use a different port.`
        );
        process.exit(1);
      }
    });

    // Handle graceful shutdown
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown function
const gracefulShutdown = async () => {
  console.log("Received shutdown signal. Closing server gracefully...");

  // Stop the sync service
  syncService.stopSyncJob();

  // Disconnect Bluetooth client
  if (bluetoothClient && typeof bluetoothClient.disconnect === "function") {
    console.log("Disconnecting Bluetooth client...");
    bluetoothClient.disconnect();
  }

  // Close server
  server.close(() => {
    console.log("HTTP server closed.");

    // Close database connection
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io, bluetoothClient };
