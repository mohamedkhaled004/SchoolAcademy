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

async function fixExistingStudents() {
  logSection('Fix Existing Students Data');
  
  try {
    // Step 1: Login as admin
    logSection('Step 1: Admin Login');
    
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
    
    // Step 2: Get all students
    logSection('Step 2: Get All Students');
    
    const studentsResponse = await axios.get(`${CONFIG.apiBaseUrl}/admin/students`, {
      timeout: CONFIG.timeout,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const students = studentsResponse.data;
    logSuccess(`Found ${students.length} students`);
    
    // Step 3: Update students with missing data
    logSection('Step 3: Update Students with Missing Data');
    
    let updatedCount = 0;
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      // Check if student has missing phone/location data
      const hasMissingData = !student.phoneNumber || 
                            student.phoneNumber === 'N/A' || 
                            student.phoneNumber === 'No phone' ||
                            !student.guardianPhone || 
                            student.guardianPhone === 'N/A' || 
                            student.guardianPhone === 'No guardian phone' ||
                            !student.currentLocation || 
                            student.currentLocation === 'N/A' || 
                            student.currentLocation === 'No location';
      
      if (hasMissingData) {
        logInfo(`Updating student ${i + 1}: ${student.email}`);
        
        // Generate sample data
        const updateData = {
          name: student.name,
          email: student.email,
          country: student.country || 'Egypt',
          phoneNumber: `+2012345678${String(i + 1).padStart(2, '0')}`,
          guardianPhone: `+2098765432${String(i + 1).padStart(2, '0')}`,
          currentLocation: `City ${i + 1}, Egypt`
        };
        
        try {
          await axios.put(`${CONFIG.apiBaseUrl}/admin/students/${student.id}`, updateData, {
            timeout: CONFIG.timeout,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          logSuccess(`Updated student ${student.email}`, {
            phoneNumber: updateData.phoneNumber,
            guardianPhone: updateData.guardianPhone,
            currentLocation: updateData.currentLocation
          });
          
          updatedCount++;
        } catch (error) {
          logError(`Failed to update student ${student.email}`, error.response?.data);
        }
      } else {
        logInfo(`Student ${student.email} already has complete data`);
      }
    }
    
    // Step 4: Verify the fix
    logSection('Step 4: Verify the Fix');
    
    const verifyResponse = await axios.get(`${CONFIG.apiBaseUrl}/admin/students`, {
      timeout: CONFIG.timeout,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const updatedStudents = verifyResponse.data;
    logSuccess(`Retrieved ${updatedStudents.length} students after update`);
    
    // Check for any remaining students with missing data
    const studentsWithMissingData = updatedStudents.filter(student => 
      !student.phoneNumber || 
      student.phoneNumber === 'N/A' || 
      student.phoneNumber === 'No phone' ||
      !student.guardianPhone || 
      student.guardianPhone === 'N/A' || 
      student.guardianPhone === 'No guardian phone' ||
      !student.currentLocation || 
      student.currentLocation === 'N/A' || 
      student.currentLocation === 'No location'
    );
    
    if (studentsWithMissingData.length === 0) {
      logSuccess('✅ All students now have complete data!');
    } else {
      logError(`❌ ${studentsWithMissingData.length} students still have missing data`);
    }
    
    // Show sample of updated data
    logSection('Step 5: Sample Updated Data');
    updatedStudents.slice(0, 3).forEach((student, index) => {
      console.log(`\n👤 Student ${index + 1}:`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Phone: ${student.phoneNumber}`);
      console.log(`  Guardian Phone: ${student.guardianPhone}`);
      console.log(`  Location: ${student.currentLocation}`);
    });
    
    logSuccess(`✅ Fixed ${updatedCount} students with missing data`);
    logInfo('Now refresh your admin panel in the browser to see the updated data!');
    
  } catch (error) {
    logError('Fix failed', error.response?.data || error.message);
  }
}

// Run the fix
fixExistingStudents().catch(console.error); 