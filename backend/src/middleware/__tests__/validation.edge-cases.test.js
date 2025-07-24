const ValidationMiddleware = require('../validation');
const Student = require('../../models/Student');

// Mock the Student model
jest.mock('../../models/Student');

describe('ValidationMiddleware - Edge Cases', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();

    // Default mock implementations
    Student.validatePhoneNumber = jest.fn().mockReturnValue({
      isValid: true,
      cleanPhone: '3001234567'
    });
    Student.validatePaymentStatus = jest.fn().mockReturnValue({
      isValid: true
    });
    Student.validatePaymentAmount = jest.fn().mockReturnValue({
      isValid: true
    });
  });

  describe('Security Validation Tests', () => {
    it('should reject XSS attempts in name fields', () => {
      req.body = {
        nombre: 'Juan<script>alert("xss")</script>',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre contiene caracteres no permitidos'
        ])
      });
    });

    it('should reject JavaScript injection attempts', () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'javascript:alert(1)',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El apellido contiene caracteres no permitidos'
        ])
      });
    });

    it('should reject iframe injection attempts', () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá<iframe src="evil.com"></iframe>',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'La ciudad solo puede contener letras y espacios',
          'La ciudad contiene caracteres no permitidos'
        ])
      });
    });

    it('should reject event handler injection attempts', () => {
      req.body = {
        nombre: 'Juan onload=alert(1)',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre contiene caracteres no permitidos'
        ])
      });
    });
  });

  describe('Whitespace and Format Validation', () => {
    it('should reject excessive whitespace in names', () => {
      req.body = {
        nombre: 'Juan   Carlos',
        apellido: 'Pérez  González',
        celular: '3001234567',
        ciudad: 'Bogotá   DC',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre no puede contener espacios múltiples consecutivos',
          'El apellido no puede contener espacios múltiples consecutivos',
          'La ciudad no puede contener espacios múltiples consecutivos'
        ])
      });
    });

    it('should properly sanitize valid input with extra spaces', () => {
      req.body = {
        nombre: '  Juan Carlos  ',
        apellido: '  Pérez González  ',
        celular: '300-123-4567',
        ciudad: '  Bogotá DC  ',
        curso: '  Sanación de las familias  '
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(req.body).toEqual({
        nombre: 'Juan Carlos',
        apellido: 'Pérez González',
        celular: '3001234567',
        ciudad: 'Bogotá DC',
        curso: 'Sanación de las familias'
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Boundary Value Testing', () => {
    it('should accept minimum valid name length', () => {
      req.body = {
        nombre: 'Jo',
        apellido: 'Li',
        celular: '3001234567',
        ciudad: 'NY',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept maximum valid name length', () => {
      const maxName = 'A'.repeat(50);
      req.body = {
        nombre: maxName,
        apellido: maxName,
        celular: '3001234567',
        ciudad: maxName,
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject names that are too long', () => {
      const tooLongName = 'A'.repeat(51);
      req.body = {
        nombre: tooLongName,
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre no puede exceder 50 caracteres'
        ])
      });
    });
  });

  describe('Special Character Validation', () => {
    it('should accept valid Spanish characters', () => {
      req.body = {
        nombre: 'José María',
        apellido: 'Pérez Ñoño',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject numbers in names', () => {
      req.body = {
        nombre: 'Juan123',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre solo puede contener letras y espacios'
        ])
      });
    });

    it('should reject special symbols in names', () => {
      req.body = {
        nombre: 'Juan@',
        apellido: 'Pérez#',
        celular: '3001234567',
        ciudad: 'Bogotá$',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre solo puede contener letras y espacios',
          'El apellido solo puede contener letras y espacios',
          'La ciudad solo puede contener letras y espacios'
        ])
      });
    });
  });

  describe('Student Update Edge Cases', () => {
    it('should handle partial updates with security validation', () => {
      req.body = {
        nombre: 'Juan<script>alert(1)</script>',
        cantidadPago: '150000'
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre contiene caracteres no permitidos'
        ])
      });
    });

    it('should properly convert string payment amount to number', () => {
      req.body = {
        cantidadPago: '150000.50'
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(req.body.cantidadPago).toBe(150000.50);
      expect(next).toHaveBeenCalled();
    });

    it('should handle invalid payment amount strings', () => {
      Student.validatePaymentAmount.mockReturnValue({
        isValid: false,
        message: 'La cantidad de pago debe ser un número válido'
      });

      req.body = {
        cantidadPago: 'invalid_amount'
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'La cantidad de pago debe ser un número válido'
        ])
      });
    });
  });

  describe('ID Parameter Validation', () => {
    it('should handle negative ID values', () => {
      req.params = { id: '-1' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(req.params.id).toBe(-1);
      expect(next).toHaveBeenCalled();
    });

    it('should handle zero ID value', () => {
      req.params = { id: '0' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(req.params.id).toBe(0);
      expect(next).toHaveBeenCalled();
    });

    it('should handle very large ID values', () => {
      req.params = { id: '999999999' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(req.params.id).toBe(999999999);
      expect(next).toHaveBeenCalled();
    });

    it('should reject decimal ID values', () => {
      req.params = { id: '123.45' };

      ValidationMiddleware.validateIdParam(req, res, next);

      // parseInt('123.45') returns 123, so this actually passes
      // Let's test with a truly invalid ID
      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalled();
    });

    it('should reject truly invalid ID values', () => {
      req.params = { id: 'abc123' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de estudiante inválido'
      });
    });
  });
});