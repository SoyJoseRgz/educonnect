const Student = require('../Student');
const database = require('../../database/connection');
const dbInit = require('../../database/init');

// Mock database for testing
jest.mock('../../database/connection');

describe('Student Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Phone Number Validation', () => {
    test('should validate correct 10-digit phone number', () => {
      const result = Student.validatePhoneNumber('3001234567');
      expect(result.isValid).toBe(true);
      expect(result.cleanPhone).toBe('3001234567');
    });

    test('should validate phone number with formatting', () => {
      const result = Student.validatePhoneNumber('(300) 123-4567');
      expect(result.isValid).toBe(true);
      expect(result.cleanPhone).toBe('3001234567');
    });

    test('should reject phone number with less than 10 digits', () => {
      const result = Student.validatePhoneNumber('123456789');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('exactamente 10 dígitos');
    });

    test('should reject phone number with more than 10 digits', () => {
      const result = Student.validatePhoneNumber('30012345678');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('exactamente 10 dígitos');
    });

    test('should reject empty phone number', () => {
      const result = Student.validatePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('requerido');
    });

    test('should reject null phone number', () => {
      const result = Student.validatePhoneNumber(null);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('requerido');
    });
  });

  describe('Payment Status Validation', () => {
    test('should validate correct payment statuses', () => {
      expect(Student.validatePaymentStatus('pendiente').isValid).toBe(true);
      expect(Student.validatePaymentStatus('parcial').isValid).toBe(true);
      expect(Student.validatePaymentStatus('completo').isValid).toBe(true);
    });

    test('should reject invalid payment status', () => {
      const result = Student.validatePaymentStatus('invalid');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('pendiente, parcial o completo');
    });
  });

  describe('Payment Amount Validation', () => {
    test('should validate positive payment amounts', () => {
      expect(Student.validatePaymentAmount(0).isValid).toBe(true);
      expect(Student.validatePaymentAmount(100.50).isValid).toBe(true);
      expect(Student.validatePaymentAmount(1000).isValid).toBe(true);
    });

    test('should reject negative payment amounts', () => {
      const result = Student.validatePaymentAmount(-10);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('no puede ser negativa');
    });

    test('should reject non-numeric payment amounts', () => {
      const result = Student.validatePaymentAmount('invalid');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('número válido');
    });
  });

  describe('Student Validation', () => {
    test('should validate complete valid student data', () => {
      const student = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });

      const validation = student.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject student with missing required fields', () => {
      const student = new Student({
        nombre: '',
        apellido: '',
        celular: '',
        ciudad: '',
        curso: ''
      });

      const validation = student.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El nombre es requerido');
      expect(validation.errors).toContain('El apellido es requerido');
      expect(validation.errors).toContain('La ciudad es requerida');
      expect(validation.errors).toContain('El curso es requerido');
      expect(validation.errors).toContain('El número celular es requerido');
    });

    test('should reject student with invalid phone number', () => {
      const student = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '123',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });

      const validation = student.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('El número celular debe tener exactamente 10 dígitos');
    });

    test('should clean phone number during validation', () => {
      const student = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '(300) 123-4567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });

      const validation = student.validate();
      expect(validation.isValid).toBe(true);
      expect(student.celular).toBe('3001234567');
    });
  });

  describe('CRUD Operations', () => {
    test('should create student with valid data', async () => {
      const mockResult = { id: 1 };
      const mockStudent = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias',
        estadoPago: 'pendiente',
        cantidadPago: 0,
        fechaRegistro: '2024-01-01',
        fechaActualizacion: '2024-01-01'
      };

      database.run.mockResolvedValue(mockResult);
      database.get.mockResolvedValue(mockStudent);

      const student = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });

      const result = await student.create();
      
      expect(database.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO students'),
        ['Juan', 'Pérez', '3001234567', 'Bogotá', 'Sanación de las familias', 'pendiente', 0]
      );
      expect(result.id).toBe(1);
    });

    test('should reject creation with invalid data', async () => {
      const student = new Student({
        nombre: '',
        apellido: 'Pérez',
        celular: '123',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });

      await expect(student.create()).rejects.toThrow('Validation failed');
    });

    test('should find all students', async () => {
      const mockStudents = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', ciudad: 'Bogotá' },
        { id: 2, nombre: 'María', apellido: 'García', ciudad: 'Medellín' }
      ];

      database.all.mockResolvedValue(mockStudents);

      const students = await Student.findAll();
      
      expect(database.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM students ORDER BY fechaRegistro DESC')
      );
      expect(students).toHaveLength(2);
      expect(students[0]).toBeInstanceOf(Student);
    });

    test('should find public student data', async () => {
      const mockStudents = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez', ciudad: 'Bogotá' },
        { id: 2, nombre: 'María', apellido: 'García', ciudad: 'Medellín' }
      ];

      database.all.mockResolvedValue(mockStudents);

      const students = await Student.findPublic();
      
      expect(database.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, nombre, apellido, ciudad FROM students')
      );
      expect(students).toHaveLength(2);
      expect(students[0]).toEqual({
        id: 1,
        nombre: 'Juan Pérez',
        ciudad: 'Bogotá'
      });
    });
  });

  describe('JSON Methods', () => {
    test('should convert to full JSON', () => {
      const student = new Student({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias',
        estadoPago: 'pendiente',
        cantidadPago: 0
      });

      const json = student.toJSON();
      expect(json).toEqual({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias',
        estadoPago: 'pendiente',
        cantidadPago: 0,
        fechaRegistro: undefined,
        fechaActualizacion: undefined
      });
    });

    test('should convert to public JSON', () => {
      const student = new Student({
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        ciudad: 'Bogotá'
      });

      const json = student.toPublicJSON();
      expect(json).toEqual({
        id: 1,
        nombre: 'Juan Pérez',
        ciudad: 'Bogotá'
      });
    });
  });
});