const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const DB_CONFIG = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'educational_platform',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
};

const pool = new Pool(DB_CONFIG);

console.log('🔍 ADMIN DATA FLOW DIAGNOSTIC SCRIPT');
console.log('=====================================');
console.log(`API Base URL: ${API_BASE}`);
console.log(`Database: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);
console.log('');

async function testCompleteDataFlow() {
  try {
    console.log('🚀 STEP 1: Testing Registration with All Fields');
    console.log('------------------------------------------------');
    
    // Test registration with all fields
    const testUser = {
      name: 'Test User Admin Debug',
      email: `test-admin-debug-${Date.now()}@example.com`,
      password: 'testpass123',
      phoneNumber: '+1234567890',
      guardianPhone: '+0987654321',
      currentLocation: 'New York, NY',
      country: 'United States'
    };
    
    console.log('📝 Registration data:', testUser);
    
    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, testUser);
    console.log('✅ Registration successful');
    console.log('📊 Registration response:', registerResponse.data);
    
    console.log('\n🔍 STEP 2: Verifying Database Storage');
    console.log('--------------------------------------');
    
    // Check database directly
    const dbResult = await pool.query(
      'SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, role, created_at FROM users WHERE email = $1',
      [testUser.email]
    );
    
    if (dbResult.rows.length === 0) {
      console.log('❌ User not found in database!');
      return;
    }
    
    const dbUser = dbResult.rows[0];
    console.log('✅ User found in database');
    console.log('📊 Database record:', {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phoneNumber: dbUser.phoneNumber,
      guardianPhone: dbUser.guardianPhone,
      currentLocation: dbUser.currentLocation,
      country: dbUser.country,
      role: dbUser.role,
      created_at: dbUser.created_at
    });
    
    // Check for null values
    console.log('\n🔍 Field Value Analysis:');
    console.log('  phoneNumber:', dbUser.phoneNumber, '(null?', dbUser.phoneNumber === null, ')');
    console.log('  guardianPhone:', dbUser.guardianPhone, '(null?', dbUser.guardianPhone === null, ')');
    console.log('  currentLocation:', dbUser.currentLocation, '(null?', dbUser.currentLocation === null, ')');
    console.log('  country:', dbUser.country, '(null?', dbUser.country === null, ')');
    
    console.log('\n🔍 STEP 3: Testing Admin Login');
    console.log('-------------------------------');
    
    // Login as admin (you'll need to create an admin user first)
    const adminLoginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: 'admin@example.com', // Replace with your admin email
      password: 'adminpass123'    // Replace with your admin password
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('🔑 Admin token received');
    
    console.log('\n🔍 STEP 4: Testing Admin Students Endpoint');
    console.log('-------------------------------------------');
    
    // Test admin students endpoint
    const adminStudentsResponse = await axios.get(`${API_BASE}/api/admin/students`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('✅ Admin students endpoint successful');
    console.log('📊 Response status:', adminStudentsResponse.status);
    console.log('📊 Response data type:', typeof adminStudentsResponse.data);
    console.log('📊 Is array:', Array.isArray(adminStudentsResponse.data));
    console.log('📊 Number of students:', adminStudentsResponse.data.length);
    
    // Find our test user in the response
    const testUserInResponse = adminStudentsResponse.data.find(
      student => student.email === testUser.email
    );
    
    if (testUserInResponse) {
      console.log('\n✅ Test user found in admin response');
      console.log('📊 Admin response data for test user:', {
        id: testUserInResponse.id,
        name: testUserInResponse.name,
        email: testUserInResponse.email,
        phoneNumber: testUserInResponse.phoneNumber,
        guardianPhone: testUserInResponse.guardianPhone,
        currentLocation: testUserInResponse.currentLocation,
        country: testUserInResponse.country,
        role: testUserInResponse.role,
        created_at: testUserInResponse.created_at
      });
      
      // Compare with database
      console.log('\n🔍 STEP 5: Data Comparison');
      console.log('---------------------------');
      console.log('Database vs Admin Response:');
      console.log('  phoneNumber:', dbUser.phoneNumber, 'vs', testUserInResponse.phoneNumber, '(match?', dbUser.phoneNumber === testUserInResponse.phoneNumber, ')');
      console.log('  guardianPhone:', dbUser.guardianPhone, 'vs', testUserInResponse.guardianPhone, '(match?', dbUser.guardianPhone === testUserInResponse.guardianPhone, ')');
      console.log('  currentLocation:', dbUser.currentLocation, 'vs', testUserInResponse.currentLocation, '(match?', dbUser.currentLocation === testUserInResponse.currentLocation, ')');
      console.log('  country:', dbUser.country, 'vs', testUserInResponse.country, '(match?', dbUser.country === testUserInResponse.country, ')');
    } else {
      console.log('❌ Test user not found in admin response!');
      console.log('📊 All students in response:', adminStudentsResponse.data);
    }
    
    console.log('\n🔍 STEP 6: Database Schema Check');
    console.log('--------------------------------');
    
    // Check table schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Users table schema:');
    schemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('\n🔍 STEP 7: Sample Data Analysis');
    console.log('-------------------------------');
    
    // Get sample of recent students
    const sampleResult = await pool.query(`
      SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, role, created_at
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('📊 Recent 5 students in database:');
    sampleResult.rows.forEach((student, index) => {
      console.log(`\n  Student ${index + 1}:`);
      console.log(`    ID: ${student.id}`);
      console.log(`    Name: ${student.name}`);
      console.log(`    Email: ${student.email}`);
      console.log(`    Phone: ${student.phoneNumber} (null? ${student.phoneNumber === null})`);
      console.log(`    Guardian Phone: ${student.guardianPhone} (null? ${student.guardianPhone === null})`);
      console.log(`    Location: ${student.currentLocation} (null? ${student.currentLocation === null})`);
      console.log(`    Country: ${student.country} (null? ${student.country === null})`);
      console.log(`    Role: ${student.role}`);
      console.log(`    Created: ${student.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
  } finally {
    await pool.end();
  }
}

// Run the test
testCompleteDataFlow().then(() => {
  console.log('\n✅ Diagnostic complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
}); 