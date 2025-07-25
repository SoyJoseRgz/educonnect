// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export class ValidationUtils {
  // Name validation (for nombre and apellido)
  static validateName(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: `${fieldName} es requerido` };
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < 2) {
      return { isValid: false, message: `${fieldName} debe tener al menos 2 caracteres` };
    }

    if (trimmedValue.length > 50) {
      return { isValid: false, message: `${fieldName} no puede exceder 50 caracteres` };
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) {
      return { isValid: false, message: `${fieldName} solo puede contener letras y espacios` };
    }

    // Check for excessive whitespace
    if (/\s{2,}/.test(trimmedValue)) {
      return { isValid: false, message: `${fieldName} no puede contener espacios múltiples consecutivos` };
    }

    // Check for suspicious patterns (basic XSS protection)
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\(/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(value))) {
      return { isValid: false, message: `${fieldName} contiene caracteres no permitidos` };
    }

    return { isValid: true };
  }

  // Phone number validation
  static validatePhoneNumber(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'El número celular es requerido' };
    }

    const cleanPhone = value.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      return { isValid: false, message: 'El número celular debe tener exactamente 10 dígitos' };
    }

    return { isValid: true };
  }

  // City validation
  static validateCity(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'La ciudad es requerida' };
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < 2) {
      return { isValid: false, message: 'La ciudad debe tener al menos 2 caracteres' };
    }

    if (trimmedValue.length > 50) {
      return { isValid: false, message: 'La ciudad no puede exceder 50 caracteres' };
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedValue)) {
      return { isValid: false, message: 'La ciudad solo puede contener letras y espacios' };
    }

    // Check for excessive whitespace
    if (/\s{2,}/.test(trimmedValue)) {
      return { isValid: false, message: 'La ciudad no puede contener espacios múltiples consecutivos' };
    }

    return { isValid: true };
  }

  // Course validation (single course - for backward compatibility)
  static validateCourse(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Debe seleccionar un curso' };
    }

    const validCourses = ['Sanación de las familias', 'Angelología'];
    if (!validCourses.includes(value.trim())) {
      return { isValid: false, message: 'Curso no válido' };
    }

    return { isValid: true };
  }

  // Multiple courses validation
  static validateCourses(values: string[]): ValidationResult {
    if (!values || !Array.isArray(values) || values.length === 0) {
      return { isValid: false, message: 'Debe seleccionar al menos un curso' };
    }

    const validCourses = ['Sanación de las familias', 'Angelología'];
    const trimmedValues = values.map(curso => curso.trim());
    const invalidCourses = trimmedValues.filter(curso => !validCourses.includes(curso));

    if (invalidCourses.length > 0) {
      return { isValid: false, message: `Cursos inválidos: ${invalidCourses.join(', ')}` };
    }

    // Check for duplicates
    const uniqueCourses = Array.from(new Set(trimmedValues));
    if (uniqueCourses.length !== trimmedValues.length) {
      return { isValid: false, message: 'No se pueden seleccionar cursos duplicados' };
    }

    return { isValid: true };
  }

  // Email validation
  static validateEmail(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'El correo electrónico es requerido' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return { isValid: false, message: 'Ingresa un correo electrónico válido' };
    }

    return { isValid: true };
  }

  // Password validation
  static validatePassword(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'La contraseña es requerida' };
    }

    return { isValid: true };
  }

  // Payment status validation
  static validatePaymentStatus(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'Debe seleccionar un estado de pago' };
    }

    const validStatuses = ['pendiente', 'parcial', 'completo'];
    if (!validStatuses.includes(value)) {
      return { isValid: false, message: 'Estado de pago no válido' };
    }

    return { isValid: true };
  }

  // Payment amount validation
  static validatePaymentAmount(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'La cantidad es requerida' };
    }

    const amount = parseFloat(value);
    if (isNaN(amount)) {
      return { isValid: false, message: 'La cantidad debe ser un número válido' };
    }

    if (amount < 0) {
      return { isValid: false, message: 'La cantidad no puede ser negativa' };
    }

    if (amount > 10000000) {
      return { isValid: false, message: 'La cantidad no puede exceder $10,000,000' };
    }

    return { isValid: true };
  }

  // Real-time input sanitization
  static sanitizePhoneInput(value: string): string {
    // Only allow digits and limit to 10 characters
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 10);
  }

  static sanitizeNameInput(value: string): string {
    // Allow letters, spaces, and accented characters, then replace multiple spaces with single space
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').replace(/\s+/g, ' ').slice(0, 50);
  }

  // Enhanced validation for edge cases
  static validateFormData(data: Record<string, any>): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Check for null/undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined) {
        errors[key] = `${key} no puede estar vacío`;
      }
    });

    // Check for extremely long values (potential DoS attack)
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key].length > 1000) {
        errors[key] = `${key} excede la longitud máxima permitida`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Rate limiting helper for validation
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier);

      if (!userAttempts || now > userAttempts.resetTime) {
        attempts.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (userAttempts.count >= maxAttempts) {
        return false;
      }

      userAttempts.count++;
      return true;
    };
  }

  static sanitizeAmountInput(value: string): string {
    // Allow digits and one decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return sanitized;
  }
}

// Export individual validation functions for easier use
export const {
  validateName,
  validatePhoneNumber,
  validateCity,
  validateCourse,
  validateCourses,
  validateEmail,
  validatePassword,
  validatePaymentStatus,
  validatePaymentAmount,
  sanitizePhoneInput,
  sanitizeNameInput,
  sanitizeAmountInput
} = ValidationUtils;