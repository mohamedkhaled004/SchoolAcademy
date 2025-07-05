const axios = require('axios');

// Test the connection with the correct API base URL
const API_BASE = 'http://localhost:3001/api';

async function testConnection() {
  console.log('🔍 Testing API Connection...\n');
  
  try {
    // Test basic connectivity
    console.log('📡 Testing server connectivity...');
    const response = await axios.get(`${API_BASE}/teachers`, {
      timeout: 5000
    });
    
    console.log('✅ Server is accessible!');
    console.log(`   Status: ${response.status}`);
    console.log(`   URL: ${API_BASE}/teachers`);
    
    // Test admin login
    console.log('\n🔐 Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin12345!'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin login successful!');
    console.log(`   Token: ${loginResponse.data.token ? 'Present' : 'Missing'}`);
    
    // Test students endpoint
    console.log('\n👥 Testing students endpoint...');
    const studentsResponse = await axios.get(`${API_BASE}/admin/students`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Students endpoint working!');
    console.log(`   Students count: ${studentsResponse.data.length}`);
    
    // Show sample data
    if (studentsResponse.data.length > 0) {
      const sampleStudent = studentsResponse.data[0];
      console.log('\n📊 Sample student data:');
      console.log(`   Email: ${sampleStudent.email}`);
      console.log(`   Phone: ${sampleStudent.phoneNumber}`);
      console.log(`   Guardian Phone: ${sampleStudent.guardianPhone}`);
      console.log(`   Location: ${sampleStudent.currentLocation}`);
    }
    
    console.log('\n🎉 All tests passed! The API is working correctly.');
    console.log('💡 Now try logging in through the frontend - it should work!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running on port 3001');
      console.error('   Please start the server with: npm start');
    } else if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

testConnection().catch(console.error); 