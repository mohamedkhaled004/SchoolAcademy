const { Pool } = require('pg');

// Configuration - adjust this to match your database setup
const CONFIG = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/website'
};

// Database connection
const pool = new Pool({
  connectionString: CONFIG.databaseUrl
});

async function checkSchema() {
  console.log('🔍 Checking Database Schema...\n');
  
  try {
    // Check if users table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ Users table does not exist!');
      return;
    }
    
    console.log('✅ Users table exists');
    
    // Get current schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current Users Table Schema:');
    console.log('─'.repeat(80));
    console.log('Column Name        | Data Type | Nullable | Default');
    console.log('─'.repeat(80));
    
    schemaResult.rows.forEach(col => {
      console.log(`${col.column_name.padEnd(16)} | ${col.data_type.padEnd(9)} | ${col.is_nullable === 'YES' ? 'YES' : 'NO'.padEnd(8)} | ${col.column_default || 'NULL'}`);
    });
    
    // Check for required columns
    const requiredColumns = ['phoneNumber', 'guardianPhone', 'currentLocation'];
    const existingColumns = schemaResult.rows.map(row => row.column_name);
    
    console.log('\n🔍 Checking Required Columns:');
    console.log('─'.repeat(40));
    
    let allColumnsExist = true;
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`✅ ${col} - EXISTS`);
      } else {
        console.log(`❌ ${col} - MISSING`);
        allColumnsExist = false;
      }
    });
    
    if (!allColumnsExist) {
      console.log('\n⚠️  Missing columns detected!');
      console.log('\nTo manually add missing columns, run these SQL commands:');
      console.log('─'.repeat(60));
      requiredColumns.forEach(col => {
        if (!existingColumns.includes(col)) {
          console.log(`ALTER TABLE users ADD COLUMN "${col}" TEXT;`);
        }
      });
    } else {
      console.log('\n✅ All required columns exist!');
    }
    
    // Check sample data
    console.log('\n📊 Sample Data Check:');
    console.log('─'.repeat(40));
    
    const sampleData = await pool.query(`
      SELECT id, email, name, "phoneNumber", "guardianPhone", "currentLocation", country, role
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    if (sampleData.rows.length === 0) {
      console.log('No students found in database');
    } else {
      sampleData.rows.forEach((student, index) => {
        console.log(`\n👤 Student ${index + 1}:`);
        console.log(`  ID: ${student.id}`);
        console.log(`  Email: ${student.email}`);
        console.log(`  Name: ${student.name}`);
        console.log(`  Phone: "${student.phoneNumber || 'NULL'}"`);
        console.log(`  Guardian Phone: "${student.guardianPhone || 'NULL'}"`);
        console.log(`  Location: "${student.currentLocation || 'NULL'}"`);
        console.log(`  Country: ${student.country}`);
        console.log(`  Role: ${student.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Database connection failed. Please check:');
      console.error('1. PostgreSQL is running');
      console.error('2. Database connection string is correct');
      console.error('3. Database exists');
    } else if (error.code === '28P01') {
      console.error('Authentication failed. Please check your database credentials.');
    }
  } finally {
    await pool.end();
  }
}

checkSchema().catch(console.error); 