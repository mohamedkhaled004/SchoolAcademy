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

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Flow: Registration → Database → Admin API\n');
  
  try {
    // Step 1: Register a new test student
    console.log('📝 Step 1: Registering new test student...');
    const testStudent = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Test Student',
      phoneNumber: '+1234567890',
      guardianPhone: '+1234567891',
      currentLocation: 'Test City',
      country: 'Egypt'
    };
    
    console.log('Test student data:', testStudent);
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testStudent, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful');
    console.log('Registration response:', registerResponse.data);
    
    // Step 2: Verify data in database directly
    console.log('\n📋 Step 2: Verifying data in database...');
    const dbResult = await pool.query(`
      SELECT id, email, name, phoneNumber, guardianPhone, currentLocation, country, role, created_at
      FROM users 
      WHERE email = $1
    `, [testStudent.email]);
    
    if (dbResult.rows.length === 0) {
      throw new Error('Student not found in database after registration');
    }
    
    const dbStudent = dbResult.rows[0];
    console.log('✅ Student found in database:');
    console.log('  ID:', dbStudent.id);
    console.log('  Email:', dbStudent.email);
    console.log('  Name:', dbStudent.name);
    console.log('  Phone:', dbStudent.phoneNumber);
    console.log('  Guardian Phone:', dbStudent.guardianPhone);
    console.log('  Location:', dbStudent.currentLocation);
    console.log('  Country:', dbStudent.country);
    console.log('  Role:', dbStudent.role);
    
    // Step 3: Get admin token
    console.log('\n🔑 Step 3: Getting admin token...');
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const token = loginResponse.data.token;
    if (!token) {
      throw new Error('Failed to get admin token');
    }
    
    console.log('✅ Admin token obtained');
    
    // Step 4: Test admin students API
    console.log('\n🌐 Step 4: Testing admin students API...');
    const adminResponse = await axios.get(`${API_BASE}/admin/students`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin API call successful');
    console.log(`Found ${adminResponse.data.length} students via API`);
    
    // Find our test student in the admin response
    const apiStudent = adminResponse.data.find(s => s.email === testStudent.email);
    
    if (!apiStudent) {
      console.log('❌ Test student not found in admin API response');
      console.log('Available students:', adminResponse.data.map(s => s.email));
    } else {
      console.log('✅ Test student found in admin API response:');
      console.log('  ID:', apiStudent.id);
      console.log('  Email:', apiStudent.email);
      console.log('  Name:', apiStudent.name);
      console.log('  Phone:', apiStudent.phoneNumber);
      console.log('  Guardian Phone:', apiStudent.guardianPhone);
      console.log('  Location:', apiStudent.currentLocation);
      console.log('  Country:', apiStudent.country);
      console.log('  Role:', apiStudent.role);
      
      // Step 5: Compare database vs API data
      console.log('\n🔍 Step 5: Comparing database vs API data...');
      const fields = ['phoneNumber', 'guardianPhone', 'currentLocation', 'country'];
      let allMatch = true;
      
      fields.forEach(field => {
        const dbValue = dbStudent[field];
        const apiValue = apiStudent[field];
        
        if (dbValue !== apiValue) {
          console.log(`  ❌ ${field}: DB="${dbValue}" vs API="${apiValue}"`);
          allMatch = false;
        } else {
          console.log(`  ✅ ${field}: "${dbValue}"`);
        }
      });
      
      if (allMatch) {
        console.log('\n🎉 SUCCESS: All fields match between database and API!');
      } else {
        console.log('\n⚠️  WARNING: Some fields do not match');
      }
    }
    
    // Step 6: Clean up - delete test student
    console.log('\n🧹 Step 6: Cleaning up test data...');
    await pool.query('DELETE FROM users WHERE email = $1', [testStudent.email]);
    console.log('✅ Test student deleted from database');
    
    console.log('\n✅ Complete flow test finished successfully!');
    
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

// Run the test
testCompleteFlow(); 