#!/usr/bin/env node

/**
 * Student Fields Debug Script
 * 
 * This script helps debug missing student fields in the admin panel.
 * It tests the API endpoint and verifies the data structure.
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  apiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  adminCredentials: {
    email: 'admin@example.com',
    password: 'Admin12345!'
  }
};

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
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Response Data:`, err.response.data);
    } else {
      console.error(err.message);
    }
  }
  console.log('');
};

const success = (message, data = null) => {
  console.log(`✅ [${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
};

// Test functions
async function testLogin() {
  log('🔐 Testing admin login...');
  
  try {
    const response = await axios.post(`${CONFIG.apiBaseUrl}/auth/login`, CONFIG.adminCredentials);
    
    success('Login successful', {
      user: response.data.user,
      tokenLength: response.data.token?.length
    });
    
    return response.data.token;
  } catch (err) {
    error('Login failed', err);
    return null;
  }
}

async function testStudentsEndpoint(token) {
  log('👥 Testing students endpoint...');
  
  if (!token) {
    error('No auth token available');
    return null;
  }
  
  try {
    const response = await axios.get(`${CONFIG.apiBaseUrl}/admin/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    success('Students endpoint working', {
      count: response.data.length,
      isArray: Array.isArray(response.data)
    });
    
    return response.data;
  } catch (err) {
    error('Students endpoint failed', err);
    return null;
  }
}

function analyzeStudentData(students) {
  log('🔍 Analyzing student data structure...');
  
  if (!students || students.length === 0) {
    log('No students found to analyze');
    return;
  }
  
  // Analyze the first student
  const firstStudent = students[0];
  log('First student complete data:', firstStudent);
  
  // Check each field
  const expectedFields = [
    'id', 'name', 'email', 'phoneNumber', 'guardianPhone', 
    'currentLocation', 'country', 'created_at'
  ];
  
  const fieldAnalysis = {};
  
  expectedFields.forEach(field => {
    const value = firstStudent[field];
    fieldAnalysis[field] = {
      exists: field in firstStudent,
      value: value,
      type: typeof value,
      isNull: value === null,
      isUndefined: value === undefined,
      isEmpty: value === '',
      displayValue: value || '(empty/null)'
    };
  });
  
  log('Field analysis for first student:', fieldAnalysis);
  
  // Check all students for missing fields
  const missingFields = {};
  expectedFields.forEach(field => {
    const studentsWithMissingField = students.filter(student => 
      !student[field] || student[field] === null || student[field] === undefined
    );
    
    if (studentsWithMissingField.length > 0) {
      missingFields[field] = {
        count: studentsWithMissingField.length,
        totalStudents: students.length,
        percentage: ((studentsWithMissingField.length / students.length) * 100).toFixed(1) + '%',
        studentIds: studentsWithMissingField.map(s => s.id)
      };
    }
  });
  
  if (Object.keys(missingFields).length > 0) {
    log('⚠️ Missing fields analysis:', missingFields);
  } else {
    success('All students have all required fields');
  }
  
  return fieldAnalysis;
}

async function testDatabaseDirectly() {
  log('🗄️ Testing database connection and schema...');
  
  try {
    // Test if we can connect to the database by checking the stats endpoint
    const response = await axios.get(`${CONFIG.apiBaseUrl}/stats/students`);
    
    success('Database connection working', {
      studentCount: response.data.count
    });
    
    return response.data.count;
  } catch (err) {
    error('Database connection failed', err);
    return null;
  }
}

async function createTestStudent(token) {
  log('➕ Creating test student to verify field storage...');
  
  if (!token) {
    error('No auth token available');
    return null;
  }
  
  const testStudent = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test Student',
    phoneNumber: '+1234567890',
    guardianPhone: '+0987654321',
    currentLocation: 'Test City, Test State',
    country: 'Test Country'
  };
  
  try {
    const response = await axios.post(`${CONFIG.apiBaseUrl}/auth/register`, testStudent);
    
    success('Test student created', {
      student: response.data.user,
      token: response.data.token
    });
    
    return response.data.user;
  } catch (err) {
    error('Failed to create test student', err);
    return null;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting Student Fields Diagnostics\n');
  
  // Step 1: Test database connection
  const dbCount = await testDatabaseDirectly();
  
  // Step 2: Login as admin
  const token = await testLogin();
  
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 3: Fetch students
  const students = await testStudentsEndpoint(token);
  
  if (!students) {
    console.log('❌ Cannot proceed without students data');
    return;
  }
  
  // Step 4: Analyze student data
  const fieldAnalysis = analyzeStudentData(students);
  
  // Step 5: Create test student if needed
  if (students.length === 0) {
    log('No students found, creating test student...');
    await createTestStudent(token);
  }
  
  // Step 6: Summary
  console.log('\n📊 Diagnostic Summary:');
  console.log('========================');
  console.log(`✅ Database connection: ${dbCount !== null ? 'Working' : 'Failed'}`);
  console.log(`✅ Authentication: ${token ? 'Working' : 'Failed'}`);
  console.log(`✅ Students endpoint: ${students ? 'Working' : 'Failed'}`);
  console.log(`📊 Students found: ${students?.length || 0}`);
  
  if (fieldAnalysis) {
    console.log('\n🔍 Field Status:');
    Object.entries(fieldAnalysis).forEach(([field, analysis]) => {
      const status = analysis.exists && !analysis.isEmpty && !analysis.isNull ? '✅' : '❌';
      console.log(`${status} ${field}: ${analysis.displayValue}`);
    });
  }
  
  console.log('\n🎯 Recommendations:');
  console.log('1. Check browser console for detailed field logs');
  console.log('2. Verify database schema has all required columns');
  console.log('3. Check if students were registered with complete data');
  console.log('4. Ensure frontend is properly handling null/empty values');
  
  return {
    token,
    students,
    fieldAnalysis,
    dbCount
  };
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics()
    .then(results => {
      if (results && results.students) {
        console.log('\n🎉 Diagnostics completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Issues found. Check the recommendations above.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Diagnostic error:', err);
      process.exit(1);
    });
}

module.exports = { runDiagnostics }; 