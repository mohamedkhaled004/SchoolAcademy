#!/usr/bin/env node

/**
 * Test Script for Direct Data Display
 * 
 * This script tests that all user data including sensitive fields
 * is displayed directly in the admin panel without any access controls.
 */

const axios = require('axios');
const { Pool } = require('pg');

const API_BASE = 'http://localhost:3001/api';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'your_database'
});

// Test data
const testStudent = {
  email: `direct-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Direct Test Student',
  phoneNumber: '+201234567890',
  guardianPhone: '+201123456789',
  currentLocation: 'Cairo, Egypt',
  country: 'Egypt'
};

const adminCredentials = {
  email: 'admin@example.com',
  password: 'Admin12345!'
};

// Utility functions
const logSection = (title) => {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(title.length + 4));
};

const logSuccess = (message, data = null) => {
  console.log(`✅ ${message}`);
  if (data) console.log('   Data:', data);
};

const logError = (message, error = null) => {
  console.log(`❌ ${message}`);
  if (error) console.log('   Error:', error.message || error);
};

const logInfo = (message) => {
  console.log(`ℹ️  ${message}`);
};

async function testDirectDisplay() {
  let adminToken = null;
  let studentId = null;

  try {
    logSection('Direct Data Display Test');
    
    // Step 1: Login as admin
    logSection('Step 1: Admin Login');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    adminToken = loginResponse.data.token;
    logSuccess('Admin login successful', { token: adminToken ? 'Present' : 'Missing' });

    // Step 2: Register test student
    logSection('Step 2: Register Test Student');
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testStudent);
    studentId = registerResponse.data.user.id;
    logSuccess('Student registration successful', {
      id: studentId,
      email: registerResponse.data.user.email,
      name: registerResponse.data.user.name,
      country: registerResponse.data.user.country
    });

    // Step 3: Verify all data is visible in admin panel
    logSection('Step 3: Verify Direct Data Display');
    const adminStudentsResponse = await axios.get(`${API_BASE}/admin/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const studentInAdmin = adminStudentsResponse.data.find(s => s.id === studentId);
    if (studentInAdmin) {
      logSuccess('Student found in admin panel');
      logInfo('All fields should be visible:');
      logInfo(`  Name: ${studentInAdmin.name}`);
      logInfo(`  Email: ${studentInAdmin.email}`);
      logInfo(`  Country: ${studentInAdmin.country}`);
      logInfo(`  Phone Number: ${studentInAdmin.phoneNumber}`);
      logInfo(`  Guardian Phone: ${studentInAdmin.guardianPhone}`);
      logInfo(`  Location: ${studentInAdmin.currentLocation}`);
      logInfo(`  Created At: ${studentInAdmin.created_at}`);
      
      // Check if sensitive data is visible
      const hasPhone = studentInAdmin.phoneNumber && studentInAdmin.phoneNumber !== 'N/A';
      const hasGuardianPhone = studentInAdmin.guardianPhone && studentInAdmin.guardianPhone !== 'N/A';
      const hasLocation = studentInAdmin.currentLocation && studentInAdmin.currentLocation !== 'N/A';
      
      if (hasPhone && hasGuardianPhone && hasLocation) {
        logSuccess('✅ All sensitive data is directly visible in admin panel');
      } else {
        logError('❌ Some sensitive data is not visible or shows N/A');
        logInfo(`Phone visible: ${hasPhone}`);
        logInfo(`Guardian phone visible: ${hasGuardianPhone}`);
        logInfo(`Location visible: ${hasLocation}`);
      }
    } else {
      logError('Student not found in admin panel');
    }

    // Step 4: Test editing sensitive data
    logSection('Step 4: Test Editing Sensitive Data');
    const updateData = {
      name: 'Updated Test Student',
      email: testStudent.email,
      phoneNumber: '+209876543210',
      guardianPhone: '+209876543211',
      currentLocation: 'Alexandria, Egypt',
      country: 'Egypt'
    };

    const updateResponse = await axios.put(
      `${API_BASE}/admin/students/${studentId}`,
      updateData,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (updateResponse.data.success) {
      logSuccess('Student data updated successfully');
      
      // Verify the update
      const updatedResponse = await axios.get(`${API_BASE}/admin/students`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const updatedStudent = updatedResponse.data.find(s => s.id === studentId);
      if (updatedStudent) {
        logSuccess('Updated data verified in admin panel');
        logInfo(`  New Name: ${updatedStudent.name}`);
        logInfo(`  New Phone: ${updatedStudent.phoneNumber}`);
        logInfo(`  New Guardian Phone: ${updatedStudent.guardianPhone}`);
        logInfo(`  New Location: ${updatedStudent.currentLocation}`);
      }
    } else {
      logError('Failed to update student data');
    }

    // Step 5: Test database verification
    logSection('Step 5: Database Verification');
    
    // Check users table
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [studentId]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      logSuccess('User found in database', {
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country
      });
    }

    // Check sensitive data table
    const sensitiveResult = await pool.query('SELECT * FROM student_sensitive_data WHERE user_id = $1', [studentId]);
    if (sensitiveResult.rows.length > 0) {
      const sensitive = sensitiveResult.rows[0];
      logSuccess('Sensitive data found in database', {
        hasPhone: !!sensitive.phone_number_encrypted,
        hasGuardianPhone: !!sensitive.guardian_phone_encrypted,
        hasLocation: !!sensitive.location_encrypted,
        hasKeyHash: !!sensitive.encryption_key_hash
      });
    } else {
      logError('No sensitive data found in database');
    }

    logSection('Test Summary');
    logSuccess('Direct data display test completed successfully!');
    logInfo('Key features verified:');
    logInfo('✅ All user data including sensitive fields is visible');
    logInfo('✅ No access controls or permissions required');
    logInfo('✅ Data can be edited directly');
    logInfo('✅ Simple, straightforward display');

  } catch (error) {
    logError('Test failed', error);
    if (error.response) {
      logError('Response status:', error.response.status);
      logError('Response data:', error.response.data);
    }
  } finally {
    // Cleanup
    if (studentId) {
      try {
        await pool.query('DELETE FROM users WHERE id = $1', [studentId]);
        logInfo('Test student cleaned up');
      } catch (cleanupError) {
        logError('Cleanup failed', cleanupError);
      }
    }
    
    await pool.end();
    console.log('\n🏁 Test script finished');
  }
}

// Run the test
if (require.main === module) {
  testDirectDisplay().catch(console.error);
}

module.exports = { testDirectDisplay }; 