// Deployment startup script
console.log('🚀 Starting AyurSetu Backend...');
console.log('Working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// Ensure we're in the correct directory
process.chdir(__dirname);

// Start the main server
require('./server.js');
