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

async function debugAdminFields() {
  console.log('🔍 Starting comprehensive admin fields debug...\n');
  
  try {
    // Step 1: Check database directly
    console.log('📋 Step 1: Checking database directly...');
    const dbResult = await pool.query(`
      SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, created_at 
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${dbResult.rows.length} students in database:`);
    dbResult.rows.forEach((student, index) => {
      console.log(`\n👤 Student ${index + 1} (DB):`);
      console.log(`  ID: ${student.id}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Phone: ${student.phoneNumber || 'NULL'}`);
      console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL'}`);
      console.log(`  Location: ${student.currentLocation || 'NULL'}`);
      console.log(`  Country: ${student.country || 'NULL'}`);
      console.log(`  Created: ${student.created_at}`);
    });
    
    // Step 2: Get admin token
    console.log('\n🔑 Step 2: Getting admin token...');
    const adminCredentials = {
      email: 'admin@example.com',
      password: 'Admin12345!'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    const token = loginResponse.data.token;
    
    if (!token) {
      console.error('❌ Failed to get admin token');
      return;
    }
    
    console.log('✅ Admin token obtained successfully');
    
    // Step 3: Test API endpoint
    console.log('\n🌐 Step 3: Testing API endpoint...');
    const apiResponse = await axios.get(`${API_BASE}/admin/students`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API call successful');
    console.log(`Found ${apiResponse.data.length} students via API:`);
    
    apiResponse.data.forEach((student, index) => {
      console.log(`\n👤 Student ${index + 1} (API):`);
      console.log(`  ID: ${student.id}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Phone: ${student.phoneNumber || 'NULL'}`);
      console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL'}`);
      console.log(`  Location: ${student.currentLocation || 'NULL'}`);
      console.log(`  Country: ${student.country || 'NULL'}`);
      console.log(`  Created: ${student.created_at}`);
    });
    
    // Step 4: Compare database vs API
    console.log('\n🔍 Step 4: Comparing database vs API data...');
    
    if (dbResult.rows.length !== apiResponse.data.length) {
      console.log(`⚠️  Count mismatch: DB has ${dbResult.rows.length}, API returns ${apiResponse.data.length}`);
    } else {
      console.log('✅ Count matches between DB and API');
    }
    
    // Compare each student
    for (let i = 0; i < Math.min(dbResult.rows.length, apiResponse.data.length); i++) {
      const dbStudent = dbResult.rows[i];
      const apiStudent = apiResponse.data[i];
      
      console.log(`\n📊 Comparing Student ${i + 1}:`);
      
      const fields = ['phoneNumber', 'guardianPhone', 'currentLocation', 'country'];
      fields.forEach(field => {
        const dbValue = dbStudent[field];
        const apiValue = apiStudent[field];
        
        if (dbValue !== apiValue) {
          console.log(`  ❌ ${field}: DB="${dbValue}" vs API="${apiValue}"`);
        } else {
          console.log(`  ✅ ${field}: "${dbValue}"`);
        }
      });
    }
    
    // Step 5: Check for empty strings vs null
    console.log('\n🔍 Step 5: Checking for empty strings vs null values...');
    apiResponse.data.forEach((student, index) => {
      console.log(`\n👤 Student ${index + 1} field analysis:`);
      ['phoneNumber', 'guardianPhone', 'currentLocation', 'country'].forEach(field => {
        const value = student[field];
        console.log(`  ${field}: "${value}" (type: ${typeof value}, null: ${value === null}, undefined: ${value === undefined}, empty: ${value === ''})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error.response?.data || error.message);
  } finally {
    await pool.end();
  }
}

// Run the debug script
debugAdminFields(); 