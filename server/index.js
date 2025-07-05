import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// ✅ لازم التعريف هنا في الأول
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ وبعد كده نستخدم dotenv
dotenv.config({ path: path.resolve(__dirname, '.env') });

// باقي الاستيرادات
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';


const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME
});

// Encryption utilities
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const encryptData = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decryptData = (encryptedData, key) => {
  try {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Users table with all fields including sensitive data
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        country TEXT,
        "phoneNumber" TEXT,
        "guardianPhone" TEXT,
        "currentLocation" TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migrate existing users table to new schema
    await migrateUsersTable(client);

    // Teachers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bio TEXT,
        subject TEXT NOT NULL,
        photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        teacher_id INTEGER,
        video_url TEXT,
        thumbnail TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        is_free BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    // Access codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS access_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        class_id INTEGER,
        price DECIMAL(10,2) NOT NULL,
        is_used BOOLEAN DEFAULT false,
        used_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id),
        FOREIGN KEY (used_by) REFERENCES users(id)
      )
    `);

    // User classes (enrolled classes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_classes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        class_id INTEGER,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (class_id) REFERENCES classes(id),
        UNIQUE(user_id, class_id)
      )
    `);

    // Insert default admin user
    const adminPassword = bcrypt.hashSync('Admin12345!', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (email) DO NOTHING
    `, ['admin@example.com', adminPassword, 'Administrator', 'admin']);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  } finally {
    client.release();
  }
};

// Database migration function to ensure all required columns exist
const migrateUsersTable = async (client) => {
  try {
    console.log('🔧 Checking users table schema...');
    
    // Get current columns
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    const existingColumns = result.rows.map(row => row.column_name);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add missing columns if they don't exist
    const requiredColumns = [
      { name: 'phoneNumber', type: 'TEXT' },
      { name: 'guardianPhone', type: 'TEXT' },
      { name: 'currentLocation', type: 'TEXT' }
    ];
    
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding missing column: ${column.name}`);
        await client.query(`ALTER TABLE users ADD COLUMN "${column.name}" ${column.type}`);
      }
    }
    
    // Verify final schema
    const finalResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final users table schema:');
    finalResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

// Migrate existing sensitive data to secure storage
const migrateSensitiveData = async (client) => {
  try {
    console.log('🔄 Starting sensitive data migration...');
    
    // Get all users with sensitive data
    const usersResult = await client.query(`
      SELECT id, "phoneNumber", "guardianPhone", "currentLocation"
      FROM users 
      WHERE "phoneNumber" IS NOT NULL OR "guardianPhone" IS NOT NULL OR "currentLocation" IS NOT NULL
    `);
    
    console.log(`📊 Found ${usersResult.rows.length} users with sensitive data to migrate`);
    
    for (const user of usersResult.rows) {
      if (user.phoneNumber || user.guardianPhone || user.currentLocation) {
        // Generate encryption key for this user
        const encryptionKey = generateEncryptionKey();
        const encryptionKeyHash = bcrypt.hashSync(encryptionKey, 10);
        
        // Encrypt sensitive data
        const encryptedPhone = user.phoneNumber ? encryptData(user.phoneNumber, encryptionKey) : null;
        const encryptedGuardianPhone = user.guardianPhone ? encryptData(user.guardianPhone, encryptionKey) : null;
        const encryptedLocation = user.currentLocation ? encryptData(user.currentLocation, encryptionKey) : null;
        
        // Insert into secure storage
        await client.query(`
          INSERT INTO student_sensitive_data 
          (user_id, phone_number_encrypted, guardian_phone_encrypted, location_encrypted, encryption_key_hash)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id) DO UPDATE SET
            phone_number_encrypted = EXCLUDED.phone_number_encrypted,
            guardian_phone_encrypted = EXCLUDED.guardian_phone_encrypted,
            location_encrypted = EXCLUDED.location_encrypted,
            encryption_key_hash = EXCLUDED.encryption_key_hash,
            updated_at = CURRENT_TIMESTAMP
        `, [user.id, encryptedPhone, encryptedGuardianPhone, encryptedLocation, encryptionKeyHash]);
        
        console.log(`✅ Migrated sensitive data for user ${user.id}`);
      }
    }
    
    console.log('✅ Sensitive data migration completed');
    
  } catch (error) {
    console.error('❌ Sensitive data migration error:', error);
    throw error;
  }
};

// Initialize database on startup
initializeDatabase();

// Add route logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Token validation endpoint
app.get('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔧 Login attempt for:', email);

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      console.error('❌ Invalid credentials for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Login successful for:', email);
    console.log('  User ID:', user.id);
    console.log('  Role:', user.role);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        guardianPhone: user.guardianPhone,
        currentLocation: user.currentLocation,
        country: user.country,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  console.log('🚀 REGISTRATION ENDPOINT - START');
  console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
  
  // Step 1: Extract and validate all fields from req.body
  const { email, password, name, phoneNumber, guardianPhone, currentLocation, country } = req.body;
  
  console.log('🔍 Extracted values:');
  console.log('  email:', email, '(type:', typeof email, ')');
  console.log('  password:', password ? '[HIDDEN]' : 'undefined', '(type:', typeof password, ')');
  console.log('  name:', name, '(type:', typeof name, ')');
  console.log('  phoneNumber:', phoneNumber, '(type:', typeof phoneNumber, ')');
  console.log('  guardianPhone:', guardianPhone, '(type:', typeof guardianPhone, ')');
  console.log('  currentLocation:', currentLocation, '(type:', typeof currentLocation, ')');
  console.log('  country:', country, '(type:', typeof country, ')');
  
  // Step 2: Validate all fields are present and not empty
  const validationErrors = [];
  
  if (!email || typeof email !== 'string' || !email.trim()) {
    validationErrors.push('Email is required and must be a string');
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    validationErrors.push('Password is required and must be at least 6 characters');
  }
  
  if (!name || typeof name !== 'string' || !name.trim()) {
    validationErrors.push('Name is required and must be a string');
  }
  
  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    validationErrors.push('Phone number is required and must be a string');
  }
  
  if (!guardianPhone || typeof guardianPhone !== 'string' || !guardianPhone.trim()) {
    validationErrors.push('Guardian phone is required and must be a string');
  }
  
  if (!currentLocation || typeof currentLocation !== 'string' || !currentLocation.trim()) {
    validationErrors.push('Current location is required and must be a string');
  }
  
  if (!country || typeof country !== 'string' || !country.trim()) {
    validationErrors.push('Country is required and must be a string');
  }
  
  if (validationErrors.length > 0) {
    console.error('❌ Validation failed:', validationErrors);
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: validationErrors.join('. ') 
    });
  }
  
  // Step 3: Clean and prepare values
  const cleanEmail = email.trim();
  const cleanName = name.trim();
  const cleanPhoneNumber = phoneNumber.trim();
  const cleanGuardianPhone = guardianPhone.trim();
  const cleanCurrentLocation = currentLocation.trim();
  const cleanCountry = country.trim();
  
  console.log('🧹 Cleaned values:');
  console.log('  email:', cleanEmail);
  console.log('  name:', cleanName);
  console.log('  phoneNumber:', cleanPhoneNumber);
  console.log('  guardianPhone:', cleanGuardianPhone);
  console.log('  currentLocation:', cleanCurrentLocation);
  console.log('  country:', cleanCountry);
  
  // Step 4: Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log('🔐 Password hashed successfully');
  
  try {
    // Step 5: Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingUser.rows.length > 0) {
      console.error('❌ User already exists:', cleanEmail);
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Step 6: Create user with all data including sensitive fields
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password, country, "phoneNumber", "guardianPhone", "currentLocation", role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, country, "phoneNumber", "guardianPhone", "currentLocation", role, created_at
    `, [cleanName, cleanEmail, hashedPassword, cleanCountry, cleanPhoneNumber, cleanGuardianPhone, cleanCurrentLocation, 'student']);
    
    const user = userResult.rows[0];
    console.log('✅ User created successfully in database:');
    console.log('  ID:', user.id);
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Country:', user.country);
    console.log('  Phone Number:', user.phoneNumber);
    console.log('  Guardian Phone:', user.guardianPhone);
    console.log('  Current Location:', user.currentLocation);
    console.log('  Role:', user.role);
    console.log('  Created At:', user.created_at);
    
    // Step 8: Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('🎫 JWT token generated successfully');
    
    // Step 9: Prepare response (include all data)
    const responseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      phoneNumber: user.phoneNumber,
      guardianPhone: user.guardianPhone,
      currentLocation: user.currentLocation,
      role: user.role
    };
    
    console.log('📤 Sending response:');
    console.log('  Status: 201');
    console.log('  User object:', JSON.stringify(responseUser, null, 2));
    
    // Step 10: Send response
    res.status(201).json({
      token,
      user: responseUser
    });
    
    console.log('✅ Registration completed successfully for:', cleanEmail);
    console.log('🚀 REGISTRATION ENDPOINT - END');
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Email already exists' });
    } else if (error.code === '23502') { // Not null violation
      return res.status(400).json({ error: 'Required fields are missing: ' + error.message });
    } else if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({ error: 'Database not properly initialized' });
    } else if (error.code === '42703') { // Column doesn't exist
      return res.status(500).json({ error: 'Database schema error: ' + error.message });
    } else {
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }
});

// Teachers routes
app.get('/api/teachers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/teachers/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM teachers WHERE id = $1', [id]);
    const teacher = result.rows[0];
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/teachers', authenticateToken, upload.single('photo'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, bio, subject } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  // ✅ Enhanced validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Teacher name is required' });
  }
  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  try {
    console.log('Creating teacher:', { name, bio, subject, photo });
    
    const result = await pool.query(
      'INSERT INTO teachers (name, bio, subject, photo) VALUES ($1, $2, $3, $4) RETURNING *',
      [name.trim(), bio?.trim() || '', subject.trim(), photo]
    );
    
    console.log('Teacher created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create teacher error:', error);
    
    // ✅ Enhanced error handling
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'A teacher with this name already exists' });
    } else if (error.code === '23502') { // Not null violation
      res.status(400).json({ error: 'Required fields are missing' });
    } else {
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }
});

app.delete('/api/teachers/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Classes routes
app.get('/api/classes', async (req, res) => {
  const { teacher_id } = req.query;
  
  try {
    let query = `
      SELECT c.*, t.name as teacher_name 
      FROM classes c 
      JOIN teachers t ON c.teacher_id = t.id
    `;
    let params = [];

    if (teacher_id) {
      query += ` WHERE c.teacher_id = $1`;
      params.push(teacher_id);
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/classes', authenticateToken, upload.single('thumbnail'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, teacher_id, video_url, price } = req.body;
  const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;
  const is_free = parseFloat(price) === 0 ? true : false;

  try {
    const result = await pool.query(
      `INSERT INTO classes (title, description, teacher_id, video_url, thumbnail, price, is_free) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, description, teacher_id, video_url, thumbnail, price, is_free]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/classes/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM classes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Access codes routes
app.post('/api/access-codes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { class_id, price } = req.body;
  const code = uuidv4().substring(0, 8).toUpperCase();

  try {
    const result = await pool.query(
      'INSERT INTO access_codes (code, class_id, price) VALUES ($1, $2, $3) RETURNING *',
      [code, class_id, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create access code error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/access-codes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(`
      SELECT ac.*, c.title as class_title, u.name as used_by_name 
      FROM access_codes ac 
      JOIN classes c ON ac.class_id = c.id 
      LEFT JOIN users u ON ac.used_by = u.id 
      ORDER BY ac.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get access codes error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Redeem access code
app.post('/api/redeem-code', authenticateToken, async (req, res) => {
  const { code } = req.body;
  const user_id = req.user.id;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // First, check if the code exists and is unused
    const accessCodeResult = await client.query(
      'SELECT * FROM access_codes WHERE code = $1 AND is_used = false',
      [code]
    );
    
    const accessCode = accessCodeResult.rows[0];
    if (!accessCode) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or already used code' });
    }

    // Check if user already has access to this class
    const existingAccessResult = await client.query(
      'SELECT * FROM user_classes WHERE user_id = $1 AND class_id = $2',
      [user_id, accessCode.class_id]
    );

    if (existingAccessResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You already have access to this class' });
    }

    // Mark code as used
    await client.query(
      'UPDATE access_codes SET is_used = true, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE id = $2',
      [user_id, accessCode.id]
    );

    // Enroll user in the class
    await client.query(
      'INSERT INTO user_classes (user_id, class_id) VALUES ($1, $2)',
      [user_id, accessCode.class_id]
    );

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Code redeemed successfully!',
      class_id: accessCode.class_id
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Redeem code error:', error);
    res.status(500).json({ error: 'Database error during redemption' });
  } finally {
    client.release();
  }
});

// Enroll in free class
app.post('/api/enroll-free', authenticateToken, async (req, res) => {
  const { class_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if class is free
    const classResult = await pool.query(
      'SELECT * FROM classes WHERE id = $1 AND is_free = true',
      [class_id]
    );
    
    if (classResult.rows.length === 0) {
      return res.status(400).json({ error: 'Class not found or not free' });
    }

    // Check if already enrolled
    const existingAccessResult = await pool.query(
      'SELECT * FROM user_classes WHERE user_id = $1 AND class_id = $2',
      [user_id, class_id]
    );

    if (existingAccessResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }

    // Enroll user
    await pool.query(
      'INSERT INTO user_classes (user_id, class_id) VALUES ($1, $2)',
      [user_id, class_id]
    );

    res.json({ 
      success: true, 
      message: 'Enrolled successfully!',
      class_id: class_id
    });
  } catch (error) {
    console.error('Enroll free class error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get user's enrolled classes
app.get('/api/my-classes', authenticateToken, async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(`
      SELECT c.*, t.name as teacher_name, uc.enrolled_at 
      FROM user_classes uc 
      JOIN classes c ON uc.class_id = c.id 
      JOIN teachers t ON c.teacher_id = t.id 
      WHERE uc.user_id = $1 
      ORDER BY uc.enrolled_at DESC
    `, [user_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Check if user has access to a class
app.get('/api/check-access/:class_id', authenticateToken, async (req, res) => {
  const { class_id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM user_classes WHERE user_id = $1 AND class_id = $2',
      [user_id, class_id]
    );
    res.json({ hasAccess: result.rows.length > 0 });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update class (video) info
app.put('/api/videos/:id', authenticateToken, upload.single('thumbnail'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, description, video_url, price } = req.body;
  let thumbnail = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    // Build update query dynamically
    let fields = [];
    let values = [];
    let paramCount = 1;

    if (title !== undefined) { 
      fields.push(`title = $${paramCount++}`); 
      values.push(title); 
    }
    if (description !== undefined) { 
      fields.push(`description = $${paramCount++}`); 
      values.push(description); 
    }
    if (video_url !== undefined) { 
      fields.push(`video_url = $${paramCount++}`); 
      values.push(video_url); 
    }
    if (price !== undefined) { 
      fields.push(`price = $${paramCount++}`); 
      values.push(price); 
    }
    if (thumbnail !== undefined) { 
      fields.push(`thumbnail = $${paramCount++}`); 
      values.push(thumbnail); 
    }
    // is_free logic
    if (price !== undefined) { 
      fields.push(`is_free = $${paramCount++}`); 
      values.push(parseFloat(price) === 0 ? true : false); 
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE classes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(sql, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Statistics endpoints
app.get('/api/stats/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['student']);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get students stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/stats/teachers', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM teachers');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get teachers stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/stats/classes', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM classes');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get classes stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Admin student management endpoints
app.get('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    console.log('🔍 Admin requesting students list...');
    console.log('👤 Admin user:', { id: req.user.id, email: req.user.email, role: req.user.role });
    
    // Get all students with all their data directly from users table
    const result = await pool.query(
      `SELECT 
        id, 
        email, 
        name, 
        country, 
        role, 
        created_at,
        "phoneNumber",
        "guardianPhone",
        "currentLocation"
       FROM users
       WHERE role = $1 
       ORDER BY created_at DESC`,
      ['student']
    );
    
    console.log(`✅ Found ${result.rows.length} students`);
    
    // Process students data
    const processedStudents = result.rows.map(student => ({
      id: student.id,
      email: student.email,
      name: student.name,
      country: student.country,
      role: student.role,
      created_at: student.created_at,
      phoneNumber: student.phoneNumber || 'N/A',
      guardianPhone: student.guardianPhone || 'N/A',
      currentLocation: student.currentLocation || 'N/A'
    }));
    
    // Enhanced logging for debugging
    console.log('📊 Processed students data:');
    processedStudents.forEach((student, index) => {
      console.log(`👤 Student ${index + 1}:`, {
        id: student.id,
        email: student.email,
        name: student.name,
        phoneNumber: student.phoneNumber,
        guardianPhone: student.guardianPhone,
        currentLocation: student.currentLocation,
        country: student.country,
        role: student.role,
        created_at: student.created_at
      });
    });
    
    // Log the exact response being sent
    console.log('📤 Sending response to frontend:');
    console.log('Response type:', typeof processedStudents);
    console.log('Response length:', processedStudents.length);
    console.log('Response structure:', Object.keys(processedStudents[0] || {}));
    
    res.json(processedStudents);
  } catch (error) {
    console.error('❌ Get admin students error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/admin/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, email, phoneNumber, guardianPhone, currentLocation, country, password } = req.body;

  // Basic validation
  if (!name || !email || !country) {
    return res.status(400).json({ error: 'Name, email, and country are required' });
  }

  try {
    // Check if email already exists for another user
    const existingUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Update the user with all data including sensitive fields
    let result;
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      result = await pool.query(
        `UPDATE users SET name = $1, email = $2, country = $3, password = $4, 
         "phoneNumber" = $5, "guardianPhone" = $6, "currentLocation" = $7
         WHERE id = $8 AND role = $9`,
        [name, email, country, hashedPassword, phoneNumber, guardianPhone, currentLocation, id, 'student']
      );
    } else {
      result = await pool.query(
        `UPDATE users SET name = $1, email = $2, country = $3, 
         "phoneNumber" = $4, "guardianPhone" = $5, "currentLocation" = $6
         WHERE id = $7 AND role = $8`,
        [name, email, country, phoneNumber, guardianPhone, currentLocation, id, 'student']
      );
    }
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/admin/students/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Secure sensitive data access endpoints
app.post('/api/admin/students/:id/request-access', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { dataType, reason } = req.body;

  if (!dataType || !reason) {
    return res.status(400).json({ error: 'Data type and reason are required' });
  }

  if (!['phone', 'guardian_phone', 'location', 'all'].includes(dataType)) {
    return res.status(400).json({ error: 'Invalid data type' });
  }

  try {
    // Check if student exists
    const studentResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2',
      [id, 'student']
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if access already exists and is still valid
    const existingAccess = await pool.query(
      `SELECT * FROM sensitive_data_access 
       WHERE admin_id = $1 AND student_id = $2 AND access_type = $3 AND is_active = true AND expires_at > NOW()`,
      [req.user.id, id, dataType]
    );

    if (existingAccess.rows.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Access already granted',
        accessId: existingAccess.rows[0].id,
        expiresAt: existingAccess.rows[0].expires_at
      });
    }

    // Grant access for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const accessResult = await pool.query(
      `INSERT INTO sensitive_data_access (admin_id, student_id, access_type, reason, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, granted_at, expires_at`,
      [req.user.id, id, dataType, reason, expiresAt]
    );

    // Log the access request
    await pool.query(
      `INSERT INTO access_audit_log (admin_id, student_id, action, data_type, reason, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, id, 'request', dataType, reason, req.ip, req.get('User-Agent')]
    );

    res.json({
      success: true,
      message: 'Access granted',
      accessId: accessResult.rows[0].id,
      expiresAt: accessResult.rows[0].expires_at
    });

  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admin/students/:id/sensitive-data', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { dataType } = req.query;

  if (!dataType || !['phone', 'guardian_phone', 'location', 'all'].includes(dataType)) {
    return res.status(400).json({ error: 'Valid data type is required' });
  }

  try {
    // Check if admin has valid access
    const accessResult = await pool.query(
      `SELECT * FROM sensitive_data_access 
       WHERE admin_id = $1 AND student_id = $2 AND access_type = $3 AND is_active = true AND expires_at > NOW()`,
      [req.user.id, id, dataType]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access not granted or expired' });
    }

    // Get encrypted sensitive data
    const sensitiveDataResult = await pool.query(
      `SELECT * FROM student_sensitive_data WHERE user_id = $1`,
      [id]
    );

    if (sensitiveDataResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sensitive data not found' });
    }

    const sensitiveData = sensitiveDataResult.rows[0];
    const decryptedData = {};

    // Decrypt requested data
    if (dataType === 'phone' || dataType === 'all') {
      if (sensitiveData.phone_number_encrypted) {
        // Note: In a real implementation, you'd need to securely retrieve the encryption key
        // For now, we'll return a placeholder indicating the data exists
        decryptedData.phoneNumber = '[ENCRYPTED - Requires secure key retrieval]';
      }
    }

    if (dataType === 'guardian_phone' || dataType === 'all') {
      if (sensitiveData.guardian_phone_encrypted) {
        decryptedData.guardianPhone = '[ENCRYPTED - Requires secure key retrieval]';
      }
    }

    if (dataType === 'location' || dataType === 'all') {
      if (sensitiveData.location_encrypted) {
        decryptedData.currentLocation = '[ENCRYPTED - Requires secure key retrieval]';
      }
    }

    // Log the data access
    await pool.query(
      `INSERT INTO access_audit_log (admin_id, student_id, action, data_type, reason, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, id, 'view', dataType, 'Data accessed', req.ip, req.get('User-Agent')]
    );

    res.json({
      success: true,
      data: decryptedData,
      accessExpiresAt: accessResult.rows[0].expires_at
    });

  } catch (error) {
    console.error('Get sensitive data error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admin/access-audit', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        aal.id,
        aal.action,
        aal.data_type,
        aal.reason,
        aal.created_at,
        aal.ip_address,
        admin.name as admin_name,
        student.name as student_name,
        student.email as student_email
       FROM access_audit_log aal
       JOIN users admin ON aal.admin_id = admin.id
       JOIN users student ON aal.student_id = student.id
       ORDER BY aal.created_at DESC
       LIMIT 100`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get access audit error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a catch-all route for debugging 404 errors
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    path: req.originalUrl,
    availableRoutes: [
      'POST /api/teachers',
      'GET /api/teachers',
      'POST /api/auth/login',
      'GET /api/admin/students',
      'GET /api/classes',
      'POST /api/classes',
      'GET /api/access-codes',
      'POST /api/access-codes'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
