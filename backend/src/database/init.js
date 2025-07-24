const database = require('./connection');
const bcrypt = require('bcrypt');

class DatabaseInitializer {
  
  async initialize() {
    try {
      await database.connect();
      await this.createTables();
      await this.seedInitialData();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async createTables() {
    // Create students table
    const createStudentsTable = `
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        celular TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        curso TEXT NOT NULL,
        estadoPago TEXT DEFAULT 'pendiente',
        cantidadPago REAL DEFAULT 0,
        fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
        fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create courses table
    const createCoursesTable = `
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        activo BOOLEAN DEFAULT true
      )
    `;

    // Create admins table
    const createAdminsTable = `
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `;

    await database.run(createStudentsTable);
    await database.run(createCoursesTable);
    await database.run(createAdminsTable);

    console.log('Database tables created successfully');
  }

  async seedInitialData() {
    // Check if courses already exist
    const existingCourses = await database.all('SELECT * FROM courses');
    
    if (existingCourses.length === 0) {
      // Insert predefined courses
      const courses = [
        'Sanación de las familias',
        'Angelología'
      ];

      for (const courseName of courses) {
        await database.run(
          'INSERT INTO courses (nombre) VALUES (?)',
          [courseName]
        );
      }
      console.log('Initial courses seeded');
    }

    // Check if admin already exists
    const existingAdmin = await database.get('SELECT * FROM admins WHERE email = ?', ['admin@educonnect.com']);
    
    if (!existingAdmin) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await database.run(
        'INSERT INTO admins (email, password) VALUES (?, ?)',
        ['admin@educonnect.com', hashedPassword]
      );
      console.log('Default admin user created: admin@educonnect.com / admin123');
    }
  }

  async dropTables() {
    await database.run('DROP TABLE IF EXISTS students');
    await database.run('DROP TABLE IF EXISTS courses');
    await database.run('DROP TABLE IF EXISTS admins');
    console.log('Database tables dropped');
  }

  async clearTables() {
    await database.run('DELETE FROM students');
    console.log('Students table cleared');
  }

  async reset() {
    await this.dropTables();
    await this.createTables();
    await this.seedInitialData();
    console.log('Database reset completed');
  }

  async close() {
    await database.close();
  }
}

module.exports = new DatabaseInitializer();