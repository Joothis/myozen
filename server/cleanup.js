// cleanup.js - Script to clean up duplicate server files

const fs = require('fs');
const path = require('path');

console.log('Starting cleanup process...');

// Files to be removed
const filesToRemove = [
  'src/auth-server.js'
];

// Check if files exist before removing
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`Removing duplicate file: ${file}`);
    
    try {
      // Create a backup first
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`Created backup at: ${backupPath}`);
      
      // Remove the file
      fs.unlinkSync(filePath);
      console.log(`Successfully removed: ${file}`);
    } catch (error) {
      console.error(`Error removing ${file}:`, error);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Cleanup process completed.');
