# AutoAttend UI/UX Design and Development

## Overview
You are an expert UI/UX designer and front-end engineer. Your task is to design the complete user interface for a smart attendance management system called **“AutoAttend”**. The system will have both web and mobile versions, using **React.js** and **React Native**, respectively. The design must be responsive, role-aware, and follow a clean, productivity-focused design system.

### Design Guidelines
- **Color Palette**: Blue/Green
- **Fonts**: Inter/Roboto
- **Styling**: Tailwind CSS (web), React Native StyleSheet (mobile)

---

## Pages/Components

### 1. LoginPage
- **Fields**: Email, Password, “Remember Me” checkbox, “Forgot Password?” link
- **Logic**: JWT-based authentication, redirect to role-based Dashboard on success
- **Layout**: Centered card, minimal inputs, primary “Login” button

### 2. Dashboard
- **Role-Aware Widgets**:
    - **Employee**: “Clock In/Out” shortcut, Today’s status, Upcoming shifts
    - **Manager**: Team summary, Pending leaves, Quick report links
    - **Admin**: Company stats, System settings shortcut
- **Layout**: Top navigation or sidebar + grid of cards

### 3. ClockInOutPage
- **Controls**: Big “Clock In/Out” button, QR-scanner component, “Face Recognition” capture
- **Display**: Current time, today’s logs, location (optional)
- **Feedback**: Success/toast animation on check-in

### 4. AttendanceHistoryPage
- **Views**:
    - **Table**: Columns – Date, In, Out, Status
    - **Calendar**: Visual pattern of present/absent
- **Toggle**: Buttons or tabs to switch views; filter by date/month

### 5. LeaveRequestPage
- **Form**:
    - Dropdown – Leave Type (Sick, Casual, Earned)
    - Date pickers – From/To
    - Reason text area
- **List**: Recent requests with status badges (Pending/Approved/Rejected)

### 6. LeaveApprovalPage
- **List**: Pending leave requests – name, dates, reason
- **Actions**: Approve/Reject buttons inline
- **Filters**: By date, department, status; pagination if needed

### 7. TeamOverviewPage
- **Summary Cards**: Present, Absent, Late counts for today
- **Table**: All employees – photo, name, status, in-time, out-time
- **Filter**: Department, shift

### 8. ShiftSchedulerPage
- **Interface**: Weekly calendar grid + drag-and-drop shift blocks
- **Form**: Assign shift – employee dropdown, start/end time, days selector
- **List**: Current schedule in table or list

### 9. ReportsPage
- **Charts**:
    - Bar/Line – Attendance over time
    - Pie – Leave type distribution
    - Leaderboard – Top 5 late arrivers
- **Controls**: Date range picker, export to PDF/CSV

### 10. SettingsPage
- **Profile**: Edit name, email, password (with validation)
- **Preferences**: Dark mode toggle, Notification settings
- **Action**: Logout button

---

## Shared Components
- **Button**: Variants – primary, secondary, danger
- **InputField**: Text, date, dropdown
- **Modal**: Confirm dialogs
- **Card**: Container with header/body
- **DataTable**: Sortable, paginated table
- **QRScannerComponent** & **FaceCaptureComponent**
- **Toast**: For success/error notifications

---

## Routing & Security
- **Protected Routes**: Use React Router (web) or React Navigation (mobile) based on role.
- **JWT Storage**: Use `localStorage` (web) or `SecureStore` (mobile).

---

## Deliverables
1. **Folder Structure**: Modular structure for each page and shared components.
2. **Code Snippets**:
     - JSX/TSX (web) and React Native (mobile) with basic styling.
     - Short comments explaining structure, props, and behavior.

---

## Backend Summary for Healthcare IoT Application

### Project Structure
- Modular folder structure with `controllers`, `models`, `routes`, `services`, `middleware`, and `config`.
- Environment variables setup using `dotenv`.
- Docker support with `Dockerfile` and `docker-compose.yml`.

### Authentication System
- JWT-based authentication with secure password storage.
- User model with doctor-specific fields.
- Login/signup routes and controllers.

### Device Management
- Device model with EMG/EMS-specific settings.
- Device registration and association with patients.
- Routes for device CRUD operations.

### Patient Management
- Patient model with medical information.
- Patient registration and association with doctors.
- Routes for patient CRUD operations.

### Data Handling
- Models for EMG and EMS data.
- Endpoints for posting and retrieving data.
- Support for data analytics and visualization.

### Real-time Communication
- WebSocket server for real-time data streaming.
- MQTT client for IoT device communication.
- Handlers for device data and status messages.

### Data Synchronization
- Sync service for offline data synchronization.
- Mechanisms to store data locally and sync to cloud.
- Support for manual and automatic syncing.

### Security
- Data encryption for sensitive information.
- Authentication middleware for secure API access.
- Secure communication protocols.

### Seeding
- Seed script to initialize the database with test data.

Summary
I've created a comprehensive backend setup for your healthcare IoT application. Here's what I've implemented:

Project Structure:
Created a modular folder structure with controllers, models, routes, services, middleware, and config
Set up environment variables with dotenv
Added Docker support with Dockerfile and docker-compose.yml
Authentication System:
Implemented JWT-based authentication with secure password storage
Created user model with doctor-specific fields
Added login/signup routes and controllers
Device Management:
Created device model with EMG/EMS specific settings
Implemented device registration and association with patients
Added routes for device CRUD operations
Patient Management:
Created patient model with medical information
Implemented patient registration and association with doctors
Added routes for patient CRUD operations
Data Handling:
Created models for EMG and EMS data
Implemented endpoints for posting and retrieving data
Added support for data analytics and visualization
Real-time Communication:
Set up WebSocket server for real-time data streaming
Implemented MQTT client for IoT device communication
Added handlers for device data and status messages
Data Synchronization:
Created a sync service for offline data synchronization
Implemented mechanisms to store data locally and sync to cloud
Added support for manual and automatic syncing
Security:
Implemented data encryption for sensitive information
Added authentication middleware for secure API access
Set up secure communication protocols
Seeding:
Created a seed script to initialize the database with test data
How to Use
Setup the Backend:
# Make the setup script executable
chmod +x setup-backend.sh

# Run the setup script
./setup-backend.sh
Start the Development Server:
Seed the Database with Test Data:
Run with Docker:
API Endpoints
Authentication:
POST /api/auth/register - Register a new user
POST /api/auth/login - Login user
GET /api/auth/me - Get current user profile
PUT /api/auth/me - Update user profile
PUT /api/auth/change-password - Change password
Devices:
GET /api/devices - Get all devices
POST /api/devices - Register a new device
GET /api/devices/:id - Get a specific device
PUT /api/devices/:id - Update a device
DELETE /api/devices/:id - Delete a device
Patients:
GET /api/patients - Get all patients
POST /api/patients - Register a new patient
GET /api/patients/:id - Get a specific patient
PUT /api/patients/:id - Update a patient
DELETE /api/patients/:id - Delete a patient
Data:
POST /api/data/emg - Post new EMG data
POST /api/data/ems - Post new EMS data
GET /api/data/emg/patient/:patientId - Get EMG data for a patient
GET /api/data/ems/patient/:patientId - Get EMS data for a patient
GET /api/data/emg/:id - Get a specific EMG session
GET /api/data/ems/:id - Get a specific EMS session
This backend is now ready to serve your healthcare React Native app with all the required functionality for EMG/EMS device management, real-time data handling, and secure user authentication.