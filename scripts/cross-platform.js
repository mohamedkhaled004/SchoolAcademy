#!/usr/bin/env node

/**
 * Cross-Platform Utilities
 * 
 * This script provides cross-platform alternatives to shell commands
 * that work on both Windows (PowerShell) and Unix systems (Bash, macOS)
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Detect operating system
const isWindows = process.platform === 'win32';
const isUnix = process.platform === 'linux' || process.platform === 'darwin';

console.log('🔧 Cross-Platform Utilities');
console.log('==========================');
console.log(`Platform: ${process.platform}`);
console.log(`Is Windows: ${isWindows}`);
console.log(`Is Unix: ${isUnix}`);

/**
 * Cross-platform file listing (replaces ls -la)
 */
export function listFiles(directory = '.', showHidden = true) {
  try {
    if (isWindows) {
      // Windows PowerShell equivalent
      const command = showHidden ? 'Get-ChildItem -Force' : 'Get-ChildItem';
      const result = execSync(command, { 
        cwd: directory, 
        encoding: 'utf8',
        shell: 'powershell.exe'
      });
      return result;
    } else {
      // Unix equivalent
      const flags = showHidden ? '-la' : '-l';
      const result = execSync(`ls ${flags}`, { 
        cwd: directory, 
        encoding: 'utf8' 
      });
      return result;
    }
  } catch (error) {
    console.error('Error listing files:', error.message);
    return '';
  }
}

/**
 * Cross-platform file existence check
 */
export function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * Cross-platform directory listing using Node.js fs
 */
export function listFilesNode(directory = '.', showHidden = false) {
  try {
    const files = readdirSync(directory);
    const fileList = [];
    
    for (const file of files) {
      if (!showHidden && file.startsWith('.')) continue;
      
      const fullPath = join(directory, file);
      const stats = statSync(fullPath);
      
      fileList.push({
        name: file,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        permissions: stats.mode.toString(8)
      });
    }
    
    return fileList;
  } catch (error) {
    console.error('Error listing files with Node.js:', error.message);
    return [];
  }
}

/**
 * Cross-platform environment variable check
 */
export function checkEnvironment() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    PORT: process.env.PORT || 'NOT SET'
  };
  
  console.log('Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  return envVars;
}

/**
 * Cross-platform database file check
 */
export function checkDatabaseFiles() {
  const dbFiles = [
    'database.db',
    'database.sqlite',
    'database.sqlite3'
  ];
  
  console.log('Database Files:');
  dbFiles.forEach(file => {
    const exists = fileExists(file);
    console.log(`  ${file}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
  });
  
  return dbFiles.filter(file => fileExists(file));
}

/**
 * Cross-platform process check
 */
export function checkProcess(processName) {
  try {
    if (isWindows) {
      const result = execSync(`Get-Process -Name "${processName}" -ErrorAction SilentlyContinue`, {
        encoding: 'utf8',
        shell: 'powershell.exe'
      });
      return result.trim().length > 0;
    } else {
      const result = execSync(`pgrep -f "${processName}"`, {
        encoding: 'utf8'
      });
      return result.trim().length > 0;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Cross-platform port check
 */
export function checkPort(port) {
  try {
    if (isWindows) {
      const result = execSync(`netstat -an | findstr :${port}`, {
        encoding: 'utf8',
        shell: 'cmd.exe'
      });
      return result.trim().length > 0;
    } else {
      const result = execSync(`lsof -i :${port}`, {
        encoding: 'utf8'
      });
      return result.trim().length > 0;
    }
  } catch (error) {
    return false;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      const directory = process.argv[3] || '.';
      const showHidden = process.argv.includes('--hidden');
      console.log('\n📁 File Listing:');
      console.log(listFiles(directory, showHidden));
      break;
      
    case 'env':
      console.log('\n🔧 Environment Check:');
      checkEnvironment();
      break;
      
    case 'db':
      console.log('\n🗄️ Database Files:');
      checkDatabaseFiles();
      break;
      
    case 'process':
      const processName = process.argv[3] || 'node';
      console.log(`\n🔍 Process Check (${processName}):`);
      console.log(`Running: ${checkProcess(processName)}`);
      break;
      
    case 'port':
      const port = process.argv[3] || '5000';
      console.log(`\n🔍 Port Check (${port}):`);
      console.log(`In use: ${checkPort(port)}`);
      break;
      
    default:
      console.log('\nUsage:');
      console.log('  node scripts/cross-platform.js list [directory] [--hidden]');
      console.log('  node scripts/cross-platform.js env');
      console.log('  node scripts/cross-platform.js db');
      console.log('  node scripts/cross-platform.js process [name]');
      console.log('  node scripts/cross-platform.js port [port]');
  }
} 