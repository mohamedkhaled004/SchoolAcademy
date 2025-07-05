const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

async function testAdminAPI() {
  console.log('🚀 Starting Admin API Test...\n');
  
  try {
    // Step 1: Test database connection
    console.log('📋 Step 1: Testing database connection...');
    const dbTest = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
    console.log(`✅ Database connected. Found ${dbTest.rows[0].count} students\n`);
    
    // Step 2: Get admin token automatically
    console.log('🔑 Step 2: Getting admin token automatically...');
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.token;
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Admin token obtained automatically\n');
    
    // Step 3: Test admin students endpoint with token
    console.log('🌐 Step 3: Testing /api/admin/students endpoint...');
    const studentsResponse = await axios.get(`${API_BASE}/admin/students`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API call successful');
    console.log(`📊 Found ${studentsResponse.data.length} students via API\n`);
    
    // Step 4: Display student data
    if (studentsResponse.data.length > 0) {
      console.log('👥 Student Data:');
      studentsResponse.data.forEach((student, index) => {
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
    } else {
      console.log('📭 No students found');
    }
    
    // Step 5: Verify all required fields are present
    console.log('\n🔍 Step 4: Verifying field presence...');
    const requiredFields = ['phoneNumber', 'guardianPhone', 'currentLocation', 'country'];
    
    studentsResponse.data.forEach((student, index) => {
      console.log(`\n📋 Student ${index + 1} field check:`);
      requiredFields.forEach(field => {
        const value = student[field];
        const status = value ? '✅' : '❌';
        console.log(`  ${status} ${field}: "${value}"`);
      });
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
    } else if (error.request) {
      console.error('  Network error:', error.message);
    } else {
      console.error('  Error:', error.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🏁 Script finished');
  }
}

// Execute the test
testAdminAPI(); 