# PostgreSQL Migration Setup Guide

This project has been migrated from SQLite to PostgreSQL. Follow these steps to set up your PostgreSQL database.

## Prerequisites

1. **PostgreSQL Server**: Install PostgreSQL on your system
   - [Download PostgreSQL](https://www.postgresql.org/download/)
   - Or use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

2. **Node.js Dependencies**: The project now uses the `pg` library instead of `sqlite3`

## Database Setup

### 1. Create Database
```sql
CREATE DATABASE educational_platform;
```

### 2. Environment Configuration
Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/educational_platform

# JWT Secret (change this in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Environment
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

## Key Changes Made

### Database Connection
- **Before**: SQLite file-based database (`./database.db`)
- **After**: PostgreSQL connection pool using `DATABASE_URL` environment variable

### Schema Changes
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `DATETIME DEFAULT CURRENT_TIMESTAMP` → `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `BOOLEAN DEFAULT 1/0` → `BOOLEAN DEFAULT true/false`
- `INSERT OR IGNORE` → `INSERT ... ON CONFLICT ... DO NOTHING`

### Query Syntax
- **Before**: `?` placeholders (SQLite)
- **After**: `$1, $2, $3...` placeholders (PostgreSQL)

### Transaction Handling
- **Before**: `db.serialize()` with callback-based operations
- **After**: `async/await` with explicit `BEGIN`/`COMMIT`/`ROLLBACK`

## Database Schema

The following tables are automatically created on server startup:

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  phoneNumber TEXT,
  guardianPhone TEXT,
  currentLocation TEXT,
  country TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Teachers Table
```sql
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  subject TEXT NOT NULL,
  photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Classes Table
```sql
CREATE TABLE classes (
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
);
```

### Access Codes Table
```sql
CREATE TABLE access_codes (
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
);
```

### User Classes Table
```sql
CREATE TABLE user_classes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  class_id INTEGER,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  UNIQUE(user_id, class_id)
);
```

## Running the Application

1. **Set up environment variables** (see step 2 above)
2. **Start the server**:
   ```bash
   npm run dev:server
   ```
3. **Start the client** (in another terminal):
   ```bash
   npm run dev:client
   ```

## Default Admin User

The system automatically creates a default admin user:
- **Email**: `admin@example.com`
- **Password**: `Admin12345!`

## Migration Notes

- All existing API endpoints remain unchanged
- Authentication and authorization logic preserved
- File upload functionality maintained
- All business logic and validation rules preserved
- Error handling improved with PostgreSQL-specific error codes

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check your `DATABASE_URL` format
- Ensure the database exists: `psql -l` to list databases

### Permission Issues
- Ensure your PostgreSQL user has proper permissions
- For development, you can use the default `postgres` user

### SSL Issues (Production)
- The connection automatically handles SSL for production environments
- For local development, SSL is disabled by default 