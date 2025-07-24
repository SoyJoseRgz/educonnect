#!/usr/bin/env node

const dbInit = require('./init');

async function setupDatabase() {
  try {
    console.log('Setting up EduConnect database...');
    await dbInit.initialize();
    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;