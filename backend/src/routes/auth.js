const express = require('express');
const AuthController = require('../controllers/authController');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Authentication endpoints
router.post('/login', ValidationMiddleware.validateLogin, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', ValidationMiddleware.requireAuth, AuthController.getCurrentAdmin);

module.exports = router;