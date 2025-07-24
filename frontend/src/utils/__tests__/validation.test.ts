import { ValidationUtils } from '../validation';

describe('ValidationUtils', () => {
  describe('validateName', () => {
    it('should validate required names', () => {
      expect(ValidationUtils.validateName('', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre es requerido'
      });
      
      expect(ValidationUtils.validateName('   ', 'El apellido')).toEqual({
        isValid: false,
        message: 'El apellido es requerido'
      });
    });

    it('should validate minimum length', () => {
      expect(ValidationUtils.validateName('A', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    });

    it('should validate maximum length', () => {
      const longName = 'A'.repeat(51);
      expect(ValidationUtils.validateName(longName, 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre no puede exceder 50 caracteres'
      });
    });

    it('should validate character format', () => {
      expect(ValidationUtils.validateName('Juan123', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre solo puede contener letras y espacios'
      });
      
      expect(ValidationUtils.validateName('Juan@', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre solo puede contener letras y espacios'
      });
    });

    it('should accept valid names', () => {
      expect(ValidationUtils.validateName('Juan', 'El nombre')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validateName('María José', 'El nombre')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validateName('José María', 'El apellido')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validateName('Ñoño', 'El nombre')).toEqual({
        isValid: true
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate required phone number', () => {
      expect(ValidationUtils.validatePhoneNumber('')).toEqual({
        isValid: false,
        message: 'El número celular es requerido'
      });
      
      expect(ValidationUtils.validatePhoneNumber('   ')).toEqual({
        isValid: false,
        message: 'El número celular es requerido'
      });
    });

    it('should validate phone number length', () => {
      expect(ValidationUtils.validatePhoneNumber('123456789')).toEqual({
        isValid: false,
        message: 'El número celular debe tener exactamente 10 dígitos'
      });
      
      expect(ValidationUtils.validatePhoneNumber('12345678901')).toEqual({
        isValid: false,
        message: 'El número celular debe tener exactamente 10 dígitos'
      });
    });

    it('should accept valid phone numbers', () => {
      expect(ValidationUtils.validatePhoneNumber('1234567890')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('2123456789')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3001234567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3123456789')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3209876543')).toEqual({
        isValid: true
      });
    });

    it('should handle phone numbers with formatting', () => {
      expect(ValidationUtils.validatePhoneNumber('123-456-7890')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('(123) 456-7890')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('300-123-4567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('(300) 123-4567')).toEqual({
        isValid: true
      });
    });
  });

  describe('validateCourse', () => {
    it('should validate required course', () => {
      expect(ValidationUtils.validateCourse('')).toEqual({
        isValid: false,
        message: 'Debe seleccionar un curso'
      });
    });

    it('should validate valid courses', () => {
      expect(ValidationUtils.validateCourse('Sanación de las familias')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validateCourse('Angelología')).toEqual({
        isValid: true
      });
    });

    it('should reject invalid courses', () => {
      expect(ValidationUtils.validateCourse('Invalid Course')).toEqual({
        isValid: false,
        message: 'Curso no válido'
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate required email', () => {
      expect(ValidationUtils.validateEmail('')).toEqual({
        isValid: false,
        message: 'El correo electrónico es requerido'
      });
    });

    it('should validate email format', () => {
      expect(ValidationUtils.validateEmail('invalid-email')).toEqual({
        isValid: false,
        message: 'Ingresa un correo electrónico válido'
      });
      
      expect(ValidationUtils.validateEmail('test@')).toEqual({
        isValid: false,
        message: 'Ingresa un correo electrónico válido'
      });
      
      expect(ValidationUtils.validateEmail('@domain.com')).toEqual({
        isValid: false,
        message: 'Ingresa un correo electrónico válido'
      });
    });

    it('should accept valid emails', () => {
      expect(ValidationUtils.validateEmail('test@example.com')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validateEmail('user.name@domain.co')).toEqual({
        isValid: true
      });
    });
  });

  describe('validatePaymentStatus', () => {
    it('should validate required status', () => {
      expect(ValidationUtils.validatePaymentStatus('')).toEqual({
        isValid: false,
        message: 'Debe seleccionar un estado de pago'
      });
    });

    it('should validate valid statuses', () => {
      expect(ValidationUtils.validatePaymentStatus('pendiente')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validatePaymentStatus('parcial')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validatePaymentStatus('completo')).toEqual({
        isValid: true
      });
    });

    it('should reject invalid statuses', () => {
      expect(ValidationUtils.validatePaymentStatus('invalid')).toEqual({
        isValid: false,
        message: 'Estado de pago no válido'
      });
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate required amount', () => {
      expect(ValidationUtils.validatePaymentAmount('')).toEqual({
        isValid: false,
        message: 'La cantidad es requerida'
      });
    });

    it('should validate numeric format', () => {
      expect(ValidationUtils.validatePaymentAmount('abc')).toEqual({
        isValid: false,
        message: 'La cantidad debe ser un número válido'
      });
    });

    it('should validate non-negative amounts', () => {
      expect(ValidationUtils.validatePaymentAmount('-100')).toEqual({
        isValid: false,
        message: 'La cantidad no puede ser negativa'
      });
    });

    it('should validate maximum amount', () => {
      expect(ValidationUtils.validatePaymentAmount('10000001')).toEqual({
        isValid: false,
        message: 'La cantidad no puede exceder $10,000,000'
      });
    });

    it('should accept valid amounts', () => {
      expect(ValidationUtils.validatePaymentAmount('0')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validatePaymentAmount('100.50')).toEqual({
        isValid: true
      });
      
      expect(ValidationUtils.validatePaymentAmount('1000000')).toEqual({
        isValid: true
      });
    });
  });

  describe('sanitizePhoneInput', () => {
    it('should remove non-digits and limit length', () => {
      expect(ValidationUtils.sanitizePhoneInput('123-456-7890')).toBe('1234567890');
      expect(ValidationUtils.sanitizePhoneInput('(123) 456-7890')).toBe('1234567890');
      expect(ValidationUtils.sanitizePhoneInput('123abc456def7890')).toBe('1234567890');
      expect(ValidationUtils.sanitizePhoneInput('12345678901234')).toBe('1234567890');
      expect(ValidationUtils.sanitizePhoneInput('300-123-4567')).toBe('3001234567');
      expect(ValidationUtils.sanitizePhoneInput('(300) 123-4567')).toBe('3001234567');
    });
  });

  describe('sanitizeNameInput', () => {
    it('should remove invalid characters and limit length', () => {
      expect(ValidationUtils.sanitizeNameInput('Juan123')).toBe('Juan');
      expect(ValidationUtils.sanitizeNameInput('María@José')).toBe('MaríaJosé');
      expect(ValidationUtils.sanitizeNameInput('José-María')).toBe('JoséMaría');
      expect(ValidationUtils.sanitizeNameInput('María José')).toBe('María José');
      expect(ValidationUtils.sanitizeNameInput('José  María')).toBe('José María');
      
      const longName = 'A'.repeat(60);
      expect(ValidationUtils.sanitizeNameInput(longName)).toBe('A'.repeat(50));
    });
  });

  describe('sanitizeAmountInput', () => {
    it('should allow only digits and one decimal point', () => {
      expect(ValidationUtils.sanitizeAmountInput('123.45')).toBe('123.45');
      expect(ValidationUtils.sanitizeAmountInput('123abc.45def')).toBe('123.45');
      expect(ValidationUtils.sanitizeAmountInput('123.45.67')).toBe('123.4567');
      expect(ValidationUtils.sanitizeAmountInput('$123.45')).toBe('123.45');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should validate against excessive whitespace in names', () => {
      expect(ValidationUtils.validateName('Juan  Carlos', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre no puede contener espacios múltiples consecutivos'
      });
    });

    it('should validate against suspicious patterns', () => {
      // The validation checks character format first, then security patterns
      expect(ValidationUtils.validateName('Juan<script>alert("xss")</script>', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre solo puede contener letras y espacios'
      });

      expect(ValidationUtils.validateName('Juan javascript:alert(1)', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre solo puede contener letras y espacios'
      });
    });

    it('should handle null and undefined values', () => {
      expect(ValidationUtils.validateFormData({ nombre: null, apellido: undefined })).toEqual({
        isValid: false,
        errors: {
          nombre: 'nombre no puede estar vacío',
          apellido: 'apellido no puede estar vacío'
        }
      });
    });

    it('should validate against extremely long values', () => {
      const longValue = 'A'.repeat(1001);
      expect(ValidationUtils.validateFormData({ nombre: longValue })).toEqual({
        isValid: false,
        errors: {
          nombre: 'nombre excede la longitud máxima permitida'
        }
      });
    });

    it('should create rate limiter correctly', () => {
      const rateLimiter = ValidationUtils.createRateLimiter(3, 1000);
      
      // Should allow first 3 attempts
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(true);
      expect(rateLimiter('user1')).toBe(true);
      
      // Should block 4th attempt
      expect(rateLimiter('user1')).toBe(false);
      
      // Should allow different user
      expect(rateLimiter('user2')).toBe(true);
    });
  });

  describe('Enhanced Phone Validation', () => {
    it('should handle edge cases in phone validation', () => {
      // Empty string variations
      expect(ValidationUtils.validatePhoneNumber('   ')).toEqual({
        isValid: false,
        message: 'El número celular es requerido'
      });

      // Invalid lengths
      expect(ValidationUtils.validatePhoneNumber('300123456')).toEqual({
        isValid: false,
        message: 'El número celular debe tener exactamente 10 dígitos'
      });

      expect(ValidationUtils.validatePhoneNumber('30012345678')).toEqual({
        isValid: false,
        message: 'El número celular debe tener exactamente 10 dígitos'
      });

      // Valid phone numbers (any 10 digits)
      expect(ValidationUtils.validatePhoneNumber('1001234567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('2001234567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3001234567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3101234567')).toEqual({
        isValid: true
      });

      expect(ValidationUtils.validatePhoneNumber('3201234567')).toEqual({
        isValid: true
      });
    });
  });
});