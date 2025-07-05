#!/usr/bin/env node

/**
 * Registration Test Script
 * 
 * This script tests the registration process and verifies that all fields are saved correctly.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🧪 Registration Test Script');
console.log('==========================\n');

// Test user data
const testUser = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User Full Name',
  phoneNumber: '+201234567890',
  guardianPhone: '+201234567891',
  currentLocation: 'Cairo, Egypt',
  country: 'Egypt'
};

console.log('📝 Test user data:');
console.log('  Email:', testUser.email);
console.log('  Name:', testUser.name);
console.log('  Phone:', testUser.phoneNumber);
console.log('  Guardian Phone:', testUser.guardianPhone);
console.log('  Location:', testUser.currentLocation);
console.log('  Country:', testUser.country);
console.log('  API Base:', API_BASE);

// Test registration
const testRegistration = async () => {
  try {
    console.log('\n🔧 Testing registration...');
    
    const response = await axios.post(`${API_BASE}/auth/register`, testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response status:', response.status);
    console.log('Response data:');
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
      console.log('❌ Missing fields in response:', missingFields);
    } else {
      console.log('✅ All required fields are present in response');
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Registration failed');
    
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

// Test login to verify data retrieval
const testLogin = async (email, password) => {
  try {
    console.log('\n🔧 Testing login...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
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
    console.error('❌ Login failed');
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
};

// Main test execution
const main = async () => {
  try {
    // Test registration
    const registrationResult = await testRegistration();
    
    if (registrationResult) {
      // Test login with the registered user
      await testLogin(testUser.email, testUser.password);
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
  
  console.log('\n🧪 Test completed');
  console.log('\n📝 Next steps:');
  console.log('1. Check the backend console for detailed logs');
  console.log('2. Verify the database contains all user fields');
  console.log('3. Test the admin panel to see if fields are displayed');
};

// Run the test
main().catch(console.error); 