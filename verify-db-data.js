const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

async function verifyDatabaseData() {
  console.log('🔍 Verifying database data...\n');
  
  try {
    // Check users table schema
    console.log('📋 Users table schema:');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check all students with exact query from backend
    console.log('\n👥 Students data (using backend query):');
    const studentsResult = await pool.query(`
      SELECT id, email, name, phoneNumber, guardianPhone, currentLocation, country, role, created_at
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${studentsResult.rows.length} students:`);
    
    if (studentsResult.rows.length > 0) {
      studentsResult.rows.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`);
        console.log(`  ID: ${student.id}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Name: ${student.name}`);
        console.log(`  Phone: ${student.phoneNumber || 'NULL'}`);
        console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL'}`);
        console.log(`  Location: ${student.currentLocation || 'NULL'}`);
        console.log(`  Country: ${student.country || 'NULL'}`);
        console.log(`  Role: ${student.role}`);
        console.log(`  Created: ${student.created_at}`);
        
        // Check field values specifically
        console.log(`  Field checks:`);
        console.log(`    phoneNumber: "${student.phoneNumber}" (type: ${typeof student.phoneNumber})`);
        console.log(`    guardianPhone: "${student.guardianPhone}" (type: ${typeof student.guardianPhone})`);
        console.log(`    currentLocation: "${student.currentLocation}" (type: ${typeof student.currentLocation})`);
        console.log(`    country: "${student.country}" (type: ${typeof student.country})`);
      });
    } else {
      console.log('No students found in database');
    }
    
    // Check for any students with missing data
    console.log('\n🔍 Checking for students with missing data:');
    const missingDataResult = await pool.query(`
      SELECT id, name, email,
             CASE WHEN phoneNumber IS NULL OR phoneNumber = '' THEN 'MISSING' ELSE 'PRESENT' END as phone_status,
             CASE WHEN guardianPhone IS NULL OR guardianPhone = '' THEN 'MISSING' ELSE 'PRESENT' END as guardian_phone_status,
             CASE WHEN currentLocation IS NULL OR currentLocation = '' THEN 'MISSING' ELSE 'PRESENT' END as location_status,
             CASE WHEN country IS NULL OR country = '' THEN 'MISSING' ELSE 'PRESENT' END as country_status
      FROM users 
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);
    
    missingDataResult.rows.forEach((student, index) => {
      console.log(`\n📊 Student ${index + 1} (${student.name}):`);
      console.log(`  Phone: ${student.phone_status}`);
      console.log(`  Guardian Phone: ${student.guardian_phone_status}`);
      console.log(`  Location: ${student.location_status}`);
      console.log(`  Country: ${student.country_status}`);
    });
    
    console.log('\n✅ Database verification completed!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🏁 Script finished');
  }
}

verifyDatabaseData(); 