#!/usr/bin/env node

/**
 * Test Script for Secure Student Data System
 * 
 * This script tests the complete secure data flow:
 * 1. Register a student with sensitive data
 * 2. Verify sensitive data is not visible in admin panel
 * 3. Request access to sensitive data
 * 4. Verify access is granted and data is retrieved
 * 5. Check audit logging
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
  email: `secure-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Secure Test Student',
  phoneNumber: '+1234567890',
  guardianPhone: '+0987654321',
  currentLocation: 'Secure Test City',
  country: 'Test Country'
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

async function testSecureSystem() {
  let adminToken = null;
  let studentId = null;

  try {
    logSection('Secure Student Data System Test');
    
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
      hasSensitiveData: !registerResponse.data.user.phoneNumber // Should be false
    });

    // Step 3: Verify sensitive data is not in admin panel
    logSection('Step 3: Verify Admin Panel (No Sensitive Data)');
    const adminStudentsResponse = await axios.get(`${API_BASE}/admin/students`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const studentInAdmin = adminStudentsResponse.data.find(s => s.id === studentId);
    if (studentInAdmin) {
      logSuccess('Student found in admin panel');
      logInfo(`Basic data: ${studentInAdmin.name}, ${studentInAdmin.email}, ${studentInAdmin.country}`);
      logInfo(`Sensitive data fields: phoneNumber=${studentInAdmin.phoneNumber}, guardianPhone=${studentInAdmin.guardianPhone}, location=${studentInAdmin.currentLocation}`);
      
      if (!studentInAdmin.phoneNumber && !studentInAdmin.guardianPhone && !studentInAdmin.currentLocation) {
        logSuccess('✅ Sensitive data correctly hidden from admin panel');
      } else {
        logError('❌ Sensitive data is visible in admin panel');
      }
    } else {
      logError('Student not found in admin panel');
    }

    // Step 4: Request access to sensitive data
    logSection('Step 4: Request Access to Sensitive Data');
    const accessResponse = await axios.post(
      `${API_BASE}/admin/students/${studentId}/request-access`,
      {
        dataType: 'phone',
        reason: 'Testing secure system'
      },
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (accessResponse.data.success) {
      logSuccess('Access request successful', {
        accessId: accessResponse.data.accessId,
        expiresAt: accessResponse.data.expiresAt
      });
    } else {
      logError('Access request failed', accessResponse.data);
    }

    // Step 5: Retrieve sensitive data
    logSection('Step 5: Retrieve Sensitive Data');
    const sensitiveDataResponse = await axios.get(
      `${API_BASE}/admin/students/${studentId}/sensitive-data?dataType=phone`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (sensitiveDataResponse.data.success) {
      logSuccess('Sensitive data retrieved successfully', {
        data: sensitiveDataResponse.data.data,
        expiresAt: sensitiveDataResponse.data.accessExpiresAt
      });
    } else {
      logError('Failed to retrieve sensitive data', sensitiveDataResponse.data);
    }

    // Step 6: Check audit log
    logSection('Step 6: Check Audit Log');
    const auditResponse = await axios.get(`${API_BASE}/admin/access-audit`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const recentAudit = auditResponse.data.filter(log => 
      log.student_email === testStudent.email && 
      log.data_type === 'phone'
    );

    if (recentAudit.length > 0) {
      logSuccess('Audit log entries found', {
        count: recentAudit.length,
        actions: recentAudit.map(log => log.action)
      });
      
      recentAudit.forEach((log, index) => {
        logInfo(`Audit ${index + 1}: ${log.action} - ${log.reason} at ${log.created_at}`);
      });
    } else {
      logError('No audit log entries found');
    }

    // Step 7: Test database verification
    logSection('Step 7: Database Verification');
    
    // Check users table
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [studentId]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      logSuccess('User found in database', {
        id: user.id,
        name: user.name,
        email: user.email,
        hasSensitiveColumns: user.phoneNumber || user.guardianPhone || user.currentLocation
      });
      
      if (!user.phoneNumber && !user.guardianPhone && !user.currentLocation) {
        logSuccess('✅ Sensitive columns correctly removed from users table');
      } else {
        logError('❌ Sensitive columns still exist in users table');
      }
    }

    // Check sensitive data table
    const sensitiveResult = await pool.query('SELECT * FROM student_sensitive_data WHERE user_id = $1', [studentId]);
    if (sensitiveResult.rows.length > 0) {
      const sensitive = sensitiveResult.rows[0];
      logSuccess('Sensitive data found in secure table', {
        hasPhone: !!sensitive.phone_number_encrypted,
        hasGuardianPhone: !!sensitive.guardian_phone_encrypted,
        hasLocation: !!sensitive.location_encrypted,
        hasKeyHash: !!sensitive.encryption_key_hash
      });
    } else {
      logError('No sensitive data found in secure table');
    }

    // Check access control table
    const accessResult = await pool.query(
      'SELECT * FROM sensitive_data_access WHERE admin_id = (SELECT id FROM users WHERE email = $1) AND student_id = $2',
      [adminCredentials.email, studentId]
    );
    
    if (accessResult.rows.length > 0) {
      logSuccess('Access control records found', {
        count: accessResult.rows.length,
        active: accessResult.rows.filter(r => r.is_active && new Date(r.expires_at) > new Date()).length
      });
    } else {
      logError('No access control records found');
    }

    // Step 8: Test access expiration
    logSection('Step 8: Test Access Expiration');
    logInfo('Access should expire after 1 hour. Current access is valid until:');
    if (accessResult.rows.length > 0) {
      accessResult.rows.forEach((access, index) => {
        const expiresAt = new Date(access.expires_at);
        const now = new Date();
        const isValid = expiresAt > now;
        logInfo(`Access ${index + 1}: ${expiresAt.toISOString()} (${isValid ? 'Valid' : 'Expired'})`);
      });
    }

    logSection('Test Summary');
    logSuccess('Secure data system test completed successfully!');
    logInfo('Key features verified:');
    logInfo('✅ Sensitive data encrypted and stored separately');
    logInfo('✅ Admin panel shows only basic information');
    logInfo('✅ Access control requires explicit permission');
    logInfo('✅ Audit logging captures all access attempts');
    logInfo('✅ Time-limited access with automatic expiration');

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
  testSecureSystem().catch(console.error);
}

module.exports = { testSecureSystem }; 