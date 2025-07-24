const request = require('supertest');
const app = require('../../../server');
const testDbInit = require('../../database/testInit');
const Admin = require('../../models/Admin');

describe('Auth Routes', () => {
  let testAdmin;

  beforeAll(async () => {
    // Initialize test database
    await testDbInit.initialize();
    
    // Clear admins table
    await testDbInit.clearAdmins();
    
    // Create test admin
    testAdmin = new Admin({
      email: 'test@admin.com',
      password: 'testpass123'
    });
    await testAdmin.create();
  });

  beforeEach(async () => {
    // Clear students table before each test
    await testDbInit.clearTables();
  });

  afterAll(async () => {
    // Clean up after tests
    await testDbInit.close();
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate admin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@admin.com',
          password: 'testpass123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Autenticación exitosa');
      expect(response.body.data.admin).toHaveProperty('id');
      expect(response.body.data.admin.email).toBe('test@admin.com');
      expect(response.body.data.admin).not.toHaveProperty('password');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@admin.com',
          password: 'testpass123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email o contraseña incorrectos');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@admin.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email o contraseña incorrectos');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error de validación');
      expect(response.body.errors).toContain('El email es requerido');
      expect(response.body.errors).toContain('La contraseña es requerida');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'testpass123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('El formato del email no es válido');
    });

    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '  TEST@ADMIN.COM  ',
          password: 'testpass123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin.email).toBe('test@admin.com');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión cerrada exitosamente');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current admin info when authenticated', async () => {
      // First login
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@admin.com',
          password: 'testpass123'
        })
        .expect(200);

      // Then get current admin info
      const response = await agent
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.admin).toHaveProperty('id');
      expect(response.body.data.admin.email).toBe('test@admin.com');
      expect(response.body.data.admin).not.toHaveProperty('password');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acceso no autorizado. Debe iniciar sesión como administrador.');
    });
  });

  describe('Protected Routes', () => {
    it('should protect admin student endpoints', async () => {
      const response = await request(app)
        .get('/api/students/admin')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acceso no autorizado. Debe iniciar sesión como administrador.');
    });

    it('should allow access to admin endpoints when authenticated', async () => {
      // First login
      const agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({
          email: 'test@admin.com',
          password: 'testpass123'
        })
        .expect(200);

      // Then access admin endpoint
      const response = await agent
        .get('/api/students/admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });
});