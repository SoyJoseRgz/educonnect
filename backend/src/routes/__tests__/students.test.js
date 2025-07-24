const request = require('supertest');
const app = require('../../../server');
const testDbInit = require('../../database/testInit');
const Student = require('../../models/Student');

describe('Student Routes - Public Endpoints', () => {
  beforeAll(async () => {
    // Initialize test database
    await testDbInit.initialize();
  });

  beforeEach(async () => {
    // Clear students table before each test
    await testDbInit.clearTables();
  });

  afterAll(async () => {
    // Clean up after tests
    await testDbInit.close();
  });

  describe('GET /api/students/public', () => {
    it('should return empty array when no students exist', async () => {
      const response = await request(app)
        .get('/api/students/public')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should return students with only name and city', async () => {
      // Create test students
      const student1 = new Student({
        nombre: 'Juan',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias'
      });
      await student1.create();

      const student2 = new Student({
        nombre: 'María',
        apellido: 'García',
        celular: '3109876543',
        ciudad: 'Medellín',
        curso: 'Angelología'
      });
      await student2.create();

      const response = await request(app)
        .get('/api/students/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
      
      // Check that only name and city are returned
      response.body.data.forEach(student => {
        expect(student).toHaveProperty('id');
        expect(student).toHaveProperty('nombre');
        expect(student).toHaveProperty('ciudad');
        expect(student).not.toHaveProperty('celular');
        expect(student).not.toHaveProperty('estadoPago');
        expect(student).not.toHaveProperty('cantidadPago');
      });

      // Check specific data (order may vary, so check both students exist)
      const names = response.body.data.map(s => s.nombre);
      const cities = response.body.data.map(s => s.ciudad);
      
      expect(names).toContain('María García');
      expect(names).toContain('Juan Pérez');
      expect(cities).toContain('Medellín');
      expect(cities).toContain('Bogotá');
    });
  });

  describe('POST /api/students', () => {
    it('should register a new student successfully', async () => {
      const studentData = {
        nombre: 'Ana',
        apellido: 'López',
        celular: '3001234567',
        ciudad: 'Cali',
        curso: 'Sanación de las familias'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Estudiante registrado exitosamente');
      expect(response.body.data).toMatchObject({
        nombre: 'Ana',
        apellido: 'López',
        celular: '3001234567',
        ciudad: 'Cali',
        curso: 'Sanación de las familias',
        estadoPago: 'pendiente',
        cantidadPago: 0
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('fechaRegistro');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error de validación');
      expect(response.body.errors).toContain('El nombre es requerido');
      expect(response.body.errors).toContain('El apellido es requerido');
      expect(response.body.errors).toContain('El número celular es requerido');
      expect(response.body.errors).toContain('La ciudad es requerida');
      expect(response.body.errors).toContain('El curso es requerido');
    });

    it('should validate phone number format', async () => {
      const studentData = {
        nombre: 'Ana',
        apellido: 'López',
        celular: '123', // Invalid phone
        ciudad: 'Cali',
        curso: 'Sanación de las familias'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('El número celular debe tener exactamente 10 dígitos');
    });

    it('should validate course selection', async () => {
      const studentData = {
        nombre: 'Ana',
        apellido: 'López',
        celular: '3001234567',
        ciudad: 'Cali',
        curso: 'Curso Inválido'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain('El curso debe ser "Sanación de las familias" o "Angelología"');
    });

    it('should clean phone number by removing non-digits', async () => {
      const studentData = {
        nombre: 'Ana',
        apellido: 'López',
        celular: '(300) 123-4567',
        ciudad: 'Cali',
        curso: 'Angelología'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.celular).toBe('3001234567');
    });

    it('should trim whitespace from input fields', async () => {
      const studentData = {
        nombre: '  Ana  ',
        apellido: '  López  ',
        celular: '3001234567',
        ciudad: '  Cali  ',
        curso: '  Sanación de las familias  '
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nombre).toBe('Ana');
      expect(response.body.data.apellido).toBe('López');
      expect(response.body.data.ciudad).toBe('Cali');
      expect(response.body.data.curso).toBe('Sanación de las familias');
    });
  });
});