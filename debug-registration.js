#!/usr/bin/env node

/**
 * Registration Debug Script
 * 
 * This script helps diagnose registration issues by:
 * 1. Testing environment variable configuration
 * 2. Verifying API endpoints
 * 3. Testing registration with sample data
 * 4. Providing detailed error analysis
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const CONFIG = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  serverPort: process.env.PORT || 5000,
  timeout: 10000
};

console.log('🔧 Registration Debug Script');
console.log('============================\n');

// Test data for registration
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  phoneNumber: '+1234567890',
  guardianPhone: '+1234567891',
  currentLocation: 'Test City',
  country: 'Egypt'
};

// Utility functions
const logSection = (title) => {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(title.length + 4));
};

const logSuccess = (message) => {
  console.log(`✅ ${message}`);
};

const logError = (message) => {
  console.log(`❌ ${message}`);
};

const logWarning = (message) => {
  console.log(`⚠️ ${message}`);
};

const logInfo = (message) => {
  console.log(`ℹ️ ${message}`);
};

// 1. Environment Configuration Check
logSection('Environment Configuration');
console.log('Environment variables:');
console.log(`  VITE_API_BASE_URL: ${process.env.VITE_API_BASE_URL || 'NOT SET'}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`  PORT: ${process.env.PORT || 'NOT SET'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

if (!process.env.VITE_API_BASE_URL) {
  logError('VITE_API_BASE_URL is not set in .env file');
  logInfo('Please create a .env file with: VITE_API_BASE_URL=http://localhost:5000/api');
} else {
  logSuccess('VITE_API_BASE_URL is configured');
}

// 2. API Base URL Validation
logSection('API Base URL Validation');
console.log(`Using API Base URL: ${CONFIG.apiBaseUrl}`);

// Check if URL is valid
try {
  new URL(CONFIG.apiBaseUrl);
  logSuccess('API Base URL is valid');
} catch (error) {
  logError('API Base URL is invalid');
  console.log(`  Error: ${error.message}`);
}

// 3. Server Connectivity Test
logSection('Server Connectivity Test');

const testServerConnection = async () => {
  try {
    const response = await axios.get(`${CONFIG.apiBaseUrl.replace('/api', '')}/health`, {
      timeout: CONFIG.timeout
    });
    logSuccess(`Server is running (Status: ${response.status})`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Server is not running or not accessible');
      logInfo(`Expected server at: ${CONFIG.apiBaseUrl.replace('/api', '')}`);
      logInfo('Please start the backend server first');
    } else if (error.code === 'ENOTFOUND') {
      logError('Server hostname not found');
      logInfo('Check if the server URL is correct');
    } else {
      logWarning(`Server connection failed: ${error.message}`);
    }
    return false;
  }
};

// 4. API Endpoints Test
logSection('API Endpoints Test');

const testEndpoints = async () => {
  const endpoints = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/validate-token'
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${CONFIG.apiBaseUrl.replace('/api', '')}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      // Try to make a request to see if endpoint exists
      await axios.get(url, { timeout: 5000 });
      logSuccess(`${endpoint} - Endpoint exists`);
    } catch (error) {
      if (error.response?.status === 405) {
        logSuccess(`${endpoint} - Endpoint exists (Method not allowed for GET)`);
      } else if (error.response?.status === 404) {
        logError(`${endpoint} - Endpoint not found`);
      } else {
        logWarning(`${endpoint} - ${error.message}`);
      }
    }
  }
};

// 5. Registration Test
logSection('Registration Test');

const testRegistration = async () => {
  try {
    console.log('Attempting registration with test data:');
    console.log(`  Email: ${testUser.email}`);
    console.log(`  Name: ${testUser.name}`);
    console.log(`  Phone: ${testUser.phoneNumber}`);
    
    const response = await axios.post(`${CONFIG.apiBaseUrl}/auth/register`, testUser, {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Registration successful!');
    console.log('Response data:', {
      status: response.status,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      userId: response.data.user?.id
    });
    
    return response.data;
  } catch (error) {
    logError('Registration failed');
    
    if (axios.isAxiosError(error)) {
      console.log('Error details:');
      console.log(`  Status: ${error.response?.status}`);
      console.log(`  Status Text: ${error.response?.statusText}`);
      console.log(`  URL: ${error.config?.url}`);
      console.log(`  Method: ${error.config?.method}`);
      
      if (error.response?.data) {
        console.log('  Response data:', error.response.data);
      }
      
      // Specific error handling
      if (error.response?.status === 409) {
        logInfo('User already exists - this is expected for duplicate emails');
      } else if (error.response?.status === 400) {
        logInfo('Bad request - check the data format');
      } else if (error.response?.status === 500) {
        logInfo('Server error - check backend logs');
      } else if (error.code === 'ERR_NETWORK') {
        logInfo('Network error - check server connectivity');
      }
    } else {
      console.log('  Error:', error.message);
    }
    
    return null;
  }
};

// 6. Login Test
logSection('Login Test');

const testLogin = async (email, password) => {
  try {
    console.log(`Attempting login with: ${email}`);
    
    const response = await axios.post(`${CONFIG.apiBaseUrl}/auth/login`, {
      email,
      password
    }, {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Login successful!');
    console.log('Response data:', {
      status: response.status,
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      userId: response.data.user?.id,
      userRole: response.data.user?.role
    });
    
    return response.data;
  } catch (error) {
    logError('Login failed');
    
    if (axios.isAxiosError(error)) {
      console.log(`  Status: ${error.response?.status}`);
      if (error.response?.data) {
        console.log('  Response data:', error.response.data);
      }
    }
    
    return null;
  }
};

// 7. Token Validation Test
logSection('Token Validation Test');

const testTokenValidation = async (token) => {
  if (!token) {
    logWarning('No token available for validation test');
    return;
  }
  
  try {
    console.log('Testing token validation...');
    
    const response = await axios.get(`${CONFIG.apiBaseUrl}/validate-token`, {
      timeout: CONFIG.timeout,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    logSuccess('Token validation successful!');
    console.log('Response data:', response.data);
    
  } catch (error) {
    logError('Token validation failed');
    
    if (axios.isAxiosError(error)) {
      console.log(`  Status: ${error.response?.status}`);
      if (error.response?.data) {
        console.log('  Response data:', error.response.data);
      }
    }
  }
};

// Main execution
const main = async () => {
  try {
    // Test server connection first
    const serverConnected = await testServerConnection();
    
    if (serverConnected) {
      // Test endpoints
      await testEndpoints();
      
      // Test registration
      const registrationResult = await testRegistration();
      
      if (registrationResult) {
        // Test login with the registered user
        const loginResult = await testLogin(testUser.email, testUser.password);
        
        if (loginResult) {
          // Test token validation
          await testTokenValidation(loginResult.token);
        }
      }
    }
    
  } catch (error) {
    logError('Script execution failed');
    console.log('Error:', error.message);
  }
  
  console.log('\n🔧 Debug script completed');
  console.log('\n📝 Troubleshooting Tips:');
  console.log('1. Ensure the backend server is running on port 5000');
  console.log('2. Check that .env file exists with VITE_API_BASE_URL=http://localhost:5000/api');
  console.log('3. Verify database connection in backend');
  console.log('4. Check backend console for any error messages');
  console.log('5. Ensure all required environment variables are set');
};

// Run the script
main().catch(console.error);
