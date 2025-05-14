# Authentication Guide for Healthcare IoT Backend

This guide explains how to use the authentication system implemented in the backend for your healthcare IoT application.

## Authentication Flow

The authentication system provides three main endpoints:

1. **Login** - Authenticates users and returns a JWT token
2. **Forgot Password** - Generates a password reset token
3. **Reset Password** - Resets a user's password using a token

### Login Flow

1. User enters email and password
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates credentials
4. If valid, backend returns a JWT token and user information
5. Frontend stores the token (e.g., in localStorage or secure cookie)
6. Frontend includes the token in the Authorization header for subsequent API requests

### Forgot Password Flow

1. User enters email address
2. Frontend sends email to `/api/auth/forgot-password`
3. Backend generates a reset token
4. In a real implementation, backend would send an email with a reset link
5. For this demo, the token is returned directly in the response

### Reset Password Flow

1. User clicks reset link or enters reset token and new password
2. Frontend sends token and new password to `/api/auth/reset-password`
3. Backend validates the token
4. If valid, backend updates the user's password
5. User can now log in with the new password

## API Endpoints

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "doctor",
      "specialization": "Neurology",
      "isActive": true,
      "lastLogin": "2023-05-09T12:34:56.789Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a password reset link"
}
```

### Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "newpassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

## Frontend Integration

### Storing the JWT Token

After a successful login, store the JWT token securely:

```javascript
// Example using localStorage (consider more secure options in production)
function handleLogin(email, password) {
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      // Redirect to dashboard or home page
    } else {
      // Show error message
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    // Show error message
  });
}
```

### Making Authenticated Requests

Include the JWT token in the Authorization header for API requests:

```javascript
function fetchData(url) {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => {
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    return response.json();
  });
}
```

### Implementing Forgot Password

```javascript
function handleForgotPassword(email) {
  fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show success message
    } else {
      // Show error message
    }
  })
  .catch(error => {
    console.error('Forgot password error:', error);
    // Show error message
  });
}
```

### Implementing Reset Password

```javascript
function handleResetPassword(token, newPassword) {
  fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, newPassword })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show success message and redirect to login
    } else {
      // Show error message
    }
  })
  .catch(error => {
    console.error('Reset password error:', error);
    // Show error message
  });
}
```

## Security Considerations

1. **Use HTTPS** - Always use HTTPS in production to encrypt data in transit
2. **Token Storage** - Consider using secure cookies or other secure storage mechanisms instead of localStorage
3. **Token Expiration** - Set appropriate expiration times for tokens
4. **Rate Limiting** - Implement rate limiting to prevent brute force attacks
5. **Password Requirements** - Enforce strong password requirements
6. **Secure Headers** - Use security headers like Content-Security-Policy, X-XSS-Protection, etc.

## Next Steps

1. Integrate this authentication system with your React Native frontend
2. Implement proper password hashing with bcrypt in production
3. Set up email sending for password reset links
4. Add additional security measures like rate limiting and account lockout
5. Implement user registration if needed in the future
