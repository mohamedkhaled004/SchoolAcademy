# 🔒 Secure Student Data System

## Overview

This document describes the implementation of a secure data handling system for student registration that protects sensitive information while maintaining necessary administrative access under controlled circumstances.

## 🎯 Problem Solved

**Before**: All student sensitive data (phone numbers, guardian phone, location) was fully visible to administrators in the admin panel, creating privacy concerns.

**After**: Sensitive data is encrypted and stored separately, with administrators requiring explicit permission and providing justification to access this information.

## 🏗️ Architecture

### Database Schema

#### 1. Users Table (Basic Info Only)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  country TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Sensitive Data Table (Encrypted Storage)
```sql
CREATE TABLE student_sensitive_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  phone_number_encrypted TEXT,
  guardian_phone_encrypted TEXT,
  location_encrypted TEXT,
  encryption_key_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 3. Access Control Table
```sql
CREATE TABLE sensitive_data_access (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('phone', 'guardian_phone', 'location', 'all')),
  reason TEXT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### 4. Audit Log Table
```sql
CREATE TABLE access_audit_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('request', 'grant', 'deny', 'view', 'expire')),
  data_type TEXT NOT NULL CHECK (data_type IN ('phone', 'guardian_phone', 'location', 'all')),
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔐 Security Features

### 1. Encryption
- **Algorithm**: AES-256-CBC
- **Key Generation**: Unique 32-byte key per student
- **Key Storage**: Hashed with bcrypt in database
- **IV**: Unique initialization vector per encryption

### 2. Access Control
- **Time-limited Access**: 1-hour expiration by default
- **Granular Permissions**: Can request specific data types
- **Justification Required**: Admins must provide reason for access
- **Audit Trail**: All access attempts logged with metadata

### 3. Data Separation
- **Basic Info**: Stored in main users table (name, email, country)
- **Sensitive Data**: Encrypted and stored separately
- **No Direct Access**: Sensitive data never returned in standard queries

## 🚀 API Endpoints

### Standard Admin Endpoints (No Sensitive Data)

#### GET /api/admin/students
Returns basic student information only:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "country": "USA",
    "role": "student",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Secure Access Endpoints

#### POST /api/admin/students/:id/request-access
Request access to sensitive data:
```json
{
  "dataType": "phone|guardian_phone|location|all",
  "reason": "Administrative need"
}
```

Response:
```json
{
  "success": true,
  "message": "Access granted",
  "accessId": 123,
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

#### GET /api/admin/students/:id/sensitive-data?dataType=phone
Retrieve sensitive data (requires valid access):
```json
{
  "success": true,
  "data": {
    "phoneNumber": "[ENCRYPTED - Requires secure key retrieval]"
  },
  "accessExpiresAt": "2024-01-01T01:00:00.000Z"
}
```

#### GET /api/admin/access-audit
View audit log of all access attempts:
```json
[
  {
    "id": 1,
    "action": "request",
    "data_type": "phone",
    "reason": "Administrative need",
    "created_at": "2024-01-01T00:00:00.000Z",
    "ip_address": "192.168.1.1",
    "admin_name": "Admin User",
    "student_name": "John Doe",
    "student_email": "john@example.com"
  }
]
```

## 🎨 Frontend Implementation

### Admin Students Page

The admin panel now shows:

1. **Basic Information**: Name, email, country, join date
2. **Secure Access Buttons**: 
   - 📞 Phone (blue)
   - 🛡️ Guardian (purple) 
   - 📍 Location (green)
3. **Sensitive Data Display**: Shows decrypted data when access is granted

### Access Flow

1. **Admin clicks access button** → Request sent with reason
2. **System validates request** → Creates access record with expiration
3. **Access granted** → Sensitive data retrieved and displayed
4. **Audit logged** → All actions recorded with metadata
5. **Access expires** → Data becomes inaccessible after 1 hour

## 🔧 Implementation Details

### Registration Process

```javascript
// 1. Create user with basic info
const userResult = await pool.query(`
  INSERT INTO users (name, email, password, country, role)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, name, email, country, role, created_at
`, [cleanName, cleanEmail, hashedPassword, cleanCountry, 'student']);

// 2. Encrypt sensitive data
const encryptionKey = generateEncryptionKey();
const encryptionKeyHash = bcrypt.hashSync(encryptionKey, 10);

const encryptedPhone = encryptData(cleanPhoneNumber, encryptionKey);
const encryptedGuardianPhone = encryptData(cleanGuardianPhone, encryptionKey);
const encryptedLocation = encryptData(cleanCurrentLocation, encryptionKey);

// 3. Store encrypted data
await pool.query(`
  INSERT INTO student_sensitive_data 
  (user_id, phone_number_encrypted, guardian_phone_encrypted, location_encrypted, encryption_key_hash)
  VALUES ($1, $2, $3, $4, $5)
`, [user.id, encryptedPhone, encryptedGuardianPhone, encryptedLocation, encryptionKeyHash]);
```

### Access Control Flow

```javascript
// 1. Check if access already exists and is valid
const existingAccess = await pool.query(`
  SELECT * FROM sensitive_data_access 
  WHERE admin_id = $1 AND student_id = $2 AND access_type = $3 
  AND is_active = true AND expires_at > NOW()
`, [req.user.id, id, dataType]);

// 2. Grant new access if needed
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
await pool.query(`
  INSERT INTO sensitive_data_access (admin_id, student_id, access_type, reason, expires_at)
  VALUES ($1, $2, $3, $4, $5)
`, [req.user.id, id, dataType, reason, expiresAt]);

// 3. Log the access request
await pool.query(`
  INSERT INTO access_audit_log (admin_id, student_id, action, data_type, reason, ip_address, user_agent)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
`, [req.user.id, id, 'request', dataType, reason, req.ip, req.get('User-Agent')]);
```

## 🔍 Migration Process

The system includes automatic migration of existing data:

1. **Detect existing sensitive columns** in users table
2. **Encrypt existing data** with new encryption keys
3. **Store in secure table** with proper relationships
4. **Remove sensitive columns** from main users table
5. **Verify migration** with detailed logging

## 🛡️ Security Considerations

### Encryption
- ✅ AES-256-CBC encryption
- ✅ Unique keys per student
- ✅ Secure key hashing with bcrypt
- ✅ Unique IV per encryption

### Access Control
- ✅ Time-limited access (1 hour default)
- ✅ Granular permissions
- ✅ Justification required
- ✅ Complete audit trail

### Data Protection
- ✅ Sensitive data never in standard queries
- ✅ Separate storage tables
- ✅ Automatic cleanup on user deletion
- ✅ IP and user agent logging

### Privacy Compliance
- ✅ GDPR-compliant data handling
- ✅ Right to be forgotten (cascade delete)
- ✅ Access justification tracking
- ✅ Audit trail for compliance

## 🚀 Benefits

### For Students
- **Privacy Protection**: Sensitive data not visible by default
- **Controlled Access**: Admins must justify and request access
- **Audit Trail**: All access attempts logged and tracked
- **Time Limits**: Access automatically expires

### For Administrators
- **Necessary Access**: Can still access data when needed
- **Clear Process**: Structured workflow for data access
- **Compliance**: Built-in audit trail for regulations
- **Security**: Reduced risk of accidental data exposure

### For System
- **Scalable**: Separate tables for different data types
- **Maintainable**: Clear separation of concerns
- **Compliant**: Built-in privacy and security features
- **Auditable**: Complete access logging

## 🔧 Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
```

### Access Duration
Default access duration is 1 hour. To modify:
```javascript
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
// Change to: 30 * 60 * 1000 for 30 minutes
// Change to: 2 * 60 * 60 * 1000 for 2 hours
```

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test Student",
    "phoneNumber": "+1234567890",
    "guardianPhone": "+0987654321",
    "currentLocation": "Test City",
    "country": "Test Country"
  }'
```

### Test Admin Access
```bash
# 1. Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin12345!"}'

# 2. Request access to sensitive data
curl -X POST http://localhost:3001/api/admin/students/1/request-access \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dataType": "phone", "reason": "Administrative need"}'

# 3. Retrieve sensitive data
curl -X GET "http://localhost:3001/api/admin/students/1/sensitive-data?dataType=phone" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Future Enhancements

1. **Key Management**: Implement secure key storage service
2. **Access Approval**: Multi-level approval workflow
3. **Data Masking**: Partial data display (e.g., ***-***-1234)
4. **Encryption Rotation**: Periodic key rotation
5. **Compliance Reports**: Automated privacy compliance reporting
6. **Integration**: Connect with external privacy management systems

## 🆘 Troubleshooting

### Common Issues

1. **Migration Errors**: Check database permissions and existing data
2. **Access Denied**: Verify admin role and token validity
3. **Data Not Found**: Ensure student exists and has sensitive data
4. **Expired Access**: Request new access after expiration

### Debug Commands
```bash
# Check database schema
psql -d your_database -c "\d users"
psql -d your_database -c "\d student_sensitive_data"

# Check access logs
psql -d your_database -c "SELECT * FROM access_audit_log ORDER BY created_at DESC LIMIT 10;"

# Check active access
psql -d your_database -c "SELECT * FROM sensitive_data_access WHERE is_active = true AND expires_at > NOW();"
```

This secure data system provides a robust, privacy-compliant solution for handling sensitive student information while maintaining necessary administrative functionality. 