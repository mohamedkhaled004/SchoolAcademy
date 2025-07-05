#!/usr/bin/env node

/**
 * 404 Error Diagnostic Script for Teacher Addition
 * 
 * This script helps identify why the teacher addition endpoint is returning 404.
 * It checks various potential issues and provides detailed diagnostics.
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  // Test different possible API base URLs
  possibleBaseUrls: [
    'http://localhost:3001/api',
    'http://localhost:3000/api',
    'http://127.0.0.1:3001/api',
    'http://127.0.0.1:3000/api',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  adminCredentials: {
    email: 'admin@example.com',
    password: 'Admin12345!'
  },
  testTeacher: {
    name: 'Test Teacher',
    subject: 'Test Subject',
    bio: 'Test bio for debugging'
  }
};

// Utility functions
const log = (message, data = null) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
};

const error = (message, err = null) => {
  console.error(`❌ [${new Date().toISOString()}] ${message}`);
  if (err) {
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(`Status Text: ${err.response.statusText}`);
      console.error(`URL: ${err.response.config?.url}`);
      console.error(`Method: ${err.response.config?.method}`);
      console.error(`Headers:`, err.response.config?.headers);
      console.error(`Response Data:`, err.response.data);
    } else {
      console.error(err.message);
    }
  }
  console.log('');
};

const success = (message, data = null) => {
  console.log(`✅ [${new Date().toISOString()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('');
};

// Test functions
async function testServerConnection(baseUrl) {
  log(`🔍 Testing server connection to: ${baseUrl}`);
  
  try {
    const response = await axios.get(baseUrl.replace('/api', '/api/stats/teachers'), {
      timeout: 5000
    });
    
    success(`Server is reachable at: ${baseUrl}`, {
      status: response.status,
      data: response.data
    });
    
    return true;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      error(`Server not running or wrong port: ${baseUrl}`);
    } else if (err.response?.status === 404) {
      error(`Server running but endpoint not found: ${baseUrl}`);
    } else {
      error(`Connection error: ${baseUrl}`, err);
    }
    return false;
  }
}

async function testLogin(baseUrl) {
  log(`🔐 Testing login at: ${baseUrl}`);
  
  try {
    const response = await axios.post(`${baseUrl}/auth/login`, CONFIG.adminCredentials);
    
    success(`Login successful at: ${baseUrl}`, {
      user: response.data.user,
      tokenLength: response.data.token?.length
    });
    
    return response.data.token;
  } catch (err) {
    error(`Login failed at: ${baseUrl}`, err);
    return null;
  }
}

async function testTeachersEndpoint(baseUrl, token) {
  log(`👨‍🏫 Testing teachers GET endpoint at: ${baseUrl}/teachers`);
  
  try {
    const response = await axios.get(`${baseUrl}/teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    success(`Teachers GET endpoint working`, {
      count: response.data.length,
      isArray: Array.isArray(response.data)
    });
    
    return true;
  } catch (err) {
    error(`Teachers GET endpoint failed`, err);
    return false;
  }
}

async function testAddTeacher(baseUrl, token) {
  log(`➕ Testing add teacher POST endpoint at: ${baseUrl}/teachers`);
  
  try {
    const formData = new FormData();
    formData.append('name', CONFIG.testTeacher.name);
    formData.append('subject', CONFIG.testTeacher.subject);
    formData.append('bio', CONFIG.testTeacher.bio);
    
    const response = await axios.post(`${baseUrl}/teachers`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    success(`Add teacher POST endpoint working`, {
      teacher: response.data,
      id: response.data.id
    });
    
    return response.data.id;
  } catch (err) {
    error(`Add teacher POST endpoint failed`, err);
    return null;
  }
}

async function checkServerRoutes(baseUrl) {
  log(`🔍 Checking available routes at: ${baseUrl}`);
  
  const testEndpoints = [
    '/api/teachers',
    '/api/classes',
    '/api/admin/students',
    '/api/stats/teachers',
    '/api/auth/login',
    '/api/validate-token'
  ];
  
  const results = {};
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 3000,
        validateStatus: () => true // Don't throw on any status
      });
      
      results[endpoint] = {
        status: response.status,
        available: response.status !== 404,
        method: 'GET'
      };
    } catch (err) {
      results[endpoint] = {
        status: 'ERROR',
        available: false,
        error: err.message
      };
    }
  }
  
  log(`Route availability results:`, results);
  return results;
}

async function checkEnvironmentVariables() {
  log(`🔍 Checking environment variables...`);
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL
  };
  
  log(`Environment variables:`, envVars);
  return envVars;
}

async function checkServerProcess() {
  log(`🔍 Checking if server process is running...`);
  
  try {
    // Try to connect to common ports
    const ports = [3001, 3000, 5000, 8000];
    const results = {};
    
    for (const port of ports) {
      try {
        const response = await axios.get(`http://localhost:${port}/api/stats/teachers`, {
          timeout: 2000,
          validateStatus: () => true
        });
        
        results[port] = {
          running: true,
          status: response.status,
          hasApi: response.status !== 404
        };
      } catch (err) {
        results[port] = {
          running: false,
          error: err.code || err.message
        };
      }
    }
    
    log(`Server process check:`, results);
    return results;
  } catch (err) {
    error(`Error checking server process`, err);
    return null;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Starting 404 Error Diagnostics for Teacher Addition\n');
  
  // Step 1: Check environment variables
  const envVars = await checkEnvironmentVariables();
  
  // Step 2: Check server process
  const serverProcess = await checkServerProcess();
  
  // Step 3: Test different base URLs
  let workingBaseUrl = null;
  let authToken = null;
  
  for (const baseUrl of CONFIG.possibleBaseUrls) {
    log(`\n🔍 Testing base URL: ${baseUrl}`);
    
    // Test server connection
    const serverReachable = await testServerConnection(baseUrl);
    
    if (serverReachable) {
      // Test login
      const token = await testLogin(baseUrl);
      
      if (token) {
        workingBaseUrl = baseUrl;
        authToken = token;
        
        // Test teachers endpoint
        const teachersWorking = await testTeachersEndpoint(baseUrl, token);
        
        if (teachersWorking) {
          // Test add teacher
          const teacherId = await testAddTeacher(baseUrl, token);
          
          if (teacherId) {
            success(`🎉 Found working configuration!`, {
              baseUrl,
              teacherId
            });
            break;
          }
        }
      }
    }
  }
  
  // Step 4: If we found a working base URL, check all routes
  if (workingBaseUrl) {
    await checkServerRoutes(workingBaseUrl);
  }
  
  // Step 5: Summary and recommendations
  console.log('\n📊 Diagnostic Summary:');
  console.log('========================');
  
  if (workingBaseUrl) {
    console.log(`✅ Working base URL found: ${workingBaseUrl}`);
    console.log(`✅ Authentication working`);
    console.log(`✅ Teachers endpoints working`);
  } else {
    console.log(`❌ No working configuration found`);
    console.log(`\n🔧 Recommendations:`);
    console.log(`1. Check if server is running: npm run dev or node server/index.js`);
    console.log(`2. Verify server port (should be 3001)`);
    console.log(`3. Check if .env file exists with VITE_API_BASE_URL`);
    console.log(`4. Ensure server routes are properly configured`);
  }
  
  console.log(`\n🔍 Environment Variables:`, envVars);
  console.log(`🔍 Server Process:`, serverProcess);
  
  return {
    workingBaseUrl,
    authToken,
    envVars,
    serverProcess
  };
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics()
    .then(results => {
      if (results.workingBaseUrl) {
        console.log('\n🎉 Diagnostics completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Issues found. Check the recommendations above.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Diagnostic error:', err);
      process.exit(1);
    });
}

module.exports = { runDiagnostics };
