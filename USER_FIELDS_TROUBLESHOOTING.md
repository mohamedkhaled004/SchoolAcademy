# User Registration Fields Troubleshooting Guide

## Problem Description
User registration fields (`phoneNumber`, `guardianPhone`, `currentLocation`, `country`) are not being saved to the database, even though the frontend is sending the correct data.

## Root Cause Analysis

### 1. Database Schema Issues
The most common cause is that the database table was created before these columns were added to the schema.

**Check if columns exist:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

**Expected columns:**
- `id` (SERIAL PRIMARY KEY)
- `email` (TEXT UNIQUE NOT NULL)
- `password` (TEXT NOT NULL)
- `name` (TEXT NOT NULL)
- `role` (TEXT DEFAULT 'student')
- `phoneNumber` (TEXT)
- `guardianPhone` (TEXT)
- `currentLocation` (TEXT)
- `country` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 2. Database Initialization Issues
The database might not have been properly initialized with the latest schema.

**Solution:**
1. Stop the server
2. Delete the database file (if using SQLite) or drop the users table (if using PostgreSQL)
3. Restart the server to reinitialize the database

### 3. Backend Code Issues
The registration endpoint might not be properly handling all fields.

## Diagnostic Steps

### Step 1: Check Database Schema
Run the diagnostic script to check your current database schema:

```bash
node debug-user-fields.js
```

This will show you:
- Which columns exist in the users table
- Whether any required columns are missing
- The current state of existing users

### Step 2: Test Registration via API
Use the diagnostic script to test registration and verify data is saved:

```bash
node debug-user-fields.js
```

This will:
- Attempt to register a test user with all fields
- Verify the data is saved correctly in the database
- Show detailed error messages if something fails

### Step 3: Check Backend Logs
When registering a user, check the backend console for:

```
🔧 Registration attempt received:
  Email: test@example.com
  Name: Test User
  Phone Number: +1234567890
  Guardian Phone: +1234567891
  Current Location: Test City
  Country: Egypt
  Password length: 15
✅ Password hashed successfully
📦 Inserting user data: { email: 'test@example.com', password: '[HIDDEN]', ... }
✅ User created successfully:
  ID: 1
  Email: test@example.com
  Name: Test User
  Phone: +1234567890
  Guardian Phone: +1234567891
  Location: Test City
  Country: Egypt
  Role: student
  Created: 2024-01-01T12:00:00.000Z
✅ JWT token generated successfully
✅ Registration completed successfully for: test@example.com
```

## Solutions

### Solution 1: Reinitialize Database (Recommended)
If columns are missing, reinitialize the database:

1. **Stop the server**
2. **Backup existing data** (if needed)
3. **Delete the database file:**
   ```bash
   rm database.db  # If using SQLite
   ```
   
   **Or drop the users table (PostgreSQL):**
   ```sql
   DROP TABLE IF EXISTS users CASCADE;
   ```
4. **Restart the server** - it will automatically create the table with all required columns

### Solution 2: Add Missing Columns Manually
If you can't reinitialize the database, add missing columns manually:

```sql
-- Add missing columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "guardianPhone" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "currentLocation" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "country" TEXT;
```

### Solution 3: Check Environment Variables
Ensure your `.env` file has the correct database configuration:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# or for SQLite
DATABASE_URL=sqlite:./database.db
```

## Verification Steps

### 1. Test Registration
After implementing the solution, test registration with a new user and verify:

- All fields are logged in the backend console
- No validation errors occur
- User is created successfully with all fields
- Response includes all user data

### 2. Check Database
Verify the user was saved with all fields:

```sql
SELECT id, email, name, phoneNumber, guardianPhone, currentLocation, country, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 1;
```

### 3. Test Login
Test login to ensure all fields are returned:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

Expected response should include all user fields:
```json
{
  "token": "...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "phoneNumber": "+1234567890",
    "guardianPhone": "+1234567891",
    "currentLocation": "Test City",
    "country": "Egypt",
    "role": "student"
  }
}
```

## Common Error Messages

### "Column does not exist"
**Error:** `column "phoneNumber" does not exist`
**Solution:** Add missing columns or reinitialize database

### "Table does not exist"
**Error:** `relation "users" does not exist`
**Solution:** Restart server to initialize database

### "Unique constraint violation"
**Error:** `duplicate key value violates unique constraint "users_email_key"`
**Solution:** Use a different email address for testing

### "Not null violation"
**Error:** `null value in column "email" violates not-null constraint`
**Solution:** Check that all required fields are being sent from frontend

## Prevention

### 1. Database Migrations
Consider implementing proper database migrations for future schema changes.

### 2. Environment Validation
Add startup validation to ensure database schema is correct:

```javascript
// Add to server startup
const validateDatabaseSchema = async () => {
  const requiredColumns = ['id', 'email', 'password', 'name', 'role', 'phoneNumber', 'guardianPhone', 'currentLocation', 'country', 'created_at'];
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  const existingColumns = result.rows.map(row => row.column_name);
  const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
  
  if (missingColumns.length > 0) {
    console.error('❌ Missing database columns:', missingColumns);
    process.exit(1);
  }
};
```

### 3. Comprehensive Testing
Always test registration with all fields after making changes to the database schema.

## Support

If you're still experiencing issues after following this guide:

1. Run the diagnostic script and share the output
2. Check the backend console logs during registration
3. Verify your database connection and permissions
4. Ensure all environment variables are set correctly

The enhanced logging in the registration endpoint will help identify exactly where the issue occurs. 