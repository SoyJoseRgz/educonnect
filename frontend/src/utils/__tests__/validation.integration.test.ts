import { ValidationUtils } from '../validation';

describe('Validation Integration Tests', () => {
  describe('Form Validation Scenarios', () => {
    it('should validate complete student registration form', () => {
      const validData = {
        nombre: 'Juan Carlos',
        apellido: 'Pérez González',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      };

      // All fields should be valid
      expect(ValidationUtils.validateName(validData.nombre, 'El nombre')).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateName(validData.apellido, 'El apellido')).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validatePhoneNumber(validData.celular)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateCity(validData.ciudad)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateCourse(validData.curso)).toEqual({
        isValid: true
      });
    });

    it('should validate complete admin student update form', () => {
      const validData = {
        nombre: 'María José',
        apellido: 'García López',
        celular: '3109876543',
        ciudad: 'Medellín',
        curso: 'Angelología',
        estadoPago: 'parcial' as const,
        cantidadPago: '150000'
      };

      // All fields should be valid
      expect(ValidationUtils.validateName(validData.nombre, 'El nombre')).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateName(validData.apellido, 'El apellido')).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validatePhoneNumber(validData.celular)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateCity(validData.ciudad)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validateCourse(validData.curso)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validatePaymentStatus(validData.estadoPago)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validatePaymentAmount(validData.cantidadPago)).toEqual({
        isValid: true
      });
    });

    it('should validate login form', () => {
      const validData = {
        email: 'admin@educonnect.com',
        password: 'securePassword123'
      };

      expect(ValidationUtils.validateEmail(validData.email)).toEqual({
        isValid: true
      });
      expect(ValidationUtils.validatePassword(validData.password)).toEqual({
        isValid: true
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle multiple validation errors in registration', () => {
      const invalidData = {
        nombre: '',
        apellido: 'A',
        celular: '123',
        ciudad: '',
        curso: 'Invalid Course'
      };

      const nombreValidation = ValidationUtils.validateName(invalidData.nombre, 'El nombre');
      const apellidoValidation = ValidationUtils.validateName(invalidData.apellido, 'El apellido');
      const celularValidation = ValidationUtils.validatePhoneNumber(invalidData.celular);
      const ciudadValidation = ValidationUtils.validateCity(invalidData.ciudad);
      const cursoValidation = ValidationUtils.validateCourse(invalidData.curso);

      expect(nombreValidation.isValid).toBe(false);
      expect(apellidoValidation.isValid).toBe(false);
      expect(celularValidation.isValid).toBe(false);
      expect(ciudadValidation.isValid).toBe(false);
      expect(cursoValidation.isValid).toBe(false);

      // Collect all error messages
      const errors = [
        nombreValidation.message,
        apellidoValidation.message,
        celularValidation.message,
        ciudadValidation.message,
        cursoValidation.message
      ].filter(Boolean);

      expect(errors.length).toBe(5);
      expect(errors).toContain('El nombre es requerido');
      expect(errors).toContain('El apellido debe tener al menos 2 caracteres');
      expect(errors).toContain('El número celular debe tener exactamente 10 dígitos');
      expect(errors).toContain('La ciudad es requerida');
      expect(errors).toContain('Curso no válido');
    });

    it('should handle security validation errors', () => {
      const maliciousData = {
        nombre: 'Juan<script>alert("xss")</script>',
        apellido: 'Pérez javascript:alert(1)',
        ciudad: 'Bogotá<iframe src="evil.com"></iframe>'
      };

      // All should fail character format validation first
      expect(ValidationUtils.validateName(maliciousData.nombre, 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre solo puede contener letras y espacios'
      });

      expect(ValidationUtils.validateName(maliciousData.apellido, 'El apellido')).toEqual({
        isValid: false,
        message: 'El apellido solo puede contener letras y espacios'
      });

      expect(ValidationUtils.validateCity(maliciousData.ciudad)).toEqual({
        isValid: false,
        message: 'La ciudad solo puede contener letras y espacios'
      });
    });
  });

  describe('Sanitization Integration', () => {
    it('should properly sanitize phone input', () => {
      const inputs = [
        { input: '123-456-7890', expected: '1234567890' },
        { input: '(123) 456-7890', expected: '1234567890' },
        { input: '123.456.7890', expected: '1234567890' },
        { input: '123 456 7890', expected: '1234567890' },
        { input: '123abc456def7890', expected: '1234567890' },
        { input: '300-123-4567', expected: '3001234567' },
        { input: '(300) 123-4567', expected: '3001234567' },
        { input: '300.123.4567', expected: '3001234567' },
        { input: '300 123 4567', expected: '3001234567' },
        { input: '300abc123def4567', expected: '3001234567' }
      ];

      inputs.forEach(({ input, expected }) => {
        const sanitized = ValidationUtils.sanitizePhoneInput(input);
        expect(sanitized).toBe(expected);
        expect(ValidationUtils.validatePhoneNumber(sanitized)).toEqual({
          isValid: true
        });
      });
    });

    it('should properly sanitize name input', () => {
      const inputs = [
        'Juan  Carlos',
        'María   José',
        'José123María',
        'Ana@Lucía'
      ];

      const expected = [
        'Juan Carlos',
        'María José',
        'JoséMaría',
        'AnaLucía'
      ];

      inputs.forEach((input, index) => {
        const sanitized = ValidationUtils.sanitizeNameInput(input);
        expect(sanitized).toBe(expected[index]);
      });
    });

    it('should properly sanitize amount input', () => {
      const inputs = [
        '$123.45',
        '123,456.78',
        '123abc.45def',
        '123.45.67'
      ];

      const expected = [
        '123.45',
        '123456.78',
        '123.45',
        '123.4567'
      ];

      inputs.forEach((input, index) => {
        const sanitized = ValidationUtils.sanitizeAmountInput(input);
        expect(sanitized).toBe(expected[index]);
      });
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum and maximum name lengths', () => {
      // Minimum valid length (2 characters)
      expect(ValidationUtils.validateName('Jo', 'El nombre')).toEqual({
        isValid: true
      });

      // Maximum valid length (50 characters)
      const maxName = 'A'.repeat(50);
      expect(ValidationUtils.validateName(maxName, 'El nombre')).toEqual({
        isValid: true
      });

      // Too short (1 character)
      expect(ValidationUtils.validateName('J', 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });

      // Too long (51 characters)
      const tooLongName = 'A'.repeat(51);
      expect(ValidationUtils.validateName(tooLongName, 'El nombre')).toEqual({
        isValid: false,
        message: 'El nombre no puede exceder 50 caracteres'
      });
    });

    it('should handle payment amount boundaries', () => {
      // Minimum valid amount
      expect(ValidationUtils.validatePaymentAmount('0')).toEqual({
        isValid: true
      });

      // Maximum valid amount
      expect(ValidationUtils.validatePaymentAmount('10000000')).toEqual({
        isValid: true
      });

      // Negative amount
      expect(ValidationUtils.validatePaymentAmount('-1')).toEqual({
        isValid: false,
        message: 'La cantidad no puede ser negativa'
      });

      // Amount too large
      expect(ValidationUtils.validatePaymentAmount('10000001')).toEqual({
        isValid: false,
        message: 'La cantidad no puede exceder $10,000,000'
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle common Colombian names', () => {
      const colombianNames = [
        'José María',
        'Ana Lucía',
        'Juan Sebastián',
        'María Fernanda',
        'Carlos Andrés',
        'Luz Ángela',
        'Óscar Iván',
        'Nubia Esperanza'
      ];

      colombianNames.forEach(name => {
        expect(ValidationUtils.validateName(name, 'El nombre')).toEqual({
          isValid: true
        });
      });
    });

    it('should handle common Colombian cities', () => {
      const colombianCities = [
        'Bogotá',
        'Medellín',
        'Cali',
        'Barranquilla',
        'Cartagena',
        'Cúcuta',
        'Bucaramanga',
        'Pereira',
        'Santa Marta',
        'Ibagué',
        'Pasto',
        'Manizales'
      ];

      colombianCities.forEach(city => {
        expect(ValidationUtils.validateCity(city)).toEqual({
          isValid: true
        });
      });
    });

    it('should handle various phone number formats', () => {
      const phoneNumbers = [
        '1234567890', // Generic 10-digit
        '2123456789', // US-style
        '3001234567', // Colombian mobile
        '3101234567', // Colombian mobile
        '3201234567', // Colombian mobile
        '4567890123', // Generic
        '5678901234', // Generic
        '6789012345', // Generic
        '7890123456', // Generic
        '8901234567', // Generic
        '9012345678'  // Generic
      ];

      phoneNumbers.forEach(phone => {
        expect(ValidationUtils.validatePhoneNumber(phone)).toEqual({
          isValid: true
        });
      });
    });
  });
});