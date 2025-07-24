const request = require('supertest');
const app = require('../../../server');
const testDbInit = require('../../database/testInit');
const Student = require('../../models/Student');
const Admin = require('../../models/Admin');

describe('Student Routes - Admin Endpoints', () => {
  let testAdmin;
  let authenticatedAgent;

  beforeAll(async () => {
    // Initialize test database
    await testDbInit.initialize();
    
    // Clear admins table
    await testDbInit.clearAdmins();
    
    // Create test admin
    testAdmin = new Admin({
      email: 'admin@test.com',
      password: 'adminpass123'
    });
    await testAdmin.create();

    // Create authenticated agent
    authenticatedAgent = request.agent(app);
    await authenticatedAgent
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'adminpass123'
      })
      .expect(200);
  });

  beforeEach(async () => {
    // Clear students table before each test
    await testDbInit.clearTables();
  });

  afterAll(async () => {
    // Clean up after tests
    await testDbInit.close();
  });

  describe('GET /api/students/admin', () => {
    it('should return empty array when no students exist', async () => {
      const response = await authenticatedAgent
        .get('/api/students/admin')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should return full student data including payment info', async () => {
      // Create test students
      const student1 = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias',
        estadoPago: 'parcial',
        cantidadPago: 50000
      });
      await student1.create();

      const student2 = new Student({
        nombre: 'María',
        apellido: 'García',
        celular: '3109876543',
        ciudad: 'Medellín',
        curso: 'Angelología',
        estadoPago: 'completo',
        cantidadPago: 100000
      });
      await student2.create();

      const response = await authenticatedAgent
        .get('/api/students/admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      
      // Check that all fields are returned
      response.body.data.forEach(student => {
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('nombre');
        expect(student).toHaveProperty('apellido');
        expect(student).toHaveProperty('celular');
        expect(student).toHaveProperty('ciudad');
        expect(student).toHaveProperty('curso');
        expect(student).toHaveProperty('estadoPago');
        expect(student).toHaveProperty('cantidadPago');
        expect(student).toHaveProperty('fechaRegistro');
        expect(student).toHaveProperty('fechaActualizacion');
      });

      // Check specific data
      const studentNames = response.body.data.map(s => `${s.nombre} ${s.apellido}`);
      expect(studentNames).toContain('Juan Pérez');
      expect(studentNames).toContain('María García');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/students/admin')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acceso no autorizado. Debe iniciar sesión como administrador.');
    });
  });

  describe('PUT /api/students/:id', () => {
    let testStudent;

    beforeEach(async () => {
      // Create a test student for updating
      testStudent = new Student({
        nombre: 'Ana',
        apellido: 'López',
        celular: '3001234567',
        ciudad: 'Cali',
        curso: 'Sanación de las familias',
        estadoPago: 'pendiente',
        cantidadPago: 0
      });
      await testStudent.create();
    });

    it('should update student information successfully', async () => {
      const updateData = {
        nombre: 'Ana María',
        apellido: 'López Ruiz',
        celular: '3009876543',
        ciudad: 'Medellín',
        curso: 'Angelología',
        estadoPago: 'parcial',
        cantidadPago: 75000
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Estudiante actualizado exitosamente');
      expect(response.body.data).toMatchObject({
        id: testStudent.id,
        nombre: 'Ana María',
        apellido: 'López Ruiz',
        celular: '3009876543',
        ciudad: 'Medellín',
        curso: 'Angelología',
        estadoPago: 'parcial',
        cantidadPago: 75000
      });
    });

    it('should update only provided fields', async () => {
      const updateData = {
        estadoPago: 'completo',
        cantidadPago: 100000
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testStudent.id,
        nombre: 'Ana', // Should remain unchanged
        apellido: 'López', // Should remain unchanged
        celular: '3001234567', // Should remain unchanged
        ciudad: 'Cali', // Should remain unchanged
        curso: 'Sanación de las familias', // Should remain unchanged
        estadoPago: 'completo', // Should be updated
        cantidadPago: 100000 // Should be updated
      });
    });

    it('should validate payment status', async () => {
      const updateData = {
        estadoPago: 'invalid_status'
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error de validación');
      expect(response.body.errors).toContain('Estado de pago debe ser: pendiente, parcial o completo');
    });

    it('should validate payment amount', async () => {
      const updateData = {
        cantidadPago: -1000
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error de validación');
      expect(response.body.errors).toContain('La cantidad de pago no puede ser negativa');
    });

    it('should validate phone number format', async () => {
      const updateData = {
        celular: '123' // Invalid phone
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('El número celular debe tener exactamente 10 dígitos');
    });

    it('should validate course selection', async () => {
      const updateData = {
        curso: 'Curso Inválido'
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('El curso debe ser "Sanación de las familias" o "Angelología"');
    });

    it('should return 404 for non-existent student', async () => {
      const updateData = {
        estadoPago: 'completo'
      };

      const response = await authenticatedAgent
        .put('/api/students/99999')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Estudiante no encontrado');
    });

    it('should validate student ID parameter', async () => {
      const updateData = {
        estadoPago: 'completo'
      };

      const response = await authenticatedAgent
        .put('/api/students/invalid-id')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('ID de estudiante inválido');
    });

    it('should require authentication', async () => {
      const updateData = {
        estadoPago: 'completo'
      };

      const response = await request(app)
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Acceso no autorizado. Debe iniciar sesión como administrador.');
    });

    it('should clean phone number by removing non-digits', async () => {
      const updateData = {
        celular: '(300) 123-4567'
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.celular).toBe('3001234567');
    });

    it('should trim whitespace from input fields', async () => {
      const updateData = {
        nombre: '  Ana María  ',
        apellido: '  López Ruiz  ',
        ciudad: '  Medellín  ',
        curso: '  Angelología  '
      };

      const response = await authenticatedAgent
        .put(`/api/students/${testStudent.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Ana María');
      expect(response.body.data.apellido).toBe('López Ruiz');
      expect(response.body.data.ciudad).toBe('Medellín');
      expect(response.body.data.curso).toBe('Angelología');
    });
  });
});