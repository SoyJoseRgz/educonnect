const database = require('../database/connection');

class Student {
  constructor(data = {}) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.celular = data.celular;
    this.ciudad = data.ciudad;
    this.cursos = data.cursos || []; // Array of course names
    this.estadoPago = data.estadoPago || 'pendiente';
    this.cantidadPago = data.cantidadPago || 0;
    this.fechaRegistro = data.fechaRegistro;
    this.fechaActualizacion = data.fechaActualizacion;
  }

  // Validation methods
  static validatePhoneNumber(celular) {
    if (!celular) {
      return { isValid: false, message: 'El número celular es requerido' };
    }

    // Remove any non-digit characters for validation
    const cleanPhone = celular.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return { isValid: false, message: 'El número celular debe tener exactamente 10 dígitos' };
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      return { isValid: false, message: 'El número celular debe contener solo dígitos' };
    }

    return { isValid: true, cleanPhone };
  }

  static validatePaymentStatus(estadoPago) {
    const validStatuses = ['pendiente', 'parcial', 'completo'];
    if (!validStatuses.includes(estadoPago)) {
      return { isValid: false, message: 'Estado de pago debe ser: pendiente, parcial o completo' };
    }
    return { isValid: true };
  }

  static validatePaymentAmount(cantidadPago) {
    if (isNaN(cantidadPago)) {
      return { isValid: false, message: 'La cantidad de pago debe ser un número válido' };
    }
    if (cantidadPago < 0) {
      return { isValid: false, message: 'La cantidad de pago no puede ser negativa' };
    }
    if (cantidadPago > 10000000) {
      return { isValid: false, message: 'La cantidad de pago no puede exceder $10,000,000' };
    }
    return { isValid: true };
  }

  validate() {
    const errors = [];

    // Required fields validation with enhanced checks
    if (!this.nombre || this.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    } else {
      if (this.nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (this.nombre.trim().length > 50) {
        errors.push('El nombre no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.nombre.trim())) {
        errors.push('El nombre solo puede contener letras y espacios');
      }
    }
    
    if (!this.apellido || this.apellido.trim() === '') {
      errors.push('El apellido es requerido');
    } else {
      if (this.apellido.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
      }
      if (this.apellido.trim().length > 50) {
        errors.push('El apellido no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.apellido.trim())) {
        errors.push('El apellido solo puede contener letras y espacios');
      }
    }
    
    if (!this.ciudad || this.ciudad.trim() === '') {
      errors.push('La ciudad es requerida');
    } else {
      if (this.ciudad.trim().length < 2) {
        errors.push('La ciudad debe tener al menos 2 caracteres');
      }
      if (this.ciudad.trim().length > 50) {
        errors.push('La ciudad no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.ciudad.trim())) {
        errors.push('La ciudad solo puede contener letras y espacios');
      }
    }
    
    // Validate courses
    if (!this.cursos || !Array.isArray(this.cursos) || this.cursos.length === 0) {
      errors.push('Debe seleccionar al menos un curso');
    } else {
      const validCourses = ['Sanación de las familias', 'Angelología'];
      const invalidCourses = this.cursos.filter(curso => !validCourses.includes(curso.trim()));
      if (invalidCourses.length > 0) {
        errors.push(`Cursos inválidos: ${invalidCourses.join(', ')}`);
      }
      // Remove duplicates
      this.cursos = [...new Set(this.cursos.map(curso => curso.trim()))];
    }

    // Phone validation
    const phoneValidation = Student.validatePhoneNumber(this.celular);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.message);
    } else {
      this.celular = phoneValidation.cleanPhone;
    }

    // Payment status validation
    if (this.estadoPago) {
      const statusValidation = Student.validatePaymentStatus(this.estadoPago);
      if (!statusValidation.isValid) {
        errors.push(statusValidation.message);
      }
    }

    // Payment amount validation
    if (this.cantidadPago !== undefined && this.cantidadPago !== null) {
      const amountValidation = Student.validatePaymentAmount(this.cantidadPago);
      if (!amountValidation.isValid) {
        errors.push(amountValidation.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // CRUD Operations
  async create() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if student with this phone number already exists
    const existingStudent = await Student.findByCelular(this.celular);
    if (existingStudent) {
      throw new Error(`Ya existe un estudiante registrado con el número celular ${this.celular}. Cada estudiante debe tener un número único.`);
    }

    // Start transaction
    await database.run('BEGIN TRANSACTION');

    try {
      // Insert student basic info
      const sql = `
        INSERT INTO students (nombre, apellido, celular, ciudad, estadoPago, cantidadPago)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        this.nombre.trim(),
        this.apellido.trim(),
        this.celular,
        this.ciudad.trim(),
        this.estadoPago,
        this.cantidadPago
      ];

      const result = await database.run(sql, params);
      this.id = result.id;

      // Insert course relationships
      for (const curso of this.cursos) {
        await database.run(
          'INSERT INTO student_courses (student_id, course_name) VALUES (?, ?)',
          [this.id, curso.trim()]
        );
      }

      await database.run('COMMIT');
      
      // Fetch the created record to get timestamps and courses
      const created = await Student.findById(this.id);
      Object.assign(this, created);
      
      return this;
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  async update() {
    if (!this.id) {
      throw new Error('Cannot update student without ID');
    }

    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if another student with this phone number already exists (excluding current student)
    const existingStudent = await Student.findByCelular(this.celular);
    if (existingStudent && existingStudent.id !== this.id) {
      throw new Error(`Ya existe otro estudiante registrado con el número celular ${this.celular}. Cada estudiante debe tener un número único.`);
    }

    // Start transaction
    await database.run('BEGIN TRANSACTION');

    try {
      // Update student basic info
      const sql = `
        UPDATE students 
        SET nombre = ?, apellido = ?, celular = ?, ciudad = ?, 
            estadoPago = ?, cantidadPago = ?, fechaActualizacion = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const params = [
        this.nombre.trim(),
        this.apellido.trim(),
        this.celular,
        this.ciudad.trim(),
        this.estadoPago,
        this.cantidadPago,
        this.id
      ];

      await database.run(sql, params);

      // Update course relationships
      // First, remove existing course relationships
      await database.run('DELETE FROM student_courses WHERE student_id = ?', [this.id]);

      // Then, insert new course relationships
      for (const curso of this.cursos) {
        await database.run(
          'INSERT INTO student_courses (student_id, course_name) VALUES (?, ?)',
          [this.id, curso.trim()]
        );
      }

      await database.run('COMMIT');
      
      // Fetch updated record
      const updated = await Student.findById(this.id);
      Object.assign(this, updated);
      
      return this;
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete student without ID');
    }

    // Start transaction
    await database.run('BEGIN TRANSACTION');

    try {
      // Delete course relationships first (foreign key constraint)
      await database.run('DELETE FROM student_courses WHERE student_id = ?', [this.id]);
      
      // Delete student
      await database.run('DELETE FROM students WHERE id = ?', [this.id]);
      
      await database.run('COMMIT');
      return true;
    } catch (error) {
      await database.run('ROLLBACK');
      throw error;
    }
  }

  // Static methods for querying
  static async findAll() {
    const sql = 'SELECT * FROM students ORDER BY fechaRegistro DESC';
    const rows = await database.all(sql);
    
    // Get courses for each student
    const studentsWithCourses = [];
    for (const row of rows) {
      const courses = await database.all(
        'SELECT course_name FROM student_courses WHERE student_id = ?',
        [row.id]
      );
      const student = new Student({
        ...row,
        cursos: courses.map(c => c.course_name)
      });
      studentsWithCourses.push(student);
    }
    
    return studentsWithCourses;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM students WHERE id = ?';
    const row = await database.get(sql, [id]);
    
    if (!row) return null;
    
    // Get courses for this student
    const courses = await database.all(
      'SELECT course_name FROM student_courses WHERE student_id = ?',
      [id]
    );
    
    return new Student({
      ...row,
      cursos: courses.map(c => c.course_name)
    });
  }

  static async findPublic() {
    const sql = 'SELECT id, nombre, apellido, ciudad, celular FROM students ORDER BY fechaRegistro DESC';
    const rows = await database.all(sql);
    
    // Get courses for each student
    const studentsWithCourses = [];
    for (const row of rows) {
      const courses = await database.all(
        'SELECT course_name FROM student_courses WHERE student_id = ?',
        [row.id]
      );
      studentsWithCourses.push({
        id: row.id,
        nombre: row.nombre,
        apellido: row.apellido,
        ciudad: row.ciudad,
        celular: row.celular,
        cursos: courses.map(c => c.course_name)
      });
    }
    
    return studentsWithCourses;
  }

  static async findByCourse(curso) {
    const sql = `
      SELECT s.* FROM students s
      INNER JOIN student_courses sc ON s.id = sc.student_id
      WHERE sc.course_name = ?
      ORDER BY s.fechaRegistro DESC
    `;
    const rows = await database.all(sql, [curso]);
    
    // Get all courses for each student
    const studentsWithCourses = [];
    for (const row of rows) {
      const courses = await database.all(
        'SELECT course_name FROM student_courses WHERE student_id = ?',
        [row.id]
      );
      const student = new Student({
        ...row,
        cursos: courses.map(c => c.course_name)
      });
      studentsWithCourses.push(student);
    }
    
    return studentsWithCourses;
  }

  static async findByCelular(celular) {
    const sql = 'SELECT * FROM students WHERE celular = ?';
    const row = await database.get(sql, [celular]);
    
    if (!row) return null;
    
    // Get courses for this student
    const courses = await database.all(
      'SELECT course_name FROM student_courses WHERE student_id = ?',
      [row.id]
    );
    
    return new Student({
      ...row,
      cursos: courses.map(c => c.course_name)
    });
  }

  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM students';
    const result = await database.get(sql);
    return result.count;
  }

  // Helper methods
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      celular: this.celular,
      ciudad: this.ciudad,
      cursos: this.cursos,
      estadoPago: this.estadoPago,
      cantidadPago: this.cantidadPago,
      fechaRegistro: this.fechaRegistro,
      fechaActualizacion: this.fechaActualizacion
    };
  }

  toPublicJSON() {
    return {
      id: this.id,
      nombre: `${this.nombre} ${this.apellido}`,
      ciudad: this.ciudad,
      cursos: this.cursos
    };
  }
}

module.exports = Student;