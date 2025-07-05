const axios = require('axios');

// Configuration
const CONFIG = {
  apiBaseUrl: 'http://localhost:3001/api',
  timeout: 10000
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

const logInfo = (message, data = null) => {
  console.log(`ℹ️ ${message}`);
  if (data) console.log('   Data:', data);
};

async function quickVerification() {
  logSection('Quick Verification - Direct Data Storage Fix');
  
  try {
    // Step 1: Test server connectivity
    logSection('Step 1: Server Connectivity Test');
    
    try {
      const response = await axios.get(`${CONFIG.apiBaseUrl}/teachers`, {
        timeout: CONFIG.timeout
      });
      logSuccess('Server is running and accessible');
    } catch (error) {
      logError('Server is not accessible');
      logInfo('Please start the server with: npm start');
      return;
    }
    
    // Step 2: Test registration with all fields
    logSection('Step 2: Registration Test');
    
    const testUser = {
      email: `test-verification-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test Verification User',
      phoneNumber: '+201234567890',
      guardianPhone: '+201234567891',
      currentLocation: 'Cairo, Egypt',
      country: 'Egypt'
    };
    
    logInfo('Registering test user with all fields:', {
      email: testUser.email,
      phoneNumber: testUser.phoneNumber,
      guardianPhone: testUser.guardianPhone,
      currentLocation: testUser.currentLocation
    });
    
    let registrationResponse;
    try {
      registrationResponse = await axios.post(`${CONFIG.apiBaseUrl}/auth/register`, testUser, {
        timeout: CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logSuccess('Registration successful!');
      logInfo('Registration response:', {
        status: registrationResponse.status,
        userId: registrationResponse.data.user?.id,
        userPhone: registrationResponse.data.user?.phoneNumber,
        userGuardianPhone: registrationResponse.data.user?.guardianPhone,
        userLocation: registrationResponse.data.user?.currentLocation
      });
      
      // Check if all fields are present in response
      const requiredFields = ['phoneNumber', 'guardianPhone', 'currentLocation'];
      const missingFields = requiredFields.filter(field => !registrationResponse.data.user?.[field]);
      
      if (missingFields.length > 0) {
        logError(`Missing fields in registration response: ${missingFields.join(', ')}`);
      } else {
        logSuccess('All required fields present in registration response');
      }
      
    } catch (error) {
      logError('Registration failed');
      if (error.response) {
        logError('Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return;
    }
    
    // Step 3: Test admin login
    logSection('Step 3: Admin Login Test');
    
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    let adminToken;
    try {
      const loginResponse = await axios.post(`${CONFIG.apiBaseUrl}/auth/login`, adminCredentials, {
        timeout: CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      adminToken = loginResponse.data.token;
      logSuccess('Admin login successful');
      
    } catch (error) {
      logError('Admin login failed');
      if (error.response) {
        logError('Login error:', error.response.data);
      }
      return;
    }
    
    // Step 4: Test admin students retrieval
    logSection('Step 4: Admin Students Retrieval Test');
    
    try {
      const adminResponse = await axios.get(`${CONFIG.apiBaseUrl}/admin/students`, {
        timeout: CONFIG.timeout,
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      logSuccess(`Admin retrieved ${adminResponse.data.length} students`);
      
      // Find our test user
      const testUserInAdmin = adminResponse.data.find(u => u.email === testUser.email);
      
      if (testUserInAdmin) {
        logSuccess('Test user found in admin response');
        logInfo('Admin response data for test user:', {
          id: testUserInAdmin.id,
          email: testUserInAdmin.email,
          name: testUserInAdmin.name,
          phoneNumber: testUserInAdmin.phoneNumber,
          guardianPhone: testUserInAdmin.guardianPhone,
          currentLocation: testUserInAdmin.currentLocation,
          country: testUserInAdmin.country
        });
        
        // Verify data matches registration
        const dataMatches = 
          testUserInAdmin.phoneNumber === testUser.phoneNumber &&
          testUserInAdmin.guardianPhone === testUser.guardianPhone &&
          testUserInAdmin.currentLocation === testUser.currentLocation;
        
        if (dataMatches) {
          logSuccess('✅ Admin response data matches registration data!');
          logSuccess('✅ The fix is working correctly!');
        } else {
          logError('❌ Admin response data does not match registration data');
          logInfo('Data comparison:', {
            registration: {
              phoneNumber: testUser.phoneNumber,
              guardianPhone: testUser.guardianPhone,
              currentLocation: testUser.currentLocation
            },
            admin: {
              phoneNumber: testUserInAdmin.phoneNumber,
              guardianPhone: testUserInAdmin.guardianPhone,
              currentLocation: testUserInAdmin.currentLocation
            }
          });
        }
      } else {
        logError('Test user not found in admin response');
      }
      
      // Check for any students with "No phone" messages
      const studentsWithNoPhone = adminResponse.data.filter(student => 
        student.phoneNumber === 'No phone' || 
        student.phoneNumber === 'N/A' || 
        !student.phoneNumber
      );
      
      if (studentsWithNoPhone.length > 0) {
        logInfo(`Found ${studentsWithNoPhone.length} students with missing phone data`);
        logInfo('These are likely existing students registered before the schema update');
      }
      
    } catch (error) {
      logError('Admin students retrieval failed');
      if (error.response) {
        logError('Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
    
    // Step 5: Summary
    logSection('Step 5: Summary');
    
    logInfo('Verification completed!');
    logInfo('Next steps:');
    logInfo('1. Check the admin panel in your browser');
    logInfo('2. Verify that new registrations show actual phone numbers and locations');
    logInfo('3. If old students still show "No phone", they were registered before the fix');
    logInfo('4. New registrations should work correctly with the updated schema');
    
  } catch (error) {
    logError('Verification failed with unexpected error:', error.message);
  }
}

// Run the verification
quickVerification().catch(console.error); 