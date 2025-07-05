const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'database.db');

async function checkSchema() {
  console.log('🔍 Checking SQLite Database Schema...\n');
  console.log(`📁 Database file: ${dbPath}\n`);
  
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Check if users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        console.error('❌ Error checking if users table exists:', err.message);
        db.close();
        reject(err);
        return;
      }
      
      if (!row) {
        console.log('❌ Users table does not exist!');
        db.close();
        resolve();
        return;
      }
      
      console.log('✅ Users table exists');
      
      // Get current schema
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('❌ Error getting table schema:', err.message);
          db.close();
          reject(err);
          return;
        }
        
        console.log('\n📋 Current Users Table Schema:');
        console.log('─'.repeat(80));
        console.log('Column Name        | Data Type | Not Null | Default');
        console.log('─'.repeat(80));
        
        columns.forEach(col => {
          const notNull = col.notnull ? 'YES' : 'NO';
          const defaultValue = col.dflt_value || 'NULL';
          console.log(`${col.name.padEnd(16)} | ${col.type.padEnd(9)} | ${notNull.padEnd(8)} | ${defaultValue}`);
        });
        
        // Check for required columns
        const requiredColumns = ['phoneNumber', 'guardianPhone', 'currentLocation'];
        const existingColumns = columns.map(col => col.name);
        
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
        
        db.all(`
          SELECT id, email, name, "phoneNumber", "guardianPhone", "currentLocation", country, role, created_at
          FROM users 
          WHERE role = 'student' 
          ORDER BY created_at DESC 
          LIMIT 3
        `, (err, students) => {
          if (err) {
            console.error('❌ Error getting sample data:', err.message);
            db.close();
            reject(err);
            return;
          }
          
          if (students.length === 0) {
            console.log('No students found in database');
          } else {
            students.forEach((student, index) => {
              console.log(`\n👤 Student ${index + 1}:`);
              console.log(`  ID: ${student.id}`);
              console.log(`  Email: ${student.email}`);
              console.log(`  Name: ${student.name}`);
              console.log(`  Phone: "${student.phoneNumber || 'NULL'}"`);
              console.log(`  Guardian Phone: "${student.guardianPhone || 'NULL'}"`);
              console.log(`  Location: "${student.currentLocation || 'NULL'}"`);
              console.log(`  Country: ${student.country}`);
              console.log(`  Role: ${student.role}`);
              console.log(`  Created: ${student.created_at}`);
            });
            
            // Count students with missing data
            const studentsWithMissingData = students.filter(student => 
              !student.phoneNumber || !student.guardianPhone || !student.currentLocation
            );
            
            console.log(`\n📊 Summary: ${studentsWithMissingData.length} out of ${students.length} students have missing data`);
            
            if (studentsWithMissingData.length > 0) {
              console.log('⚠️  This indicates that existing students were registered before the schema update.');
              console.log('   New registrations should work correctly with the updated schema.');
            } else {
              console.log('✅ All students have complete data!');
            }
          }
          
          db.close();
          resolve();
        });
      });
    });
  });
}

checkSchema().catch(console.error); 