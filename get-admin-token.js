const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function getAdminToken() {
  try {
    console.log('🔑 Getting admin token...');
    console.log('API Base URL:', API_BASE);
    
    // Admin credentials (these should match what's in the database)
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    console.log('Logging in with:', adminCredentials.email);
    
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    
    if (response.data && response.data.token) {
      console.log('✅ Login successful!');
      console.log('🔑 JWT Token:');
      console.log(response.data.token);
      console.log('\n📋 Use this token in your curl command:');
      console.log(`curl -X GET "${API_BASE}/admin/students" \\`);
      console.log(`  -H "Authorization: Bearer ${response.data.token}" \\`);
      console.log(`  -H "Content-Type: application/json"`);
      
      return response.data.token;
    } else {
      console.error('❌ No token in response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

// Test the API with the token
async function testAdminStudentsAPI(token) {
  if (!token) {
    console.log('❌ No token available, skipping API test');
    return;
  }
  
  try {
    console.log('\n🧪 Testing /api/admin/students endpoint...');
    
    const response = await axios.get(`${API_BASE}/admin/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if all required fields are present
    if (Array.isArray(response.data)) {
      console.log(`\n📋 Found ${response.data.length} students`);
      
      response.data.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`);
        console.log(`  ID: ${student.id}`);
        console.log(`  Name: ${student.name}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Phone: ${student.phoneNumber || 'NULL'}`);
        console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL'}`);
        console.log(`  Location: ${student.currentLocation || 'NULL'}`);
        console.log(`  Country: ${student.country || 'NULL'}`);
        console.log(`  Created: ${student.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

// Run the script
async function main() {
  const token = await getAdminToken();
  await testAdminStudentsAPI(token);
}

main(); 