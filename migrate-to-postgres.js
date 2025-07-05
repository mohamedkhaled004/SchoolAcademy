#!/usr/bin/env node

/**
 * Migration script to transfer data from SQLite to PostgreSQL
 * Run this script after setting up your PostgreSQL database
 */

import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sqliteDb = new sqlite3.Database('./database.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    console.log('✅ PostgreSQL connection successful');
    
    // Migrate users
    console.log('📦 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const user of users) {
      await client.query(`
        INSERT INTO users (id, email, password, name, role, phoneNumber, guardianPhone, currentLocation, country, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO NOTHING
      `, [
        user.id, user.email, user.password, user.name, user.role,
        user.phoneNumber || null, user.guardianPhone || null,
        user.currentLocation || null, user.country || null,
        user.created_at
      ]);
    }
    console.log(`✅ Migrated ${users.length} users`);
    
    // Migrate teachers
    console.log('📦 Migrating teachers...');
    const teachers = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM teachers', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const teacher of teachers) {
      await client.query(`
        INSERT INTO teachers (id, name, bio, subject, photo, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        teacher.id, teacher.name, teacher.bio, teacher.subject,
        teacher.photo, teacher.created_at
      ]);
    }
    console.log(`✅ Migrated ${teachers.length} teachers`);
    
    // Migrate classes
    console.log('📦 Migrating classes...');
    const classes = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM classes', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const cls of classes) {
      await client.query(`
        INSERT INTO classes (id, title, description, teacher_id, video_url, thumbnail, price, is_free, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        cls.id, cls.title, cls.description, cls.teacher_id,
        cls.video_url, cls.thumbnail, cls.price,
        cls.is_free === 1 ? true : false, cls.created_at
      ]);
    }
    console.log(`✅ Migrated ${classes.length} classes`);
    
    // Migrate access codes
    console.log('📦 Migrating access codes...');
    const accessCodes = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM access_codes', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const code of accessCodes) {
      await client.query(`
        INSERT INTO access_codes (id, code, class_id, price, is_used, used_by, created_at, used_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO NOTHING
      `, [
        code.id, code.code, code.class_id, code.price,
        code.is_used === 1 ? true : false, code.used_by,
        code.created_at, code.used_at
      ]);
    }
    console.log(`✅ Migrated ${accessCodes.length} access codes`);
    
    // Migrate user classes
    console.log('📦 Migrating user classes...');
    const userClasses = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM user_classes', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const userClass of userClasses) {
      await client.query(`
        INSERT INTO user_classes (id, user_id, class_id, enrolled_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, class_id) DO NOTHING
      `, [
        userClass.id, userClass.user_id, userClass.class_id, userClass.enrolled_at
      ]);
    }
    console.log(`✅ Migrated ${userClasses.length} user class enrollments`);
    
    client.release();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export default migrateData; 