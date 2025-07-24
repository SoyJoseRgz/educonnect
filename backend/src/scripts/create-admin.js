#!/usr/bin/env node

const database = require('../database/connection');
const bcrypt = require('bcrypt');

async function createAdmin(email, password) {
  try {
    await database.connect();
    
    // Check if admin already exists
    const existingAdmin = await database.get('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (existingAdmin) {
      console.log(`❌ Admin with email ${email} already exists`);
      return false;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new admin
    await database.run(
      'INSERT INTO admins (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    console.log(`✅ Admin created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    return false;
  } finally {
    await database.close();
  }
}

async function listAdmins() {
  try {
    await database.connect();
    const admins = await database.all('SELECT id, email FROM admins');
    
    console.log('\n📋 Current admins:');
    console.log('==================');
    admins.forEach(admin => {
      console.log(`ID: ${admin.id} | Email: ${admin.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error listing admins:', error);
  } finally {
    await database.close();
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage:');
  console.log('  node create-admin.js <email> <password>  - Create new admin');
  console.log('  node create-admin.js --list              - List all admins');
  process.exit(1);
}

if (args[0] === '--list') {
  listAdmins();
} else if (args.length === 2) {
  const [email, password] = args;
  createAdmin(email, password);
} else {
  console.log('❌ Invalid arguments. Use: node create-admin.js <email> <password>');
  process.exit(1);
}