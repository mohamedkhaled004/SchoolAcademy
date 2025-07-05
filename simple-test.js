console.log('🚀 Simple test starting...');

// Test basic functionality
console.log('✅ Basic console.log works');

// Test environment variables
console.log('Environment check:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  Current directory:', process.cwd());

// Test async function
async function testAsync() {
  console.log('✅ Async function works');
  return 'success';
}

testAsync().then(result => {
  console.log('✅ Promise resolved:', result);
  console.log('🏁 Test completed successfully!');
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 