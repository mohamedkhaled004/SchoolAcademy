import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const db = new sqlite3.Database('./database.db');

// Initialize database tables
// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ✅ Add missing columns if not exist
  const ensureColumnExists = (table, column, type) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) {
        console.error(`Error checking column '${column}':`, err.message);
        return;
      }
      const exists = rows.some(row => row.name === column);
      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
          if (err) {
            console.error(`Error adding column '${column}':`, err.message);
          } else {
            console.log(`✅ Column '${column}' added to '${table}' table.`);
          }
        });
      }
    });
  };

  ensureColumnExists('users', 'phoneNumber', 'TEXT');
  ensureColumnExists('users', 'guardianPhone', 'TEXT');
  ensureColumnExists('users', 'currentLocation', 'TEXT');
  ensureColumnExists('users', 'country', 'TEXT');

  // Teachers table
  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    subject TEXT NOT NULL,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Classes table
  db.run(`CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER,
    video_url TEXT,
    thumbnail TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    is_free BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
  )`);

  // Access codes table
  db.run(`CREATE TABLE IF NOT EXISTS access_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    class_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    is_used BOOLEAN DEFAULT 0,
    used_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
  )`);

  // User classes (enrolled classes)
  db.run(`CREATE TABLE IF NOT EXISTS user_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    class_id INTEGER,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    UNIQUE(user_id, class_id)
  )`);

  // Insert default admin user
  const adminPassword = bcrypt.hashSync('Admin12345!', 10);
  db.run(`INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
    ['admin@example.com', adminPassword, 'Administrator', 'admin']);

  // Insert sample classes
  // ... existing code ...
  // ... existing code ...
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

// Auth routes

// Token validation endpoint
app.get('/api/validate-token', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
        role: user.role
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, phoneNumber, guardianPhone, currentLocation, country } = req.body;

  // Log incoming registration data
  console.log('Register attempt:', { email, name, phoneNumber, guardianPhone, currentLocation, country });

  // Basic validation
  if (!email || !password || !name || !phoneNumber || !guardianPhone || !currentLocation || !country) {
    console.error('Validation error: Missing required fields');
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Basic phone validation (10-15 digits, can start with +)
  const phoneRegex = /^\+?\d{10,15}$/;
  if (!phoneRegex.test(phoneNumber)) {
    console.error('Validation error: Invalid phone number format', phoneNumber);
    return res.status(400).json({ error: 'Invalid phone number format.' });
  }
  if (!phoneRegex.test(guardianPhone)) {
    console.error('Validation error: Invalid guardian phone number format', guardianPhone);
    return res.status(400).json({ error: 'Invalid guardian phone number format.' });
  }

  // Only allow Arab countries
  const arabCountries = [
    'Egypt', 'Saudi Arabia', 'United Arab Emirates', 'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Kuwait', 'Bahrain', 'Qatar', 'Oman', 'Yemen', 'Palestine', 'Algeria', 'Morocco', 'Tunisia', 'Libya', 'Sudan', 'Mauritania', 'Comoros', 'Djibouti', 'Somalia'
  ];
  if (!arabCountries.includes(country)) {
    console.error('Validation error: Country not allowed', country);
    return res.status(400).json({ error: 'Selected country is not allowed.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (email, password, name, phoneNumber, guardianPhone, currentLocation, country, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [email, hashedPassword, name, phoneNumber, guardianPhone, currentLocation, country, 'student'],
    function (err) {
      if (err) {
        console.error('Database error:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        if (err.message.includes('NOT NULL constraint failed')) {
          return res.status(400).json({ error: 'A required field is missing: ' + err.message });
        }
        if (err.message.includes('datatype mismatch')) {
          return res.status(400).json({ error: 'Failed to insert field: datatype mismatch. ' + err.message });
        }
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }

      const token = jwt.sign(
        { id: this.lastID, email, role: 'student' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: this.lastID,
          email,
          name,
          phoneNumber,
          guardianPhone,
          currentLocation,
          country,
          role: 'student'
        }
      });
    }
  );
});

// Teachers routes
app.get('/api/teachers', (req, res) => {
  db.all(`SELECT * FROM teachers ORDER BY created_at DESC`, (err, teachers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(teachers);
  });
});

app.get('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM teachers WHERE id = ?`, [id], (err, teacher) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  });
});

app.post('/api/teachers', authenticateToken, upload.single('photo'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, bio, subject } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(`INSERT INTO teachers (name, bio, subject, photo) VALUES (?, ?, ?, ?)`,
    [name, bio, subject, photo], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, name, bio, subject, photo });
    });
});

// DELETE /api/teachers/:id - Delete a teacher
app.delete('/api/teachers/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { id } = req.params;
  db.run('DELETE FROM teachers WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Classes routes
app.get('/api/classes', (req, res) => {
  const { teacher_id } = req.query;
  let query = `SELECT c.*, t.name as teacher_name FROM classes c JOIN teachers t ON c.teacher_id = t.id`;
  let params = [];

  if (teacher_id) {
    query += ` WHERE c.teacher_id = ?`;
    params.push(teacher_id);
  }

  query += ` ORDER BY c.created_at DESC`;

  db.all(query, params, (err, classes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(classes);
  });
});

app.post('/api/classes', authenticateToken, upload.single('thumbnail'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { title, description, teacher_id, video_url, price } = req.body;
  const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;
  const is_free = parseFloat(price) === 0 ? 1 : 0;

  db.run(`INSERT INTO classes (title, description, teacher_id, video_url, thumbnail, price, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, teacher_id, video_url, thumbnail, price, is_free], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ 
        id: this.lastID, 
        title, 
        description, 
        teacher_id, 
        video_url, 
        thumbnail, 
        price, 
        is_free 
      });
    });
});

// DELETE /api/classes/:id - Delete a class
app.delete('/api/classes/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { id } = req.params;
  db.run('DELETE FROM classes WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Access codes routes
app.post('/api/access-codes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { class_id, price } = req.body;
  const code = uuidv4().substring(0, 8).toUpperCase();

  db.run(`INSERT INTO access_codes (code, class_id, price) VALUES (?, ?, ?)`,
    [code, class_id, price], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, code, class_id, price });
    });
});

app.get('/api/access-codes', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`SELECT ac.*, c.title as class_title, u.name as used_by_name 
          FROM access_codes ac 
          JOIN classes c ON ac.class_id = c.id 
          LEFT JOIN users u ON ac.used_by = u.id 
          ORDER BY ac.created_at DESC`, (err, codes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(codes);
  });
});

// Redeem access code - FIXED
app.post('/api/redeem-code', authenticateToken, (req, res) => {
  const { code } = req.body;
  const user_id = req.user.id;

  // Start a transaction-like approach
  db.serialize(() => {
    // First, check if the code exists and is unused
    db.get(`SELECT * FROM access_codes WHERE code = ? AND is_used = 0`, [code], (err, accessCode) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!accessCode) {
        return res.status(400).json({ error: 'Invalid or already used code' });
      }

      // Check if user already has access to this class
      db.get(`SELECT * FROM user_classes WHERE user_id = ? AND class_id = ?`, 
        [user_id, accessCode.class_id], (err, existingAccess) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingAccess) {
            return res.status(400).json({ error: 'You already have access to this class' });
          }

          // Mark code as used first
          db.run(`UPDATE access_codes SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [user_id, accessCode.id], function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error updating code' });
              }

              // Then enroll user in the class
              db.run(`INSERT INTO user_classes (user_id, class_id) VALUES (?, ?)`,
                [user_id, accessCode.class_id], function(err) {
                  if (err) {
                    // If enrollment fails, rollback the code usage
                    db.run(`UPDATE access_codes SET is_used = 0, used_by = NULL, used_at = NULL WHERE id = ?`,
                      [accessCode.id]);
                    return res.status(500).json({ error: 'Database error during enrollment' });
                  }

                  res.json({ 
                    success: true, 
                    message: 'Code redeemed successfully!',
                    class_id: accessCode.class_id
                  });
                });
            });
        });
    });
  });
});

// Enroll in free class - FIXED
app.post('/api/enroll-free', authenticateToken, (req, res) => {
  const { class_id } = req.body;
  const user_id = req.user.id;

  // Check if class is free
  db.get(`SELECT * FROM classes WHERE id = ? AND is_free = 1`, [class_id], (err, classInfo) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!classInfo) {
      return res.status(400).json({ error: 'Class not found or not free' });
    }

    // Check if already enrolled
    db.get(`SELECT * FROM user_classes WHERE user_id = ? AND class_id = ?`, 
      [user_id, class_id], (err, existingAccess) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingAccess) {
          return res.status(400).json({ error: 'Already enrolled in this class' });
        }

        db.run(`INSERT INTO user_classes (user_id, class_id) VALUES (?, ?)`,
          [user_id, class_id], function(err) {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
              success: true, 
              message: 'Enrolled successfully!',
              class_id: class_id
            });
          });
      });
  });
});

// Get user's enrolled classes
app.get('/api/my-classes', authenticateToken, (req, res) => {
  const user_id = req.user.id;

  db.all(`SELECT c.*, t.name as teacher_name, uc.enrolled_at 
          FROM user_classes uc 
          JOIN classes c ON uc.class_id = c.id 
          JOIN teachers t ON c.teacher_id = t.id 
          WHERE uc.user_id = ? 
          ORDER BY uc.enrolled_at DESC`, [user_id], (err, classes) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(classes);
  });
});

// Check if user has access to a class
app.get('/api/check-access/:class_id', authenticateToken, (req, res) => {
  const { class_id } = req.params;
  const user_id = req.user.id;

  db.get(`SELECT * FROM user_classes WHERE user_id = ? AND class_id = ?`, 
    [user_id, class_id], (err, access) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ hasAccess: !!access });
    });
});

// PUT /api/videos/:id - Update class (video) info
app.put('/api/videos/:id', authenticateToken, upload.single('thumbnail'), (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { title, description, video_url, price } = req.body;
  let thumbnail = req.file ? `/uploads/${req.file.filename}` : undefined;

  // Build update query dynamically
  let fields = [];
  let values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (video_url !== undefined) { fields.push('video_url = ?'); values.push(video_url); }
  if (price !== undefined) { fields.push('price = ?'); values.push(price); }
  if (thumbnail !== undefined) { fields.push('thumbnail = ?'); values.push(thumbnail); }
  // is_free logic
  if (price !== undefined) { fields.push('is_free = ?'); values.push(parseFloat(price) === 0 ? 1 : 0); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);
  const sql = `UPDATE classes SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    // Return updated class
    db.get('SELECT * FROM classes WHERE id = ?', [id], (err, updatedClass) => {
      if (err || !updatedClass) {
        return res.status(500).json({ error: 'Failed to fetch updated class' });
      }
      res.json(updatedClass);
    });
  });
});

// Statistics endpoints
app.get('/api/stats/students', (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ count: result.count });
  });
});

app.get('/api/stats/teachers', (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM teachers`, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ count: result.count });
  });
});

app.get('/api/stats/classes', (req, res) => {
  db.get(`SELECT COUNT(*) as count FROM classes`, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ count: result.count });
  });
});

// Admin student management endpoints
app.get('/api/admin/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  db.all(`SELECT id, name, email, phoneNumber, guardianPhone, currentLocation, country, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC`, (err, students) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(students);
  });
});

app.put('/api/admin/students/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { name, email, phoneNumber, guardianPhone, currentLocation, country } = req.body;

  // Basic validation
  if (!name || !email || !phoneNumber || !guardianPhone || !currentLocation || !country) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if email already exists for another user
  db.get(`SELECT id FROM users WHERE email = ? AND id != ?`, [email, id], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Update the user
    db.run(`UPDATE users SET name = ?, email = ?, phoneNumber = ?, guardianPhone = ?, currentLocation = ?, country = ? WHERE id = ? AND role = 'student'`,
      [name, email, phoneNumber, guardianPhone, currentLocation, country, id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true, message: 'Student updated successfully' });
      });
  });
});

app.delete('/api/admin/students/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;

  db.run(`DELETE FROM users WHERE id = ? AND role = 'student'`, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  });
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});