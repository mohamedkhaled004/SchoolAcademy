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

console.log('🔍 REGISTRATION DATA TEST SCRIPT');
console.log('=================================');
console.log(`API Base URL: ${API_BASE}`);
console.log(`Database: ${DB_CONFIG.database}@${DB_CONFIG.host}:${DB_CONFIG.port}`);
console.log('');

async function testRegistrationData() {
  try {
    console.log('🚀 STEP 1: Testing Registration with All Fields');
    console.log('------------------------------------------------');
    
    // Test registration with all fields
    const testUser = {
      name: 'Test User Data Debug',
      email: `test-data-debug-${Date.now()}@example.com`,
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
    
    // Verify all fields are saved correctly
    const allFieldsSaved = dbUser.phoneNumber && dbUser.guardianPhone && dbUser.currentLocation && dbUser.country;
    console.log('\n✅ All fields saved correctly:', allFieldsSaved);
    
    if (!allFieldsSaved) {
      console.log('❌ Some fields are missing or null!');
      console.log('This indicates a registration or database issue.');
    } else {
      console.log('✅ Registration is working correctly!');
      console.log('The issue is likely in the admin panel frontend or API.');
    }
    
    console.log('\n🔍 STEP 3: Database Schema Check');
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
    
    console.log('\n🔍 STEP 4: Recent Students Analysis');
    console.log('-----------------------------------');
    
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
      console.log(`    Phone: ${student.phoneNumber || 'NULL/EMPTY'}`);
      console.log(`    Guardian Phone: ${student.guardianPhone || 'NULL/EMPTY'}`);
      console.log(`    Location: ${student.currentLocation || 'NULL/EMPTY'}`);
      console.log(`    Country: ${student.country || 'NULL/EMPTY'}`);
      console.log(`    Role: ${student.role}`);
      console.log(`    Created: ${student.created_at}`);
    });
    
    // Count students with missing data
    const studentsWithMissingData = sampleResult.rows.filter(student => 
      !student.phoneNumber || !student.guardianPhone || !student.currentLocation
    );
    
    console.log(`\n📊 Summary: ${studentsWithMissingData.length} out of ${sampleResult.rows.length} recent students have missing data`);
    
    if (studentsWithMissingData.length > 0) {
      console.log('⚠️ This suggests a systematic issue with registration or database storage.');
    } else {
      console.log('✅ All recent students have complete data.');
    }
    
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
testRegistrationData().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 