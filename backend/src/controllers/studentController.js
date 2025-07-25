const Student = require('../models/Student');

class StudentController {
  // GET /api/students/public - Returns only name and city
  static async getPublicStudents(req, res) {
    try {
      const students = await Student.findPublic();
      
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching public students:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de estudiantes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // POST /api/students - Register new student
  static async registerStudent(req, res) {
    try {
      const { nombre, apellido, celular, ciudad, cursos } = req.body;

      // Ensure cursos is an array
      const cursosArray = Array.isArray(cursos) ? cursos : [cursos].filter(Boolean);

      // Create new student instance
      const student = new Student({
        nombre,
        apellido,
        celular,
        ciudad,
        cursos: cursosArray,
        estadoPago: 'pendiente',
        cantidadPago: 0
      });

      // Save to database
      const savedStudent = await student.create();

      res.status(201).json({
        success: true,
        message: `Estudiante registrado exitosamente en ${cursosArray.length > 1 ? 'los cursos' : 'el curso'}: ${cursosArray.join(', ')}`,
        data: savedStudent.toJSON()
      });
    } catch (error) {
      console.error('Error registering student:', error);
      
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          error: error.message.replace('Validation failed: ', '')
        });
      }

      // Handle duplicate phone number error
      if (error.message.includes('Ya existe un estudiante registrado con el número celular')) {
        return res.status(409).json({
          success: false,
          message: 'Número de celular duplicado',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar estudiante',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/students/admin - Returns full student data (for admin)
  static async getAdminStudents(req, res) {
    try {
      const students = await Student.findAll();
      
      res.json({
        success: true,
        data: students.map(student => student.toJSON()),
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching admin students:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de estudiantes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // PUT /api/students/:id - Update student information (admin only)
  static async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const { nombre, apellido, celular, ciudad, cursos, estadoPago, cantidadPago } = req.body;

      // Find existing student
      const existingStudent = await Student.findById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      // Ensure cursos is an array if provided
      const cursosArray = cursos ? (Array.isArray(cursos) ? cursos : [cursos].filter(Boolean)) : existingStudent.cursos;

      // Update student data
      Object.assign(existingStudent, {
        nombre: nombre || existingStudent.nombre,
        apellido: apellido || existingStudent.apellido,
        celular: celular || existingStudent.celular,
        ciudad: ciudad || existingStudent.ciudad,
        cursos: cursosArray,
        estadoPago: estadoPago || existingStudent.estadoPago,
        cantidadPago: cantidadPago !== undefined ? cantidadPago : existingStudent.cantidadPago
      });

      // Save updated student
      const updatedStudent = await existingStudent.update();

      res.json({
        success: true,
        message: 'Estudiante actualizado exitosamente',
        data: updatedStudent.toJSON()
      });
    } catch (error) {
      console.error('Error updating student:', error);
      
      // Handle validation errors
      if (error.message.includes('Validation failed')) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          error: error.message.replace('Validation failed: ', '')
        });
      }

      // Handle duplicate phone number error
      if (error.message.includes('Ya existe otro estudiante registrado con el número celular')) {
        return res.status(409).json({
          success: false,
          message: 'Número de celular duplicado',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar estudiante',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // DELETE /api/students/:id - Delete student (admin only)
  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      // Find existing student
      const existingStudent = await Student.findById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }

      // Delete student
      await existingStudent.delete();

      res.json({
        success: true,
        message: 'Estudiante eliminado exitosamente',
        data: { id: parseInt(id) }
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar estudiante',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/students/check-phone/:celular - Check if phone number exists
  static async checkPhoneExists(req, res) {
    try {
      const { celular } = req.params;

      // Validate phone number format
      const phoneValidation = Student.validatePhoneNumber(celular);
      if (!phoneValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: phoneValidation.message
        });
      }

      // Check if student exists with this phone number
      const existingStudent = await Student.findByCelular(phoneValidation.cleanPhone);

      res.json({
        success: true,
        exists: !!existingStudent,
        data: existingStudent ? {
          id: existingStudent.id,
          nombre: existingStudent.nombre,
          apellido: existingStudent.apellido,
          cursos: existingStudent.cursos
        } : null
      });
    } catch (error) {
      console.error('Error checking phone existence:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar número de teléfono',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = StudentController;