// Deployment startup script to handle path resolution
const path = require('path');

// Set the correct working directory
process.chdir(__dirname);

// Now require the main server file
require('./server.js');
