// Frontend Admin Panel Debugging Script
// Run this in the browser console on the admin students page

console.log('🔍 FRONTEND ADMIN PANEL DEBUG SCRIPT');
console.log('=====================================');

// Function to test the complete frontend data flow
async function debugFrontendAdminFlow() {
  try {
    console.log('🚀 STEP 1: Checking Environment Variables');
    console.log('------------------------------------------');
    
    // Check if API_BASE is defined
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    console.log('VITE_API_BASE_URL:', API_BASE);
    console.log('Type:', typeof API_BASE);
    console.log('Is defined:', API_BASE !== undefined);
    
    if (!API_BASE) {
      console.error('❌ VITE_API_BASE_URL is not defined!');
      return;
    }
    
    console.log('\n🔍 STEP 2: Testing API Endpoint Directly');
    console.log('----------------------------------------');
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    console.log('Auth token exists:', !!token);
    
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      console.log('Please login as admin first');
      return;
    }
    
    // Test the admin students endpoint directly
    console.log('Testing GET /api/admin/students...');
    
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
    
    console.log('\n🔍 STEP 3: Analyzing Student Data');
    console.log('----------------------------------');
    
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
      
      console.log('\n🔍 STEP 4: Analyzing All Students');
      console.log('----------------------------------');
      
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
      
    } else {
      console.log('📊 No students found in response');
    }
    
    console.log('\n🔍 STEP 5: Testing React Component State');
    console.log('----------------------------------------');
    
    // Try to access React component state (if available)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools available');
      // You can inspect React components here
    } else {
      console.log('ℹ️ React DevTools not available');
    }
    
    // Check if we can find the students state in the current page
    console.log('Current page URL:', window.location.href);
    console.log('Current page title:', document.title);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// Function to test registration flow
async function testRegistrationFlow() {
  console.log('\n🚀 TESTING REGISTRATION FLOW');
  console.log('=============================');
  
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL;
    if (!API_BASE) {
      console.error('❌ VITE_API_BASE_URL not defined');
      return;
    }
    
    const testUser = {
      name: 'Frontend Test User',
      email: `frontend-test-${Date.now()}@example.com`,
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

// Function to check localStorage
function checkLocalStorage() {
  console.log('\n🔍 CHECKING LOCAL STORAGE');
  console.log('==========================');
  
  const keys = Object.keys(localStorage);
  console.log('LocalStorage keys:', keys);
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value ? value.substring(0, 50) + '...' : 'null/empty');
  });
}

// Export functions for manual testing
window.debugAdminFlow = debugFrontendAdminFlow;
window.testRegistration = testRegistrationFlow;
window.checkStorage = checkLocalStorage;

console.log('✅ Debug functions loaded:');
console.log('  - debugAdminFlow() - Test complete admin flow');
console.log('  - testRegistration() - Test registration');
console.log('  - checkStorage() - Check localStorage');

// Auto-run the main debug function
debugFrontendAdminFlow(); 