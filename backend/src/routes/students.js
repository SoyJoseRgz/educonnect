const express = require('express');
const StudentController = require('../controllers/studentController');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Public endpoints
router.get('/public', StudentController.getPublicStudents);
router.post('/', ValidationMiddleware.validateStudentRegistration, StudentController.registerStudent);

// Admin endpoints (protected by auth middleware)
router.get('/admin', ValidationMiddleware.requireAuth, StudentController.getAdminStudents);
router.put('/:id',
  ValidationMiddleware.requireAuth,
  ValidationMiddleware.validateIdParam,
  ValidationMiddleware.validateStudentUpdate,
  StudentController.updateStudent
);
router.delete('/:id',
  ValidationMiddleware.requireAuth,
  ValidationMiddleware.validateIdParam,
  StudentController.deleteStudent
);

module.exports = router;