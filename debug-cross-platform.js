#!/usr/bin/env node

/**
 * Cross-Platform Diagnostic Script
 * 
 * This script provides comprehensive diagnostics that work on both
 * Windows (PowerShell) and Unix systems (Bash, macOS)
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const CONFIG = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  databaseUrl: process.env.DATABASE_URL,
  timeout: 10000
};

console.log('🔧 Cross-Platform Diagnostic Script');
console.log('===================================\n');

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

// 1. System Information
logSection('System Information');
console.log(`Platform: ${process.platform}`);
console.log(`Node.js Version: ${process.version}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Current Directory: ${process.cwd()}`);

// 2. Environment Variables
logSection('Environment Variables');
const envVars = {
  NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'NOT SET',
  DATABASE_URL: process.env.DATABASE_URL || 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  PORT: process.env.PORT || 'NOT SET'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// 3. File System Check
logSection('File System Check');
const importantFiles = [
  '.env',
  'package.json',
  'server/index.js',
  'database.db',
  'src/pages/RegisterPage.tsx',
  'src/contexts/AuthContext.tsx'
];

importantFiles.forEach(file => {
  const exists = existsSync(file);
  const status = exists ? 'EXISTS' : 'NOT FOUND';
  console.log(`  ${file}: ${status}`);
});

// 4. Database Files Check
logSection('Database Files');
const dbFiles = [
  'database.db',
  'database.sqlite',
  'database.sqlite3'
];

dbFiles.forEach(file => {
  const exists = existsSync(file);
  if (exists) {
    const stats = readdirSync('.').filter(f => f.includes('database'));
    console.log(`  ${file}: EXISTS (${stats.length} database files found)`);
  } else {
    console.log(`  ${file}: NOT FOUND`);
  }
});

// 5. API Configuration Check
logSection('API Configuration');
console.log(`API Base URL: ${CONFIG.apiBaseUrl}`);
console.log(`Database URL: ${CONFIG.databaseUrl || 'NOT SET'}`);

// 6. Test Registration Data
const testUser = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User Full Name',
  phoneNumber: '+201234567890',
  guardianPhone: '+201234567891',
  currentLocation: 'Cairo, Egypt',
  country: 'Egypt'
};

// 7. API Connectivity Test
logSection('API Connectivity Test');

const testApiConnectivity = async () => {
  try {
    console.log(`Testing connection to: ${CONFIG.apiBaseUrl.replace('/api', '')}`);
    
    const response = await axios.get(`${CONFIG.apiBaseUrl.replace('/api', '')}/health`, {
      timeout: 5000
    });
    
    logSuccess(`Server is running (Status: ${response.status})`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Server is not running or not accessible');
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

// 8. Registration Test
logSection('Registration Test');

const testRegistration = async () => {
  try {
    console.log('Attempting registration with test data:');
    console.log('  Email:', testUser.email);
    console.log('  Name:', testUser.name);
    console.log('  Phone:', testUser.phoneNumber);
    console.log('  Guardian Phone:', testUser.guardianPhone);
    console.log('  Location:', testUser.currentLocation);
    console.log('  Country:', testUser.country);
    
    const response = await axios.post(`${CONFIG.apiBaseUrl}/auth/register`, testUser, {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Registration successful!');
    console.log('Response data:');
    console.log('  Status:', response.status);
    console.log('  Token:', response.data.token ? 'Present' : 'Missing');
    console.log('  User ID:', response.data.user?.id);
    console.log('  User Email:', response.data.user?.email);
    console.log('  User Name:', response.data.user?.name);
    console.log('  User Phone:', response.data.user?.phoneNumber);
    console.log('  User Guardian Phone:', response.data.user?.guardianPhone);
    console.log('  User Location:', response.data.user?.currentLocation);
    console.log('  User Country:', response.data.user?.country);
    console.log('  User Role:', response.data.user?.role);
    
    // Check if all fields are present
    const requiredFields = ['phoneNumber', 'guardianPhone', 'currentLocation', 'country'];
    const missingFields = requiredFields.filter(field => !response.data.user?.[field]);
    
    if (missingFields.length > 0) {
      logError(`Missing fields in response: ${missingFields.join(', ')}`);
    } else {
      logSuccess('All required fields are present in response');
    }
    
    return response.data;
    
  } catch (error) {
    logError('Registration failed');
    
    if (axios.isAxiosError(error)) {
      console.log('Error details:');
      console.log('  Status:', error.response?.status);
      console.log('  Status Text:', error.response?.statusText);
      console.log('  URL:', error.config?.url);
      console.log('  Response data:', error.response?.data);
    } else {
      console.log('  Error:', error.message);
    }
    
    return null;
  }
};

// 9. Login Test
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
    console.log('User data from login:');
    console.log('  ID:', response.data.user?.id);
    console.log('  Email:', response.data.user?.email);
    console.log('  Name:', response.data.user?.name);
    console.log('  Phone:', response.data.user?.phoneNumber);
    console.log('  Guardian Phone:', response.data.user?.guardianPhone);
    console.log('  Location:', response.data.user?.currentLocation);
    console.log('  Country:', response.data.user?.country);
    console.log('  Role:', response.data.user?.role);
    
    return response.data;
    
  } catch (error) {
    logError('Login failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
};

// 10. Cross-Platform Commands
logSection('Cross-Platform Commands');

const testCrossPlatformCommands = () => {
  console.log('Available cross-platform commands:');
  console.log('  node scripts/cross-platform.js list');
  console.log('  node scripts/cross-platform.js env');
  console.log('  node scripts/cross-platform.js db');
  console.log('  node scripts/cross-platform.js process node');
  console.log('  node scripts/cross-platform.js port 5000');
};

// Main execution
const main = async () => {
  try {
    // Test API connectivity first
    const serverConnected = await testApiConnectivity();
    
    if (serverConnected) {
      // Test registration
      const registrationResult = await testRegistration();
      
      if (registrationResult) {
        // Test login with the registered user
        await testLogin(testUser.email, testUser.password);
      }
    }
    
    // Show cross-platform commands
    testCrossPlatformCommands();
    
  } catch (error) {
    logError('Script execution failed');
    console.log('Error:', error.message);
  }
  
  console.log('\n🔧 Diagnostic completed');
  console.log('\n📝 Next steps:');
  console.log('1. If server is not running, start it with: npm start');
  console.log('2. Check the backend console for detailed logs');
  console.log('3. Use cross-platform commands for file operations');
  console.log('4. Verify all environment variables are set correctly');
};

// Run the diagnostic
main().catch(console.error); 