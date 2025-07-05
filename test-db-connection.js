#!/usr/bin/env node

/**
 * Test script to verify PostgreSQL connection and basic functionality
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', result.rows[0].current_time);
    
    // Test table creation (this will be handled by the main server)
    console.log('✅ Database connection is ready for use');
    
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.log('\n💡 Make sure to:');
    console.log('1. Install PostgreSQL');
    console.log('2. Create a database: CREATE DATABASE educational_platform;');
    console.log('3. Set DATABASE_URL in your .env file');
    console.log('4. Ensure PostgreSQL is running');
  } finally {
    await pool.end();
  }
}

testConnection(); 