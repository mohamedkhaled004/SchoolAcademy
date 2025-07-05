// Browser Admin Panel Test Script
// Copy and paste this into the browser console on the admin students page

console.log('🔍 BROWSER ADMIN PANEL TEST');
console.log('============================');

// Test function
async function testAdminPanelData() {
  try {
    console.log('🚀 STEP 1: Check Environment Variables');
    console.log('--------------------------------------');
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    console.log('VITE_API_BASE_URL:', API_BASE);
    console.log('Type:', typeof API_BASE);
    console.log('Is defined:', API_BASE !== undefined);
    
    if (!API_BASE) {
      console.error('❌ VITE_API_BASE_URL is not defined!');
      return;
    }
    
    console.log('\n🔍 STEP 2: Check Authentication');
    console.log('-------------------------------');
    
    const token = localStorage.getItem('token');
    console.log('Auth token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    
    if (!token) {
      console.error('❌ No auth token found');
      console.log('Please login as admin first');
      return;
    }
    
    console.log('\n🔍 STEP 3: Test Admin Students API');
    console.log('----------------------------------');
    
    console.log('Making API call to:', `${API_BASE}/api/admin/students`);
    
    const response = await fetch(`${API_BASE}/api/admin/students`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API call successful');
    console.log('Response data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Number of students:', data.length);
    
    console.log('\n🔍 STEP 4: Analyze Student Data');
    console.log('-------------------------------');
    
    if (data.length > 0) {
      console.log('📊 First student data:', data[0]);
      console.log('📊 All field names:', Object.keys(data[0]));
      
      // Check specific fields
      const firstStudent = data[0];
      console.log('\n🔍 Field Analysis for First Student:');
      console.log('  id:', firstStudent.id, '(type:', typeof firstStudent.id, ')');
      console.log('  name:', firstStudent.name, '(type:', typeof firstStudent.name, ')');
      console.log('  email:', firstStudent.email, '(type:', typeof firstStudent.email, ')');
      console.log('  phoneNumber:', firstStudent.phoneNumber, '(type:', typeof firstStudent.phoneNumber, ', null?', firstStudent.phoneNumber === null, ')');
      console.log('  guardianPhone:', firstStudent.guardianPhone, '(type:', typeof firstStudent.guardianPhone, ', null?', firstStudent.guardianPhone === null, ')');
      console.log('  currentLocation:', firstStudent.currentLocation, '(type:', typeof firstStudent.currentLocation, ', null?', firstStudent.currentLocation === null, ')');
      console.log('  country:', firstStudent.country, '(type:', typeof firstStudent.country, ', null?', firstStudent.country === null, ')');
      console.log('  role:', firstStudent.role, '(type:', typeof firstStudent.role, ')');
      console.log('  created_at:', firstStudent.created_at, '(type:', typeof firstStudent.created_at, ')');
      
      // Check for missing fields
      const expectedFields = ['id', 'name', 'email', 'phoneNumber', 'guardianPhone', 'currentLocation', 'country', 'role', 'created_at'];
      const missingFields = expectedFields.filter(field => !(field in firstStudent));
      
      if (missingFields.length > 0) {
        console.error('❌ Missing fields:', missingFields);
      } else {
        console.log('✅ All expected fields are present');
      }
      
      // Check for null/undefined values
      const nullFields = expectedFields.filter(field => firstStudent[field] === null || firstStudent[field] === undefined);
      if (nullFields.length > 0) {
        console.warn('⚠️ Fields with null/undefined values:', nullFields);
      }
      
      console.log('\n🔍 STEP 5: Analyze All Students');
      console.log('-------------------------------');
      
      // Analyze all students
      data.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`);
        console.log(`  Name: ${student.name}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Phone: ${student.phoneNumber || 'NULL/EMPTY'}`);
        console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL/EMPTY'}`);
        console.log(`  Location: ${student.currentLocation || 'NULL/EMPTY'}`);
        console.log(`  Country: ${student.country || 'NULL/EMPTY'}`);
      });
      
      // Count students with missing data
      const studentsWithMissingData = data.filter(student => 
        !student.phoneNumber || !student.guardianPhone || !student.currentLocation
      );
      
      console.log(`\n📊 Summary: ${studentsWithMissingData.length} out of ${data.length} students have missing data`);
      
      if (studentsWithMissingData.length > 0) {
        console.log('⚠️ This suggests a registration or database issue.');
        console.log('The backend is returning null values for these fields.');
      } else {
        console.log('✅ All students have complete data from the API.');
        console.log('The issue is likely in the frontend React component.');
      }
      
    } else {
      console.log('📊 No students found in response');
    }
    
    console.log('\n🔍 STEP 6: Check React Component State');
    console.log('--------------------------------------');
    
    // Try to find React component state
    console.log('Current page URL:', window.location.href);
    console.log('Current page title:', document.title);
    
    // Look for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools available');
      console.log('You can inspect React components in the DevTools');
    } else {
      console.log('ℹ️ React DevTools not available');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// Test registration function
async function testRegistration() {
  console.log('\n🚀 TESTING REGISTRATION');
  console.log('=======================');
  
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    if (!API_BASE) {
      console.error('❌ VITE_API_BASE_URL not defined');
      return;
    }
    
    const testUser = {
      name: 'Browser Test User',
      email: `browser-test-${Date.now()}@example.com`,
      password: 'testpass123',
      phoneNumber: '+1234567890',
      guardianPhone: '+0987654321',
      currentLocation: 'Test City, TS',
      country: 'Test Country'
    };
    
    console.log('📝 Testing registration with:', testUser);
    
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Registration response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Registration successful:', data);
    } else {
      const error = await response.text();
      console.error('❌ Registration failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Registration test error:', error);
  }
}

// Export functions
window.testAdminPanelData = testAdminPanelData;
window.testRegistration = testRegistration;

console.log('✅ Test functions loaded:');
console.log('  - testAdminPanelData() - Test admin panel data flow');
console.log('  - testRegistration() - Test registration');

// Auto-run the main test
testAdminPanelData(); 