const Student = require('../models/Student');

class ValidationMiddleware {
  // Middleware for protecting admin routes
  static requireAuth(req, res, next) {
    if (!req.session || !req.session.adminId || !req.session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Debe iniciar sesión como administrador.'
      });
    }
    next();
  }

  // Middleware for validating login credentials
  static validateLogin(req, res, next) {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim() === '') {
      errors.push('El email es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('El formato del email no es válido');
      }
    }

    if (!password || password.trim() === '') {
      errors.push('La contraseña es requerida');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Sanitize input
    req.body.email = email.trim().toLowerCase();
    req.body.password = password.trim();

    next();
  }
  // Middleware for validating student registration
  static validateStudentRegistration(req, res, next) {
    const { nombre, apellido, celular, ciudad, cursos } = req.body;
    const errors = [];

    // Check required fields
    if (!nombre || nombre.trim() === '') {
      errors.push('El nombre es requerido');
    } else {
      // Additional name validation
      if (nombre.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
      }
      if (nombre.trim().length > 50) {
        errors.push('El nombre no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
        errors.push('El nombre solo puede contener letras y espacios');
      }
      // Check for excessive whitespace
      if (/\s{2,}/.test(nombre.trim())) {
        errors.push('El nombre no puede contener espacios múltiples consecutivos');
      }
    }

    if (!apellido || apellido.trim() === '') {
      errors.push('El apellido es requerido');
    } else {
      // Additional lastname validation
      if (apellido.trim().length < 2) {
        errors.push('El apellido debe tener al menos 2 caracteres');
      }
      if (apellido.trim().length > 50) {
        errors.push('El apellido no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido.trim())) {
        errors.push('El apellido solo puede contener letras y espacios');
      }
      // Check for excessive whitespace
      if (/\s{2,}/.test(apellido.trim())) {
        errors.push('El apellido no puede contener espacios múltiples consecutivos');
      }
    }

    if (!celular || celular.trim() === '') {
      errors.push('El número celular es requerido');
    } else {
      // Validate phone number format
      const phoneValidation = Student.validatePhoneNumber(celular);
      if (!phoneValidation.isValid) {
        errors.push(phoneValidation.message);
      }
    }

    if (!ciudad || ciudad.trim() === '') {
      errors.push('La ciudad es requerida');
    } else {
      // Additional city validation
      if (ciudad.trim().length < 2) {
        errors.push('La ciudad debe tener al menos 2 caracteres');
      }
      if (ciudad.trim().length > 50) {
        errors.push('La ciudad no puede exceder 50 caracteres');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(ciudad.trim())) {
        errors.push('La ciudad solo puede contener letras y espacios');
      }
      // Check for excessive whitespace
      if (/\s{2,}/.test(ciudad.trim())) {
        errors.push('La ciudad no puede contener espacios múltiples consecutivos');
      }
    }

    // Validate cursos (multiple courses)
    if (!cursos || !Array.isArray(cursos) || cursos.length === 0) {
      errors.push('Debe seleccionar al menos un curso');
    } else {
      const validCourses = ['Sanación de las familias', 'Angelología'];
      const invalidCourses = cursos.filter(curso => !validCourses.includes(curso.trim()));
      if (invalidCourses.length > 0) {
        errors.push(`Cursos inválidos: ${invalidCourses.join(', ')}`);
      }
      
      // Check for duplicates
      const uniqueCourses = [...new Set(cursos.map(curso => curso.trim()))];
      if (uniqueCourses.length !== cursos.length) {
        errors.push('No se pueden seleccionar cursos duplicados');
      }
    }

    // Additional security validations
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\(/i
    ];

    [nombre, apellido, ciudad].forEach((field, index) => {
      const fieldNames = ['nombre', 'apellido', 'ciudad'];
      const fieldLabels = ['El nombre', 'El apellido', 'La ciudad'];
      if (field && suspiciousPatterns.some(pattern => pattern.test(field))) {
        errors.push(`${fieldLabels[index]} contiene caracteres no permitidos`);
      }
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Sanitize input data
    req.body.nombre = nombre.trim().replace(/\s+/g, ' '); // Replace multiple spaces with single space
    req.body.apellido = apellido.trim().replace(/\s+/g, ' ');
    req.body.celular = celular.replace(/\D/g, ''); // Remove non-digits
    req.body.ciudad = ciudad.trim().replace(/\s+/g, ' ');
    req.body.cursos = cursos.map(curso => curso.trim());

    next();
  }

  // Middleware for validating student updates (admin)
  static validateStudentUpdate(req, res, next) {
    const { nombre, apellido, celular, ciudad, cursos, estadoPago, cantidadPago } = req.body;
    const errors = [];

    // Additional security validations
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\(/i
    ];

    // Validate fields if they are provided
    if (nombre !== undefined) {
      if (!nombre || nombre.trim() === '') {
        errors.push('El nombre no puede estar vacío');
      } else {
        if (nombre.trim().length < 2) {
          errors.push('El nombre debe tener al menos 2 caracteres');
        }
        if (nombre.trim().length > 50) {
          errors.push('El nombre no puede exceder 50 caracteres');
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim())) {
          errors.push('El nombre solo puede contener letras y espacios');
        }
        if (/\s{2,}/.test(nombre.trim())) {
          errors.push('El nombre no puede contener espacios múltiples consecutivos');
        }
        if (suspiciousPatterns.some(pattern => pattern.test(nombre))) {
          errors.push('El nombre contiene caracteres no permitidos');
        }
      }
    }

    if (apellido !== undefined) {
      if (!apellido || apellido.trim() === '') {
        errors.push('El apellido no puede estar vacío');
      } else {
        if (apellido.trim().length < 2) {
          errors.push('El apellido debe tener al menos 2 caracteres');
        }
        if (apellido.trim().length > 50) {
          errors.push('El apellido no puede exceder 50 caracteres');
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido.trim())) {
          errors.push('El apellido solo puede contener letras y espacios');
        }
        if (/\s{2,}/.test(apellido.trim())) {
          errors.push('El apellido no puede contener espacios múltiples consecutivos');
        }
        if (suspiciousPatterns.some(pattern => pattern.test(apellido))) {
          errors.push('El apellido contiene caracteres no permitidos');
        }
      }
    }

    if (celular !== undefined) {
      if (!celular || celular.trim() === '') {
        errors.push('El número celular no puede estar vacío');
      } else {
        const phoneValidation = Student.validatePhoneNumber(celular);
        if (!phoneValidation.isValid) {
          errors.push(phoneValidation.message);
        }
      }
    }

    if (ciudad !== undefined) {
      if (!ciudad || ciudad.trim() === '') {
        errors.push('La ciudad no puede estar vacía');
      } else {
        if (ciudad.trim().length < 2) {
          errors.push('La ciudad debe tener al menos 2 caracteres');
        }
        if (ciudad.trim().length > 50) {
          errors.push('La ciudad no puede exceder 50 caracteres');
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(ciudad.trim())) {
          errors.push('La ciudad solo puede contener letras y espacios');
        }
        if (/\s{2,}/.test(ciudad.trim())) {
          errors.push('La ciudad no puede contener espacios múltiples consecutivos');
        }
        if (suspiciousPatterns.some(pattern => pattern.test(ciudad))) {
          errors.push('La ciudad contiene caracteres no permitidos');
        }
      }
    }

    if (cursos !== undefined) {
      if (!cursos || !Array.isArray(cursos) || cursos.length === 0) {
        errors.push('Debe seleccionar al menos un curso');
      } else {
        const validCourses = ['Sanación de las familias', 'Angelología'];
        const invalidCourses = cursos.filter(curso => !validCourses.includes(curso.trim()));
        if (invalidCourses.length > 0) {
          errors.push(`Cursos inválidos: ${invalidCourses.join(', ')}`);
        }
        
        // Check for duplicates
        const uniqueCourses = [...new Set(cursos.map(curso => curso.trim()))];
        if (uniqueCourses.length !== cursos.length) {
          errors.push('No se pueden seleccionar cursos duplicados');
        }
      }
    }

    if (estadoPago !== undefined) {
      const statusValidation = Student.validatePaymentStatus(estadoPago);
      if (!statusValidation.isValid) {
        errors.push(statusValidation.message);
      }
    }

    if (cantidadPago !== undefined) {
      // Convert to number if it's a string
      const amount = typeof cantidadPago === 'string' ? parseFloat(cantidadPago) : cantidadPago;
      const amountValidation = Student.validatePaymentAmount(amount);
      if (!amountValidation.isValid) {
        errors.push(amountValidation.message);
      } else {
        req.body.cantidadPago = amount; // Ensure it's stored as number
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Sanitize input data
    if (nombre !== undefined) req.body.nombre = nombre.trim().replace(/\s+/g, ' ');
    if (apellido !== undefined) req.body.apellido = apellido.trim().replace(/\s+/g, ' ');
    if (celular !== undefined) req.body.celular = celular.replace(/\D/g, '');
    if (ciudad !== undefined) req.body.ciudad = ciudad.trim().replace(/\s+/g, ' ');
    if (cursos !== undefined) req.body.cursos = cursos.map(curso => curso.trim());

    next();
  }

  // Middleware for validating ID parameters
  static validateIdParam(req, res, next) {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de estudiante inválido'
      });
    }

    req.params.id = parseInt(id);
    next();
  }
}

module.exports = ValidationMiddleware;