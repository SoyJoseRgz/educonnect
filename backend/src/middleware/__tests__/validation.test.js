const ValidationMiddleware = require('../validation');
const Student = require('../../models/Student');

// Mock the Student model
jest.mock('../../models/Student');

describe('ValidationMiddleware', () => {
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
  });

  describe('validateStudentRegistration', () => {
    beforeEach(() => {
      // Mock Student.validatePhoneNumber
      Student.validatePhoneNumber = jest.fn().mockReturnValue({
        isValid: true,
        cleanPhone: '3001234567'
      });
    });

    it('should validate required fields', () => {
      req.body = {
        nombre: '',
        apellido: '',
        celular: '',
        ciudad: '',
        curso: ''
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre es requerido',
          'El apellido es requerido',
          'El número celular es requerido',
          'La ciudad es requerida',
          'El curso es requerido'
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate name format and length', () => {
      req.body = {
        nombre: 'A',
        apellido: 'Juan123',
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
          'El nombre debe tener al menos 2 caracteres',
          'El apellido solo puede contener letras y espacios'
        ])
      });
    });

    it('should validate city format', () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá123',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'La ciudad solo puede contener letras y espacios'
        ])
      });
    });

    it('should validate course selection', () => {
      req.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Invalid Course'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El curso debe ser "Sanación de las familias" o "Angelología"'
        ])
      });
    });

    it('should handle phone validation errors', () => {
      Student.validatePhoneNumber.mockReturnValue({
        isValid: false,
        message: 'El número celular debe tener exactamente 10 dígitos'
      });

      req.body = {
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '123',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El número celular debe tener exactamente 10 dígitos'
        ])
      });
    });

    it('should validate against excessive whitespace', () => {
      req.body = {
        nombre: 'Juan  Carlos',
        apellido: 'Pérez  González',
        celular: '3001234567',
        ciudad: 'Bogotá  DC',
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

    it('should validate against suspicious patterns', () => {
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

    it('should handle edge case with very long names', () => {
      const longName = 'A'.repeat(51);
      req.body = {
        nombre: longName,
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

    it('should sanitize and pass valid data', () => {
      req.body = {
        nombre: '  Juan  ',
        apellido: '  Pérez  ',
        celular: '300-123-4567',
        ciudad: '  Bogotá  ',
        curso: '  Sanación de las familias  '
      };

      ValidationMiddleware.validateStudentRegistration(req, res, next);

      expect(req.body).toEqual({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateStudentUpdate', () => {
    beforeEach(() => {
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

    it('should validate partial updates', () => {
      req.body = {
        nombre: 'A'
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El nombre debe tener al menos 2 caracteres'
        ])
      });
    });

    it('should handle payment validation errors', () => {
      Student.validatePaymentStatus.mockReturnValue({
        isValid: false,
        message: 'Estado de pago debe ser: pendiente, parcial o completo'
      });

      Student.validatePaymentAmount.mockReturnValue({
        isValid: false,
        message: 'La cantidad de pago no puede ser negativa'
      });

      req.body = {
        estadoPago: 'invalid',
        cantidadPago: -100
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'Estado de pago debe ser: pendiente, parcial o completo',
          'La cantidad de pago no puede ser negativa'
        ])
      });
    });

    it('should pass valid partial updates', () => {
      req.body = {
        nombre: 'Juan Carlos',
        cantidadPago: 150000
      };

      ValidationMiddleware.validateStudentUpdate(req, res, next);

      expect(req.body).toEqual({
        nombre: 'Juan Carlos',
        cantidadPago: 150000
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateLogin', () => {
    it('should validate required fields', () => {
      req.body = {
        email: '',
        password: ''
      };

      ValidationMiddleware.validateLogin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El email es requerido',
          'La contraseña es requerida'
        ])
      });
    });

    it('should validate email format', () => {
      req.body = {
        email: 'invalid-email',
        password: 'password123'
      };

      ValidationMiddleware.validateLogin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: expect.arrayContaining([
          'El formato del email no es válido'
        ])
      });
    });

    it('should sanitize and pass valid credentials', () => {
      req.body = {
        email: '  ADMIN@TEST.COM  ',
        password: '  password123  '
      };

      ValidationMiddleware.validateLogin(req, res, next);

      expect(req.body).toEqual({
        email: 'admin@test.com',
        password: 'password123'
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateIdParam', () => {
    it('should validate missing ID', () => {
      req.params = {};

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de estudiante inválido'
      });
    });

    it('should validate non-numeric ID', () => {
      req.params = { id: 'abc' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'ID de estudiante inválido'
      });
    });

    it('should convert and pass valid ID', () => {
      req.params = { id: '123' };

      ValidationMiddleware.validateIdParam(req, res, next);

      expect(req.params.id).toBe(123);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should reject unauthenticated requests', () => {
      req.session = {};

      ValidationMiddleware.requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso no autorizado. Debe iniciar sesión como administrador.'
      });
    });

    it('should pass authenticated requests', () => {
      req.session = {
        adminId: 1,
        isAuthenticated: true
      };

      ValidationMiddleware.requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});