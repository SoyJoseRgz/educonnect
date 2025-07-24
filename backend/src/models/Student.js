const database = require('../database/connection');

class Student {
  constructor(data = {}) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.celular = data.celular;
    this.ciudad = data.ciudad;
    this.curso = data.curso;
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
    
    if (!this.curso || this.curso.trim() === '') {
      errors.push('El curso es requerido');
    } else {
      const validCourses = ['Sanación de las familias', 'Angelología'];
      if (!validCourses.includes(this.curso.trim())) {
        errors.push('El curso debe ser "Sanación de las familias" o "Angelología"');
      }
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

    const sql = `
      INSERT INTO students (nombre, apellido, celular, ciudad, curso, estadoPago, cantidadPago)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      this.nombre.trim(),
      this.apellido.trim(),
      this.celular,
      this.ciudad.trim(),
      this.curso.trim(),
      this.estadoPago,
      this.cantidadPago
    ];

    const result = await database.run(sql, params);
    this.id = result.id;
    
    // Fetch the created record to get timestamps
    const created = await Student.findById(this.id);
    Object.assign(this, created);
    
    return this;
  }

  async update() {
    if (!this.id) {
      throw new Error('Cannot update student without ID');
    }

    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sql = `
      UPDATE students 
      SET nombre = ?, apellido = ?, celular = ?, ciudad = ?, curso = ?, 
          estadoPago = ?, cantidadPago = ?, fechaActualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      this.nombre.trim(),
      this.apellido.trim(),
      this.celular,
      this.ciudad.trim(),
      this.curso.trim(),
      this.estadoPago,
      this.cantidadPago,
      this.id
    ];

    await database.run(sql, params);
    
    // Fetch updated record
    const updated = await Student.findById(this.id);
    Object.assign(this, updated);
    
    return this;
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete student without ID');
    }

    const sql = 'DELETE FROM students WHERE id = ?';
    await database.run(sql, [this.id]);
    return true;
  }

  // Static methods for querying
  static async findAll() {
    const sql = 'SELECT * FROM students ORDER BY fechaRegistro DESC';
    const rows = await database.all(sql);
    return rows.map(row => new Student(row));
  }

  static async findById(id) {
    const sql = 'SELECT * FROM students WHERE id = ?';
    const row = await database.get(sql, [id]);
    return row ? new Student(row) : null;
  }

  static async findPublic() {
    const sql = 'SELECT id, nombre, apellido, ciudad, celular, curso FROM students ORDER BY fechaRegistro DESC';
    const rows = await database.all(sql);
    return rows.map(row => ({
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      ciudad: row.ciudad,
      celular: row.celular,
      curso: row.curso
    }));
  }

  static async findByCourse(curso) {
    const sql = 'SELECT * FROM students WHERE curso = ? ORDER BY fechaRegistro DESC';
    const rows = await database.all(sql, [curso]);
    return rows.map(row => new Student(row));
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
      curso: this.curso,
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
      ciudad: this.ciudad
    };
  }
}

module.exports = Student;