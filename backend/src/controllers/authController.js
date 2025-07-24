const Admin = require('../models/Admin');

class AuthController {
  // POST /api/auth/login - Admin authentication
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Authenticate admin
      const admin = await Admin.authenticate(email, password);

      // Create simple session (store admin ID in session)
      req.session = req.session || {};
      req.session.adminId = admin.id;
      req.session.isAuthenticated = true;

      res.json({
        success: true,
        message: 'Autenticación exitosa',
        data: {
          admin: admin
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      
      // Handle authentication errors
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          success: false,
          message: 'Email o contraseña incorrectos'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // POST /api/auth/logout - Admin logout
  static async logout(req, res) {
    try {
      // Clear session
      req.session = null;

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/auth/me - Get current admin info
  static async getCurrentAdmin(req, res) {
    try {
      if (!req.session || !req.session.adminId) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const admin = await Admin.findById(req.session.adminId);
      if (!admin) {
        // Clear invalid session
        req.session = null;
        return res.status(401).json({
          success: false,
          message: 'Sesión inválida'
        });
      }

      res.json({
        success: true,
        data: {
          admin: admin.toSafeJSON()
        }
      });
    } catch (error) {
      console.error('Error getting current admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener información del administrador',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;