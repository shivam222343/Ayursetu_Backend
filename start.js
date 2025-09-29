// Deployment startup script to handle path resolution
const path = require('path');
const fs = require('fs');

console.log('=== DEPLOYMENT DEBUG INFO ===');
console.log('Initial working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('process.argv:', process.argv);

// Check if we're in the correct directory
const expectedFiles = ['server.js', 'package.json', 'src'];
const currentFiles = fs.readdirSync('.');
console.log('Current directory contents:', currentFiles);

// Verify we have the expected files
const hasExpectedFiles = expectedFiles.every(file => currentFiles.includes(file));
console.log('Has expected files:', hasExpectedFiles);

if (!hasExpectedFiles) {
  console.log('Not in correct directory, attempting to find server directory...');
  
  // Try to find the server directory
  if (currentFiles.includes('server')) {
    console.log('Found server directory, changing to it...');
    process.chdir(path.join(process.cwd(), 'server'));
    console.log('New working directory:', process.cwd());
  }
}

// Set the correct working directory to the server folder
process.chdir(__dirname);
console.log('Final working directory:', process.cwd());
console.log('=== END DEBUG INFO ===');

// Now require the main server file
require('./server.js');
