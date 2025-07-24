const database = require('../database/connection');
const bcrypt = require('bcrypt');

class Admin {
  constructor(data = {}) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password; // This will be hashed
  }

  // Validation methods
  static validateEmail(email) {
    if (!email) {
      return { isValid: false, message: 'El email es requerido' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'El formato del email no es válido' };
    }

    return { isValid: true };
  }

  static validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'La contraseña es requerida' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    return { isValid: true };
  }

  validate() {
    const errors = [];

    // Email validation
    const emailValidation = Admin.validateEmail(this.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.message);
    }

    // Password validation (only for new admins or password changes)
    if (this.password && !this.id) {
      const passwordValidation = Admin.validatePassword(this.password);
      if (!passwordValidation.isValid) {
        errors.push(passwordValidation.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password hashing
  async hashPassword() {
    if (!this.password) {
      throw new Error('No password to hash');
    }
    
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return this.password;
  }

  async comparePassword(plainPassword) {
    if (!this.password) {
      throw new Error('No password hash to compare');
    }
    
    return await bcrypt.compare(plainPassword, this.password);
  }

  // CRUD Operations
  async create() {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if email already exists
    const existingAdmin = await Admin.findByEmail(this.email);
    if (existingAdmin) {
      throw new Error('Ya existe un administrador con este email');
    }

    // Hash password before saving
    await this.hashPassword();

    const sql = 'INSERT INTO admins (email, password) VALUES (?, ?)';
    const params = [this.email.toLowerCase().trim(), this.password];

    const result = await database.run(sql, params);
    this.id = result.id;
    
    return this;
  }

  async update() {
    if (!this.id) {
      throw new Error('Cannot update admin without ID');
    }

    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if email already exists for another admin
    const existingAdmin = await Admin.findByEmail(this.email);
    if (existingAdmin && existingAdmin.id !== this.id) {
      throw new Error('Ya existe un administrador con este email');
    }

    let sql, params;
    
    if (this.password) {
      // Update with new password
      await this.hashPassword();
      sql = 'UPDATE admins SET email = ?, password = ? WHERE id = ?';
      params = [this.email.toLowerCase().trim(), this.password, this.id];
    } else {
      // Update without changing password
      sql = 'UPDATE admins SET email = ? WHERE id = ?';
      params = [this.email.toLowerCase().trim(), this.id];
    }

    await database.run(sql, params);
    return this;
  }

  async delete() {
    if (!this.id) {
      throw new Error('Cannot delete admin without ID');
    }

    const sql = 'DELETE FROM admins WHERE id = ?';
    await database.run(sql, [this.id]);
    return true;
  }

  // Static methods for querying
  static async findAll() {
    const sql = 'SELECT id, email FROM admins ORDER BY email';
    const rows = await database.all(sql);
    return rows.map(row => new Admin(row));
  }

  static async findById(id) {
    const sql = 'SELECT * FROM admins WHERE id = ?';
    const row = await database.get(sql, [id]);
    return row ? new Admin(row) : null;
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM admins WHERE email = ?';
    const row = await database.get(sql, [email.toLowerCase().trim()]);
    return row ? new Admin(row) : null;
  }

  // Authentication methods
  static async authenticate(email, password) {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Return admin without password
    return {
      id: admin.id,
      email: admin.email
    };
  }

  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM admins';
    const result = await database.get(sql);
    return result.count;
  }

  // Helper methods
  toJSON() {
    return {
      id: this.id,
      email: this.email
      // Never include password in JSON output
    };
  }

  toSafeJSON() {
    return {
      id: this.id,
      email: this.email
    };
  }
}

module.exports = Admin;