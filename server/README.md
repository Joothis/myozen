# Healthcare IoT Backend

This is the backend server for a healthcare IoT application used by doctors to control and read data from EMG and EMS IoT devices via Bluetooth and Wi-Fi.

## Features

- User authentication with JWT
- Device management
- Patient management
- EMG/EMS data collection and analysis
- Real-time data streaming via WebSockets and MQTT
- Offline-first capabilities with local storage and cloud sync

## Server Architecture

The backend is built with a clean, modular architecture:

- **Express.js**: Web framework for handling HTTP requests
- **MongoDB**: Database for storing user, device, patient, and medical data
- **Socket.IO**: Real-time communication with clients
- **MQTT**: Communication with IoT devices
- **JWT**: Secure authentication

## Project Structure

```
src/
├── config/             # Configuration files
│   ├── database.js     # MongoDB connection configuration
│   └── db-init.js      # Database initialization script
├── controllers/        # Request handlers
│   ├── auth.controller.js
│   ├── device.controller.js
│   ├── patient.controller.js
│   └── data.controller.js
├── middleware/         # Express middleware
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/             # MongoDB models
│   ├── user.model.js
│   ├── device.model.js
│   ├── patient.model.js
│   └── data.model.js
├── public/             # Static files
│   ├── login.html
│   └── dashboard.html
├── routes/             # API routes
│   ├── auth.routes.js
│   ├── device.routes.js
│   ├── patient.routes.js
│   └── data.routes.js
├── services/           # Business logic services
│   ├── mqtt.service.js
│   └── sync.service.js
├── utils/              # Utility functions
│   └── db.utils.js
└── server.js           # Main entry point
```

## Authentication System

The authentication system provides:

- Login functionality for doctors
- Forgot password functionality
- Password reset functionality

For detailed information on how to use the authentication system, see [Authentication Guide](authentication-guide.md).

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/healthcare_iot
MONGODB_URI_PROD=mongodb://mongodb:27017/healthcare_iot

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Encryption Keys (Change these in production!)
ENCRYPTION_KEY=JchpUoN/2qxDe7B/wXXE6PYAzSwAYGPL213oymbSkEs=
SIGNING_KEY=2dL04yEk0Wg84ozJ7xgI6omoVAdhQsSsVZbBku4Fmp9adXkW/+iMsVpB3MPqR9NPCjzMuxU6DMjGjPxI9garQA==

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=mqttuser
MQTT_PASSWORD=mqttpassword

# Cloud Sync Configuration
CLOUD_SYNC_INTERVAL=300000
```

### Database Initialization

Initialize the database with default users:

```bash
npm run db:init
```

This will create:

- An admin user (admin@example.com / admin123)
- A doctor user (john.doe@example.com / doctor123)

### Running the Server

Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:3000.

You can access the API documentation at http://localhost:3000/api.

#### Running Without MQTT

If you're experiencing issues with MQTT connection loops in the terminal, you can run the server without MQTT:

```bash
npm run dev:no-mqtt
```

This will start the server with MQTT disabled, which can be useful during development if you don't need IoT device communication.

#### Testing MQTT Connection

To test your MQTT connection without starting the full server:

```bash
npm run test:mqtt
```

This will attempt to connect to the MQTT broker, subscribe to a test topic, and publish a test message.

## API Endpoints

The server provides a comprehensive set of API endpoints:

### Authentication

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user profile (requires auth)
- `PUT /api/auth/me` - Update user profile (requires auth)
- `PUT /api/auth/change-password` - Change password (requires auth)

### Devices

- `GET /api/devices` - Get all devices (requires auth)
- `POST /api/devices` - Register a new device (requires auth)
- `GET /api/devices/:id` - Get a specific device (requires auth)
- `PUT /api/devices/:id` - Update a device (requires auth)
- `DELETE /api/devices/:id` - Delete a device (requires auth)

### Patients

- `GET /api/patients` - Get all patients (requires auth)
- `POST /api/patients` - Register a new patient (requires auth)
- `GET /api/patients/:id` - Get a specific patient (requires auth)
- `PUT /api/patients/:id` - Update a patient (requires auth)
- `DELETE /api/patients/:id` - Delete a patient (requires auth)

### Data

- `POST /api/data/emg` - Post new EMG data (requires auth)
- `POST /api/data/ems` - Post new EMS data (requires auth)
- `GET /api/data/emg/patient/:patientId` - Get EMG data for a patient (requires auth)
- `GET /api/data/ems/patient/:patientId` - Get EMS data for a patient (requires auth)
- `GET /api/data/emg/:id` - Get a specific EMG session (requires auth)
- `GET /api/data/ems/:id` - Get a specific EMS session (requires auth)

### System

- `GET /api` - API information and available endpoints
- `GET /api/db/status` - Database connection status
- `GET /api/mqtt/status` - MQTT connection status (requires auth)

## MQTT Configuration

The backend uses MQTT for real-time communication with IoT devices. You can configure MQTT in the `.env` file:

```
# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=mqttuser
MQTT_PASSWORD=mqttpassword
```

If you don't have an MQTT broker, you can:

1. Run without MQTT using `npm run dev:no-mqtt`
2. Install a local MQTT broker like [Mosquitto](https://mosquitto.org/)
3. Use a cloud MQTT service like [HiveMQ](https://www.hivemq.com/) or [CloudMQTT](https://www.cloudmqtt.com/)

### Troubleshooting MQTT

If you're experiencing terminal flooding due to MQTT connection attempts:

1. Check if your MQTT broker is running and accessible
2. Verify your MQTT credentials in the `.env` file
3. Run the server without MQTT using `npm run dev:no-mqtt`
4. Test your MQTT connection using `npm run test:mqtt`

## Docker Support

The project includes Docker support for easy deployment:

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

## Testing the API

You can test the API endpoints using curl or Postman:

### Authentication

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"doctor123"}'
```

#### Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com"}'
```

#### Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_RESET_TOKEN","newPassword":"newpassword123"}'
```

### System Information

#### API Info

```bash
curl -X GET http://localhost:3000/api
```

#### Database Status

```bash
curl -X GET http://localhost:3000/api/db/status
```

## License

This project is licensed under the MIT License.
