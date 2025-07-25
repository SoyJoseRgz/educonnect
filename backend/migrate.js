const DatabaseInitializer = require('./src/database/init');

async function migrate() {
  try {
    console.log('Starting database migration...');
    await DatabaseInitializer.initialize();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();