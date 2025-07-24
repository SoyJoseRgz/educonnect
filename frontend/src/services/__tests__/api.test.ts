import { studentApi, authApi, ApiError } from '../api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiService', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

            try {
                await studentApi.getPublicStudents();
                fail('Should have thrown an error');
            } catch (error) {
                const apiError = error as ApiError;
                expect(apiError.message).toBe('Error de conexión. Verifica tu conexión a internet.');
                expect(apiError.status).toBe(0);
            }
        });

        it('should handle HTTP errors with JSON response', async () => {
            const errorResponse = {
                success: false,
                message: 'Validation failed',
                errors: ['Phone number is required']
            };

            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: jest.fn().mockResolvedValue(errorResponse)
            });

            try {
                await studentApi.getPublicStudents();
                fail('Should have thrown an error');
            } catch (error) {
                const apiError = error as ApiError;
                expect(apiError.message).toBe('Validation failed');
                expect(apiError.status).toBe(400);
                expect(apiError.errors).toEqual(['Phone number is required']);
            }
        });

        it('should handle HTTP errors without JSON response', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
            });

            try {
                await studentApi.getPublicStudents();
                fail('Should have thrown an error');
            } catch (error) {
                const apiError = error as ApiError;
                expect(apiError.message).toBe('HTTP 500: Internal Server Error');
                expect(apiError.status).toBe(500);
            }
        });
    });

    describe('Student API', () => {
        describe('getPublicStudents', () => {
            it('should fetch public students successfully', async () => {
                const mockStudents = [
                    { id: 1, nombre: 'Juan', apellido: 'Pérez', ciudad: 'Bogotá' },
                    { id: 2, nombre: 'María', apellido: 'García', ciudad: 'Medellín' }
                ];

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        data: mockStudents
                    })
                });

                const result = await studentApi.getPublicStudents();

                expect(mockFetch).toHaveBeenCalledWith('/api/students/public', {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                expect(result).toEqual(mockStudents);
            });

            it('should return empty array when no data', async () => {
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({ success: true })
                });

                const result = await studentApi.getPublicStudents();
                expect(result).toEqual([]);
            });
        });

        describe('registerStudent', () => {
            it('should register a new student successfully', async () => {
                const newStudent = {
                    nombre: 'Carlos',
                    apellido: 'López',
                    celular: '3001234567',
                    ciudad: 'Cali',
                    curso: 'Sanación de las familias'
                };

                const registeredStudent = {
                    id: 3,
                    ...newStudent,
                    estadoPago: 'pendiente',
                    cantidadPago: 0
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        data: registeredStudent
                    })
                });

                const result = await studentApi.registerStudent(newStudent);

                expect(mockFetch).toHaveBeenCalledWith('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(newStudent)
                });
                expect(result).toEqual(registeredStudent);
            });
        });

        describe('getAdminStudents', () => {
            it('should fetch admin students successfully', async () => {
                const mockStudents = [
                    {
                        id: 1,
                        nombre: 'Juan',
                        apellido: 'Pérez',
                        celular: '3001234567',
                        ciudad: 'Bogotá',
                        curso: 'Angelología',
                        estadoPago: 'completo',
                        cantidadPago: 150000
                    }
                ];

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        data: mockStudents
                    })
                });

                const result = await studentApi.getAdminStudents();

                expect(mockFetch).toHaveBeenCalledWith('/api/students/admin', {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                expect(result).toEqual(mockStudents);
            });
        });

        describe('updateStudent', () => {
            it('should update student successfully', async () => {
                const studentId = 1;
                const updateData = {
                    estadoPago: 'parcial' as const,
                    cantidadPago: 75000
                };

                const updatedStudent = {
                    id: studentId,
                    nombre: 'Juan',
                    apellido: 'Pérez',
                    celular: '3001234567',
                    ciudad: 'Bogotá',
                    curso: 'Angelología',
                    ...updateData
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        data: updatedStudent
                    })
                });

                const result = await studentApi.updateStudent(studentId, updateData);

                expect(mockFetch).toHaveBeenCalledWith('/api/students/1', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(updateData)
                });
                expect(result).toEqual(updatedStudent);
            });
        });
    });

    describe('Auth API', () => {
        describe('login', () => {
            it('should login successfully', async () => {
                const credentials = {
                    email: 'admin@example.com',
                    password: 'password123'
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({ success: true })
                });

                await authApi.login(credentials);

                expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(credentials)
                });
            });
        });

        describe('logout', () => {
            it('should logout successfully', async () => {
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({ success: true })
                });

                await authApi.logout();

                expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
            });
        });

        describe('getCurrentAdmin', () => {
            it('should get current admin successfully', async () => {
                const adminData = {
                    id: 1,
                    email: 'admin@example.com'
                };

                mockFetch.mockResolvedValue({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        success: true,
                        data: adminData
                    })
                });

                const result = await authApi.getCurrentAdmin();

                expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                expect(result).toEqual(adminData);
            });
        });
    });

    describe('Request Configuration', () => {
        it('should include credentials in all requests', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true, data: [] })
            });

            await studentApi.getPublicStudents();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    credentials: 'include'
                })
            );
        });

        it('should set Content-Type header for all requests', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true, data: [] })
            });

            await studentApi.getPublicStudents();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });
    });
});