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

    // Create student_courses junction table for many-to-many relationship
    const createStudentCoursesTable = `
      CREATE TABLE IF NOT EXISTS student_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_name TEXT NOT NULL,
        fechaInscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
        UNIQUE(student_id, course_name)
      )
    `;

    await database.run(createStudentsTable);
    await database.run(createCoursesTable);
    await database.run(createAdminsTable);
    await database.run(createStudentCoursesTable);

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

    // Migrate existing student course data to new structure
    await this.migrateStudentCourses();

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

  async migrateStudentCourses() {
    try {
      // Check if the old curso column exists
      const tableInfo = await database.all("PRAGMA table_info(students)");
      const cursoColumnExists = tableInfo.some(column => column.name === 'curso');
      
      if (cursoColumnExists) {
        // Get all students with their courses
        const studentsWithCourses = await database.all('SELECT id, curso FROM students WHERE curso IS NOT NULL');
        
        // Insert into student_courses table
        for (const student of studentsWithCourses) {
          try {
            await database.run(
              'INSERT OR IGNORE INTO student_courses (student_id, course_name) VALUES (?, ?)',
              [student.id, student.curso]
            );
          } catch (error) {
            console.log(`Skipping duplicate course entry for student ${student.id}`);
          }
        }
        
        if (studentsWithCourses.length > 0) {
          console.log(`Migrated ${studentsWithCourses.length} student course relationships`);
        }
        
        // Remove the curso column from students table
        await database.run(`
          CREATE TABLE students_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            celular TEXT NOT NULL,
            ciudad TEXT NOT NULL,
            estadoPago TEXT DEFAULT 'pendiente',
            cantidadPago REAL DEFAULT 0,
            fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
            fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await database.run(`
          INSERT INTO students_new (id, nombre, apellido, celular, ciudad, estadoPago, cantidadPago, fechaRegistro, fechaActualizacion)
          SELECT id, nombre, apellido, celular, ciudad, estadoPago, cantidadPago, fechaRegistro, fechaActualizacion
          FROM students
        `);
        
        await database.run('DROP TABLE students');
        await database.run('ALTER TABLE students_new RENAME TO students');
        
        console.log('Successfully migrated to new student-course structure');
      }
    } catch (error) {
      console.log('Migration not needed or already completed:', error.message);
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