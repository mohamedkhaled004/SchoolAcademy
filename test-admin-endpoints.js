#!/usr/bin/env node

/**
 * Admin Endpoints Test Script
 * 
 * This script helps verify that your admin endpoints are working correctly.
 * Run this script to test both the students list and teacher addition functionality.
 */

const axios = require('axios');

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@example.com',
  adminPassword: 'Admin12345!',
  testTeacher: {
    name: 'Test Teacher',
    subject: 'Test Subject',
    bio: 'This is a test teacher for debugging purposes'
  }
};

let authToken = null;

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
};

const error = (message, err = null) => {
  console.error(`❌ [${new Date().toISOString()}] ${message}`);
  if (err) {
    console.error(err.response?.data || err.message);
  }
  console.log('');
};

// Test functions
async function testLogin() {
  log('🔐 Testing admin login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    
    authToken = response.data.token;
    log('✅ Login successful', {
      user: response.data.user,
      tokenLength: authToken.length
    });
    
    return true;
  } catch (err) {
    error('Login failed', err);
    return false;
  }
}

async function testStudentsEndpoint() {
  log('👥 Testing students endpoint...');
  
  if (!authToken) {
    error('No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_BASE}/admin/students`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log('✅ Students endpoint working', {
      count: response.data.length,
      isArray: Array.isArray(response.data),
      sampleData: response.data.slice(0, 2)
    });
    
    return true;
  } catch (err) {
    error('Students endpoint failed', err);
    return false;
  }
}

async function testTeachersEndpoint() {
  log('👨‍🏫 Testing teachers endpoint...');
  
  if (!authToken) {
    error('No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_BASE}/teachers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log('✅ Teachers endpoint working', {
      count: response.data.length,
      isArray: Array.isArray(response.data),
      sampleData: response.data.slice(0, 2)
    });
    
    return true;
  } catch (err) {
    error('Teachers endpoint failed', err);
    return false;
  }
}

async function testAddTeacher() {
  log('➕ Testing add teacher...');
  
  if (!authToken) {
    error('No auth token available');
    return false;
  }
  
  try {
    const formData = new FormData();
    formData.append('name', TEST_CONFIG.testTeacher.name);
    formData.append('subject', TEST_CONFIG.testTeacher.subject);
    formData.append('bio', TEST_CONFIG.testTeacher.bio);
    
    const response = await axios.post(`${API_BASE}/teachers`, formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    log('✅ Add teacher successful', {
      teacher: response.data,
      id: response.data.id
    });
    
    return response.data.id;
  } catch (err) {
    error('Add teacher failed', err);
    return false;
  }
}

async function testDeleteTeacher(teacherId) {
  if (!teacherId) return true;
  
  log('🗑️ Testing delete teacher...');
  
  try {
    await axios.delete(`${API_BASE}/teachers/${teacherId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    log('✅ Delete teacher successful');
    return true;
  } catch (err) {
    error('Delete teacher failed', err);
    return false;
  }
}

async function testValidationErrors() {
  log('⚠️ Testing validation errors...');
  
  if (!authToken) {
    error('No auth token available');
    return false;
  }
  
  // Test missing name
  try {
    const formData = new FormData();
    formData.append('subject', 'Test Subject');
    
    await axios.post(`${API_BASE}/teachers`, formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    error('❌ Expected validation error for missing name, but request succeeded');
    return false;
  } catch (err) {
    if (err.response?.status === 400) {
      log('✅ Validation error working (missing name)', {
        error: err.response.data.error
      });
    } else {
      error('Unexpected error for missing name', err);
      return false;
    }
  }
  
  // Test missing subject
  try {
    const formData = new FormData();
    formData.append('name', 'Test Teacher');
    
    await axios.post(`${API_BASE}/teachers`, formData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    error('❌ Expected validation error for missing subject, but request succeeded');
    return false;
  } catch (err) {
    if (err.response?.status === 400) {
      log('✅ Validation error working (missing subject)', {
        error: err.response.data.error
      });
    } else {
      error('Unexpected error for missing subject', err);
      return false;
    }
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Admin Endpoints Test Suite\n');
  
  const results = {
    login: false,
    students: false,
    teachers: false,
    addTeacher: false,
    deleteTeacher: false,
    validation: false
  };
  
  // Run tests in sequence
  results.login = await testLogin();
  
  if (results.login) {
    results.students = await testStudentsEndpoint();
    results.teachers = await testTeachersEndpoint();
    results.validation = await testValidationErrors();
    
    const teacherId = await testAddTeacher();
    results.addTeacher = !!teacherId;
    
    if (teacherId) {
      results.deleteTeacher = await testDeleteTeacher(teacherId);
    }
  }
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed. Check the logs above.'}`);
  
  return allPassed;
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Test runner error:', err);
      process.exit(1);
    });
}

module.exports = { runTests };
