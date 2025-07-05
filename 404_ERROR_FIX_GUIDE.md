# 🔧 404 Error Fix Guide: Teacher Addition

This guide provides step-by-step solutions for the "Failed to add teacher: Request failed with status code 404" error.

## 🚨 **Problem Analysis**

### **Root Cause**
The 404 error occurs when the frontend tries to reach an API endpoint that doesn't exist or isn't accessible. This can happen due to:

1. **Incorrect API Base URL**: The `VITE_API_BASE_URL` environment variable is wrong
2. **Server Not Running**: The backend server isn't started or is on a different port
3. **Route Mismatch**: The frontend and backend routes don't match
4. **Port Conflicts**: Another service is using the expected port
5. **Environment Configuration**: Missing or incorrect environment variables

## 🔍 **Step-by-Step Diagnosis**

### **Step 1: Check Server Status**

First, verify your server is running:

```bash
# Check if server is running on port 3001
curl http://localhost:3001/api/stats/teachers

# Expected response: {"count": 0} or similar
# If you get "Connection refused", server is not running
```

### **Step 2: Check Environment Variables**

Create or verify your `.env` file in the project root:

```bash
# Create .env file if it doesn't exist
echo "VITE_API_BASE_URL=http://localhost:3001/api" > .env
echo "DATABASE_URL=your_postgresql_connection_string" >> .env
echo "JWT_SECRET=your_jwt_secret" >> .env
```

### **Step 3: Run Diagnostic Script**

Use the diagnostic script to identify the issue:

```bash
# Install axios if not already installed
npm install axios

# Run the diagnostic script
node debug-404-issue.js
```

This script will:
- Test different possible API base URLs
- Check server connectivity
- Verify authentication
- Test the teachers endpoint
- Provide detailed error information

### **Step 4: Check Browser Console**

Open browser DevTools (F12) and check:

1. **Network Tab**: Look for the failed request
2. **Console Tab**: Check for error messages
3. **Application Tab**: Verify localStorage has correct token

## 🛠️ **Common Solutions**

### **Solution 1: Fix API Base URL**

**Problem**: `VITE_API_BASE_URL` is incorrect or missing

**Fix**:
```bash
# Create .env file in project root
VITE_API_BASE_URL=http://localhost:3001/api
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your-secret-key
```

**Verify in code**:
```javascript
// In AdminDashboard.tsx, check this line:
const API_BASE = import.meta.env.VITE_API_BASE_URL;
console.log('API_BASE:', API_BASE); // Should show: http://localhost:3001/api
```

### **Solution 2: Start the Server**

**Problem**: Server is not running

**Fix**:
```bash
# Navigate to project directory
cd project

# Start the server
npm run dev
# OR
node server/index.js

# Check server output for:
# "Server running on port 3001"
```

### **Solution 3: Check Port Conflicts**

**Problem**: Port 3001 is already in use

**Fix**:
```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill the process if needed
taskkill /PID <process_id> /F

# Or change server port in server/index.js
const PORT = 3002; // Change to different port
```

### **Solution 4: Verify Route Configuration**

**Problem**: Backend route doesn't match frontend expectation

**Check server routes**:
```javascript
// In server/index.js, verify this route exists:
app.post('/api/teachers', authenticateToken, upload.single('photo'), async (req, res) => {
  // ... route implementation
});
```

**Check frontend request**:
```javascript
// In AdminDashboard.tsx, verify this URL:
const response = await axios.post(`${API_BASE}/teachers`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

## 🔧 **Enhanced Error Handling**

### **Frontend Improvements**

Add better error handling to catch 404 errors specifically:

```javascript
const handleAddTeacher = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  // Enhanced validation
  if (!teacherForm.name.trim()) {
    setError('Teacher name is required');
    return;
  }
  if (!teacherForm.subject.trim()) {
    setError('Subject is required');
    return;
  }

  const formData = new FormData();
  formData.append('name', teacherForm.name.trim());
  formData.append('bio', teacherForm.bio.trim());
  formData.append('subject', teacherForm.subject.trim());
  if (teacherForm.photo) {
    formData.append('photo', teacherForm.photo);
  }

  try {
    // Log the request details for debugging
    console.log('Making request to:', `${API_BASE}/teachers`);
    console.log('Request data:', {
      name: teacherForm.name,
      subject: teacherForm.subject,
      hasPhoto: !!teacherForm.photo
    });

    const response = await axios.post(`${API_BASE}/teachers`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('Teacher added successfully:', response.data);
    showSnackbar('Teacher added successfully! Welcome aboard!');
    setTeacherForm({ name: '', bio: '', subject: '', photo: null });
    fetchData();
  } catch (error: any) {
    console.error('Add teacher error:', error);
    
    // Enhanced error handling for 404
    if (error.response?.status === 404) {
      setError(`API endpoint not found. Please check server configuration. URL: ${error.config?.url}`);
    } else if (error.response?.status === 403) {
      setError('Admin access required. Please log in as admin.');
    } else if (error.response?.status === 400) {
      setError(error.response.data?.error || 'Invalid data provided');
    } else if (error.code === 'NETWORK_ERROR') {
      setError('Network error. Please check your connection and ensure server is running.');
    } else if (error.code === 'ECONNREFUSED') {
      setError('Cannot connect to server. Please ensure server is running on port 3001.');
    } else {
      setError(`Failed to add teacher: ${error.message || 'Unknown error'}`);
    }
  }
};
```

### **Backend Improvements**

Add route logging to help debug:

```javascript
// In server/index.js, add this before your routes:
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Add a catch-all route for debugging
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
      'GET /api/admin/students'
    ]
  });
});
```

## 🧪 **Testing the Fix**

### **Test 1: Basic Connectivity**
```bash
# Test server is running
curl http://localhost:3001/api/stats/teachers
```

### **Test 2: Authentication**
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin12345!"}'
```

### **Test 3: Teachers Endpoint**
```bash
# Test GET teachers (replace TOKEN with actual token)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/teachers
```

### **Test 4: Add Teacher**
```bash
# Test POST teachers (replace TOKEN with actual token)
curl -X POST http://localhost:3001/api/teachers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Test Teacher" \
  -F "subject=Test Subject" \
  -F "bio=Test bio"
```

## 📋 **Troubleshooting Checklist**

- [ ] Server is running on port 3001
- [ ] `.env` file exists with correct `VITE_API_BASE_URL`
- [ ] No port conflicts (3001 is available)
- [ ] Backend routes are properly configured
- [ ] Frontend is using correct API base URL
- [ ] Authentication token is valid
- [ ] Network connectivity is working
- [ ] CORS is properly configured

## 🚀 **Quick Recovery Steps**

If the issue persists:

1. **Restart Everything**:
   ```bash
   # Stop all processes
   # Restart server
   npm run dev
   # Restart frontend
   npm run dev
   ```

2. **Clear Browser Cache**:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   // Refresh and re-login
   ```

3. **Check Server Logs**:
   ```bash
   # Look for route logging
   # Check for database connection errors
   # Verify authentication middleware
   ```

4. **Verify Environment**:
   ```bash
   # Check if .env file is loaded
   # Verify DATABASE_URL is correct
   # Ensure JWT_SECRET is set
   ```

## 🎯 **Prevention Best Practices**

1. **Always use environment variables** for API URLs
2. **Add comprehensive logging** to both frontend and backend
3. **Implement proper error handling** with specific error messages
4. **Use diagnostic scripts** to verify configuration
5. **Test endpoints independently** before integration
6. **Monitor server logs** for route access patterns

The 404 error should now be resolved with proper configuration and enhanced error handling! 🎉 