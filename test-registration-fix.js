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

async function testRegistrationFix() {
  console.log('🚀 Testing Registration Fix...\n');
  
  try {
    // Step 1: Register a new test user
    console.log('📝 Step 1: Registering new test user...');
    const testUser = {
      email: `test-reg-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Test Registration User',
      phoneNumber: '+1234567890',
      guardianPhone: '+1234567891',
      currentLocation: 'Test City',
      country: 'Egypt'
    };
    
    console.log('Test user data being sent:');
    console.log(JSON.stringify(testUser, null, 2));
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Registration API response:');
    console.log('Status:', registerResponse.status);
    console.log('Response data:', JSON.stringify(registerResponse.data, null, 2));
    
    // Step 2: Verify the response contains all fields
    console.log('\n🔍 Step 2: Verifying response contains all fields...');
    const responseUser = registerResponse.data.user;
    const requiredFields = ['id', 'name', 'email', 'phoneNumber', 'guardianPhone', 'currentLocation', 'country', 'role'];
    
    requiredFields.forEach(field => {
      if (responseUser[field] !== undefined) {
        console.log(`  ✅ ${field}: "${responseUser[field]}"`);
      } else {
        console.log(`  ❌ ${field}: MISSING`);
      }
    });
    
    // Step 3: Verify data in database directly
    console.log('\n📋 Step 3: Verifying data in database...');
    const dbResult = await pool.query(`
      SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, role, created_at
      FROM users 
      WHERE email = $1
    `, [testUser.email]);
    
    if (dbResult.rows.length === 0) {
      throw new Error('User not found in database after registration');
    }
    
    const dbUser = dbResult.rows[0];
    console.log('✅ User found in database:');
    console.log('  ID:', dbUser.id);
    console.log('  Name:', dbUser.name);
    console.log('  Email:', dbUser.email);
    console.log('  Phone:', dbUser.phoneNumber);
    console.log('  Guardian Phone:', dbUser.guardianPhone);
    console.log('  Location:', dbUser.currentLocation);
    console.log('  Country:', dbUser.country);
    console.log('  Role:', dbUser.role);
    console.log('  Created:', dbUser.created_at);
    
    // Step 4: Compare API response vs database
    console.log('\n🔍 Step 4: Comparing API response vs database...');
    let allMatch = true;
    
    requiredFields.forEach(field => {
      const apiValue = responseUser[field];
      const dbValue = dbUser[field];
      
      if (apiValue !== dbValue) {
        console.log(`  ❌ ${field}: API="${apiValue}" vs DB="${dbValue}"`);
        allMatch = false;
      } else {
        console.log(`  ✅ ${field}: "${apiValue}"`);
      }
    });
    
    if (allMatch) {
      console.log('\n🎉 SUCCESS: All fields match between API response and database!');
    } else {
      console.log('\n⚠️  WARNING: Some fields do not match');
    }
    
    // Step 5: Test admin API to verify the user appears there
    console.log('\n🌐 Step 5: Testing admin API...');
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
    const adminResponse = await axios.get(`${API_BASE}/admin/students`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const adminUser = adminResponse.data.find(u => u.email === testUser.email);
    
    if (adminUser) {
      console.log('✅ User found in admin API:');
      console.log('  Phone:', adminUser.phoneNumber);
      console.log('  Guardian Phone:', adminUser.guardianPhone);
      console.log('  Location:', adminUser.currentLocation);
      console.log('  Country:', adminUser.country);
    } else {
      console.log('❌ User not found in admin API');
    }
    
    // Step 6: Clean up
    console.log('\n🧹 Step 6: Cleaning up test data...');
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    console.log('✅ Test user deleted from database');
    
    console.log('\n✅ Registration fix test completed successfully!');
    
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
testRegistrationFix(); 