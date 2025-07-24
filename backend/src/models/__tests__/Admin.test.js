const Admin = require('../Admin');
const database = require('../../database/connection');
const bcrypt = require('bcrypt');

// Mock database and bcrypt for testing
jest.mock('../../database/connection');
jest.mock('bcrypt');

describe('Admin Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Validation', () => {
    test('should validate correct email format', () => {
      const result = Admin.validateEmail('admin@educonnect.com');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      invalidEmails.forEach(email => {
        const result = Admin.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('formato del email');
      });
    });

    test('should reject empty email', () => {
      const result = Admin.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('requerido');
    });
  });

  describe('Password Validation', () => {
    test('should validate password with minimum length', () => {
      const result = Admin.validatePassword('password123');
      expect(result.isValid).toBe(true);
    });

    test('should reject password shorter than 6 characters', () => {
      const result = Admin.validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('al menos 6 caracteres');
    });

    test('should reject empty password', () => {
      const result = Admin.validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('requerida');
    });
  });

  describe('Admin Validation', () => {
    test('should validate admin with valid data', () => {
      const admin = new Admin({
        email: 'admin@educonnect.com',
        password: 'password123'
      });

      const validation = admin.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject admin with invalid email and password', () => {
      const admin = new Admin({
        email: 'invalid-email',
        password: '123'
      });

      const validation = admin.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El formato del email no es válido');
      expect(validation.errors).toContain('La contraseña debe tener al menos 6 caracteres');
    });

    test('should not validate password for existing admin without password change', () => {
      const admin = new Admin({
        id: 1,
        email: 'admin@educonnect.com'
        // No password provided for existing admin
      });

      const validation = admin.validate();
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const hashedPassword = 'hashed_password_123';
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const admin = new Admin({
        email: 'admin@educonnect.com',
        password: 'plainpassword'
      });

      await admin.hashPassword();

      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(admin.password).toBe(hashedPassword);
    });

    test('should compare password correctly', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const admin = new Admin({
        email: 'admin@educonnect.com',
        password: 'hashed_password'
      });

      const result = await admin.comparePassword('plainpassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('plainpassword', 'hashed_password');
      expect(result).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    test('should create admin with valid data', async () => {
      const mockResult = { id: 1 };
      const hashedPassword = 'hashed_password_123';
      
      database.get.mockResolvedValue(null); // No existing admin
      database.run.mockResolvedValue(mockResult);
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const admin = new Admin({
        email: 'admin@educonnect.com',
        password: 'password123'
      });

      const result = await admin.create();
      
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(database.run).toHaveBeenCalledWith(
        'INSERT INTO admins (email, password) VALUES (?, ?)',
        ['admin@educonnect.com', hashedPassword]
      );
      expect(result.id).toBe(1);
    });

    test('should reject creation with existing email', async () => {
      const existingAdmin = { id: 1, email: 'admin@educonnect.com' };
      database.get.mockResolvedValue(existingAdmin);

      const admin = new Admin({
        email: 'admin@educonnect.com',
        password: 'password123'
      });

      await expect(admin.create()).rejects.toThrow('Ya existe un administrador con este email');
    });

    test('should authenticate admin with correct credentials', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@educonnect.com',
        password: 'hashed_password'
      };

      database.get.mockResolvedValue(mockAdmin);
      bcrypt.compare.mockResolvedValue(true);

      const result = await Admin.authenticate('admin@educonnect.com', 'password123');

      expect(result).toEqual({
        id: 1,
        email: 'admin@educonnect.com'
      });
    });

    test('should reject authentication with incorrect credentials', async () => {
      const mockAdmin = {
        id: 1,
        email: 'admin@educonnect.com',
        password: 'hashed_password'
      };

      database.get.mockResolvedValue(mockAdmin);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        Admin.authenticate('admin@educonnect.com', 'wrongpassword')
      ).rejects.toThrow('Credenciales inválidas');
    });

    test('should reject authentication with non-existent email', async () => {
      database.get.mockResolvedValue(null);

      await expect(
        Admin.authenticate('nonexistent@educonnect.com', 'password123')
      ).rejects.toThrow('Credenciales inválidas');
    });
  });

  describe('JSON Methods', () => {
    test('should convert to JSON without password', () => {
      const admin = new Admin({
        id: 1,
        email: 'admin@educonnect.com',
        password: 'hashed_password'
      });

      const json = admin.toJSON();
      expect(json).toEqual({
        id: 1,
        email: 'admin@educonnect.com'
      });
      expect(json.password).toBeUndefined();
    });

    test('should convert to safe JSON', () => {
      const admin = new Admin({
        id: 1,
        email: 'admin@educonnect.com',
        password: 'hashed_password'
      });

      const json = admin.toSafeJSON();
      expect(json).toEqual({
        id: 1,
        email: 'admin@educonnect.com'
      });
    });
  });
});