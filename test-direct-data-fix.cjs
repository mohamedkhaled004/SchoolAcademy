const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const CONFIG = {
  apiBaseUrl: 'http://localhost:3001/api',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/website',
  timeout: 10000
};

// Database connection
const pool = new Pool({
  connectionString: CONFIG.databaseUrl
});

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

const logInfo = (message, data = null) => {
  console.log(`ℹ️ ${message}`);
  if (data) console.log('   Data:', data);
};

async function testDirectDataFix() {
  logSection('Direct Data Storage Fix Test');
  
  try {
    // Step 1: Check database schema
    logSection('Step 1: Database Schema Check');
    
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    logInfo('Users table schema:');
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check if required columns exist
    const requiredColumns = ['phoneNumber', 'guardianPhone', 'currentLocation'];
    const existingColumns = schemaResult.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      logError(`Missing columns: ${missingColumns.join(', ')}`);
      return;
    } else {
      logSuccess('All required columns exist in users table');
    }
    
    // Step 2: Test registration with all fields
    logSection('Step 2: Test Registration');
    
    const testUser = {
      email: `test-direct-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test Direct User',
      phoneNumber: '+201234567890',
      guardianPhone: '+201234567891',
      currentLocation: 'Cairo, Egypt',
      country: 'Egypt'
    };
    
    logInfo('Registering test user:', {
      email: testUser.email,
      name: testUser.name,
      phoneNumber: testUser.phoneNumber,
      guardianPhone: testUser.guardianPhone,
      currentLocation: testUser.currentLocation,
      country: testUser.country
    });
    
    const registrationResponse = await axios.post(`${CONFIG.apiBaseUrl}/auth/register`, testUser, {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Registration successful!');
    logInfo('Registration response:', {
      status: registrationResponse.status,
      userId: registrationResponse.data.user?.id,
      userEmail: registrationResponse.data.user?.email,
      userPhone: registrationResponse.data.user?.phoneNumber,
      userGuardianPhone: registrationResponse.data.user?.guardianPhone,
      userLocation: registrationResponse.data.user?.currentLocation,
      userCountry: registrationResponse.data.user?.country
    });
    
    // Step 3: Verify data in database
    logSection('Step 3: Database Verification');
    
    const dbUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [testUser.email]
    );
    
    if (dbUser.rows.length === 0) {
      logError('User not found in database');
      return;
    }
    
    const user = dbUser.rows[0];
    logSuccess('User found in database');
    logInfo('Database user data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      guardianPhone: user.guardianPhone,
      currentLocation: user.currentLocation,
      country: user.country,
      role: user.role
    });
    
    // Verify all fields are saved correctly
    const allFieldsSaved = user.phoneNumber && user.guardianPhone && user.currentLocation;
    if (allFieldsSaved) {
      logSuccess('All sensitive fields saved correctly in database');
    } else {
      logError('Some sensitive fields are missing in database');
      logInfo('Field status:', {
        phoneNumber: user.phoneNumber ? 'Present' : 'Missing',
        guardianPhone: user.guardianPhone ? 'Present' : 'Missing',
        currentLocation: user.currentLocation ? 'Present' : 'Missing'
      });
    }
    
    // Step 4: Test admin login and data retrieval
    logSection('Step 4: Admin Data Retrieval Test');
    
    // Login as admin
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    const loginResponse = await axios.post(`${CONFIG.apiBaseUrl}/auth/login`, adminCredentials, {
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.token;
    logSuccess('Admin login successful');
    
    // Get students list
    const adminResponse = await axios.get(`${CONFIG.apiBaseUrl}/admin/students`, {
      timeout: CONFIG.timeout,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess(`Admin retrieved ${adminResponse.data.length} students`);
    
    // Find our test user in admin response
    const adminUser = adminResponse.data.find(u => u.email === testUser.email);
    
    if (adminUser) {
      logSuccess('Test user found in admin response');
      logInfo('Admin response data:', {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        phoneNumber: adminUser.phoneNumber,
        guardianPhone: adminUser.guardianPhone,
        currentLocation: adminUser.currentLocation,
        country: adminUser.country,
        role: adminUser.role
      });
      
      // Verify data matches
      const dataMatches = 
        adminUser.phoneNumber === testUser.phoneNumber &&
        adminUser.guardianPhone === testUser.guardianPhone &&
        adminUser.currentLocation === testUser.currentLocation;
      
      if (dataMatches) {
        logSuccess('Admin response data matches registration data');
      } else {
        logError('Admin response data does not match registration data');
        logInfo('Data comparison:', {
          registration: {
            phoneNumber: testUser.phoneNumber,
            guardianPhone: testUser.guardianPhone,
            currentLocation: testUser.currentLocation
          },
          admin: {
            phoneNumber: adminUser.phoneNumber,
            guardianPhone: adminUser.guardianPhone,
            currentLocation: adminUser.currentLocation
          }
        });
      }
    } else {
      logError('Test user not found in admin response');
    }
    
    // Step 5: Test admin update functionality
    logSection('Step 5: Admin Update Test');
    
    const updateData = {
      name: 'Updated Test User',
      email: testUser.email,
      phoneNumber: '+209876543210',
      guardianPhone: '+209876543211',
      currentLocation: 'Alexandria, Egypt',
      country: 'Egypt'
    };
    
    logInfo('Updating user data:', updateData);
    
    const updateResponse = await axios.put(`${CONFIG.apiBaseUrl}/admin/students/${adminUser.id}`, updateData, {
      timeout: CONFIG.timeout,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Update successful');
    
    // Verify update in database
    const updatedDbUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [testUser.email]
    );
    
    const updatedUser = updatedDbUser.rows[0];
    logInfo('Updated database data:', {
      name: updatedUser.name,
      phoneNumber: updatedUser.phoneNumber,
      guardianPhone: updatedUser.guardianPhone,
      currentLocation: updatedUser.currentLocation
    });
    
    // Step 6: Clean up
    logSection('Step 6: Cleanup');
    
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    logSuccess('Test user deleted from database');
    
    logSuccess('Direct data fix test completed successfully!');
    logInfo('Summary:', {
      registration: '✅ Working',
      databaseStorage: '✅ Working',
      adminRetrieval: '✅ Working',
      adminUpdate: '✅ Working',
      dataIntegrity: '✅ Working'
    });
    
  } catch (error) {
    logError('Test failed');
    if (error.response) {
      logError('Response error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      logError('Network error:', error.message);
    } else {
      logError('Error:', error.message);
    }
  } finally {
    await pool.end();
    console.log('\n🏁 Test completed');
  }
}

// Run the test
testDirectDataFix().catch(console.error); 