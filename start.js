// Deployment startup script to handle path resolution
const path = require('path');

// Set the correct working directory to the server folder
process.chdir(__dirname);

// Log current working directory for debugging
console.log('Current working directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));

// Now require the main server file
require('./server.js');
