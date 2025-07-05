const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection and data...');
    
    // Test 1: Check if users table exists and has the right columns
    console.log('\n📋 Checking users table schema...');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Test 2: Check all students
    console.log('\n👥 Checking all students...');
    const studentsResult = await pool.query(`
      SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, created_at 
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${studentsResult.rows.length} students:`);
    studentsResult.rows.forEach((student, index) => {
      console.log(`\nStudent ${index + 1}:`);
      console.log(`  ID: ${student.id}`);
      console.log(`  Name: ${student.name}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Phone: ${student.phoneNumber || 'NULL'}`);
      console.log(`  Guardian Phone: ${student.guardianPhone || 'NULL'}`);
      console.log(`  Location: ${student.currentLocation || 'NULL'}`);
      console.log(`  Country: ${student.country || 'NULL'}`);
      console.log(`  Created: ${student.created_at}`);
    });
    
    // Test 3: Check if there are any NULL values in the required fields
    console.log('\n🔍 Checking for NULL values in required fields...');
    const nullCheckResult = await pool.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(phoneNumber) as with_phone,
        COUNT(guardianPhone) as with_guardian_phone,
        COUNT(currentLocation) as with_location,
        COUNT(country) as with_country
      FROM users 
      WHERE role = 'student'
    `);
    
    const stats = nullCheckResult.rows[0];
    console.log(`Total students: ${stats.total_students}`);
    console.log(`Students with phone: ${stats.with_phone}`);
    console.log(`Students with guardian phone: ${stats.with_guardian_phone}`);
    console.log(`Students with location: ${stats.with_location}`);
    console.log(`Students with country: ${stats.with_country}`);
    
  } catch (error) {
    console.error('❌ Database test error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 