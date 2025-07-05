const { Pool } = require('pg');

// Configuration
const CONFIG = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/website'
};

// Database connection
const pool = new Pool({
  connectionString: CONFIG.databaseUrl
});

// Utility functions
const logSection = (title) => {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(title.length + 4));
};

const logSuccess = (message, data = null) => {
  console.log(`✅ ${message}`);
  if (data) console.log('   Data:', data);
};

const logError = (message, error = null) => {
  console.log(`❌ ${message}`);
  if (error) console.log('   Error:', error.message || error);
};

const logInfo = (message, data = null) => {
  console.log(`ℹ️ ${message}`);
  if (data) console.log('   Data:', data);
};

async function verifyDirectFix() {
  logSection('Direct Data Storage Fix Verification');
  
  try {
    // Step 1: Check database schema
    logSection('Step 1: Database Schema Check');
    
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    logInfo('Users table schema:');
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check if required columns exist
    const requiredColumns = ['phoneNumber', 'guardianPhone', 'currentLocation'];
    const existingColumns = schemaResult.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      logError(`Missing columns: ${missingColumns.join(', ')}`);
      logInfo('The database schema needs to be updated. Please restart the server to apply the schema changes.');
      return;
    } else {
      logSuccess('All required columns exist in users table');
    }
    
    // Step 2: Check existing students
    logSection('Step 2: Existing Students Analysis');
    
    const studentsResult = await pool.query(`
      SELECT id, email, name, "phoneNumber", "guardianPhone", "currentLocation", country, role, created_at
      FROM users 
      WHERE role = 'student' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (studentsResult.rows.length === 0) {
      logInfo('No students found in database');
    } else {
      logInfo(`Found ${studentsResult.rows.length} recent students:`);
      studentsResult.rows.forEach((student, index) => {
        console.log(`\n   Student ${index + 1}:`);
        console.log(`     ID: ${student.id}`);
        console.log(`     Email: ${student.email}`);
        console.log(`     Name: ${student.name}`);
        console.log(`     Phone: ${student.phoneNumber || 'NULL/EMPTY'}`);
        console.log(`     Guardian Phone: ${student.guardianPhone || 'NULL/EMPTY'}`);
        console.log(`     Location: ${student.currentLocation || 'NULL/EMPTY'}`);
        console.log(`     Country: ${student.country || 'NULL/EMPTY'}`);
        console.log(`     Role: ${student.role}`);
        console.log(`     Created: ${student.created_at}`);
      });
      
      // Count students with missing data
      const studentsWithMissingData = studentsResult.rows.filter(student => 
        !student.phoneNumber || !student.guardianPhone || !student.currentLocation
      );
      
      console.log(`\n📊 Summary: ${studentsWithMissingData.length} out of ${studentsResult.rows.length} recent students have missing data`);
      
      if (studentsWithMissingData.length > 0) {
        logError('Some students have missing sensitive data. This indicates the old encrypted storage system was used.');
        logInfo('To fix this, you may need to re-register these students or migrate their data.');
      } else {
        logSuccess('All recent students have complete data stored directly in the users table');
      }
    }
    
    // Step 3: Check if encrypted tables exist
    logSection('Step 3: Encrypted Tables Check');
    
    const encryptedTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('student_sensitive_data', 'sensitive_data_access', 'access_audit_log')
    `);
    
    if (encryptedTablesResult.rows.length > 0) {
      logInfo('Encrypted tables found (old system):');
      encryptedTablesResult.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      logInfo('These tables are no longer needed with the direct storage approach.');
    } else {
      logSuccess('No encrypted tables found - direct storage system is active');
    }
    
    logSuccess('Direct data fix verification completed!');
    logInfo('Summary:', {
      schema: '✅ Updated',
      directStorage: '✅ Active',
      existingData: studentsResult.rows.length > 0 ? '⚠️ Check above' : '✅ No existing data'
    });
    
  } catch (error) {
    logError('Verification failed');
    if (error.code === 'ECONNREFUSED') {
      logError('Database connection failed. Please ensure PostgreSQL is running and the connection string is correct.');
    } else if (error.code === '28P01') {
      logError('Authentication failed. Please check your database credentials.');
    } else {
      logError('Error:', error.message);
    }
  } finally {
    await pool.end();
    console.log('\n🏁 Verification completed');
  }
}

// Run the verification
verifyDirectFix().catch(console.error); 