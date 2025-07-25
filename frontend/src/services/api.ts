// API Service Layer for EduConnect Frontend
// Handles all HTTP requests to the backend API

export interface Student {
  id?: number;
  nombre: string;
  apellido: string;
  celular: string;
  ciudad: string;
  cursos: string[];
  estadoPago?: 'pendiente' | 'parcial' | 'completo';
  cantidadPago?: number;
  fechaRegistro?: string;
  fechaActualizacion?: string;
}

export interface PublicStudent {
  id: number;
  nombre: string;
  apellido: string;
  ciudad: string;
  celular: string;
  cursos: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface BackendValidationError {
  path: string;
  msg: string;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: BackendValidationError[];
}

class ApiService {
  private baseURL: string;

  constructor() {
    // Use proxy configuration from package.json in development
    // In production, use the full API URL
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_API_URL || '/api'
      : '/api'; // Proxy will redirect to backend on port 3500
  }

  // Generic request method with error handling, timeout, and retry logic
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retries: number = 2,
    timeout: number = 10000
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Enhanced error handling based on status codes
        let message = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        switch (response.status) {
          case 400:
            message = errorData.message || 'Datos inválidos. Verifica la información ingresada.';
            break;
          case 401:
            message = errorData.message || 'No autorizado. Verifica tus credenciales.';
            break;
          case 403:
            message = errorData.message || 'Acceso denegado.';
            break;
          case 404:
            message = errorData.message || 'Recurso no encontrado.';
            break;
          case 409:
            message = errorData.message || 'Conflicto con el estado actual del recurso.';
            break;
          case 422:
            message = errorData.message || 'Error de validación en los datos enviados.';
            break;
          case 429:
            message = 'Demasiadas solicitudes. Intenta nuevamente en unos momentos.';
            break;
          case 500:
            message = 'Error interno del servidor. Intenta nuevamente más tarde.';
            break;
          case 502:
            message = 'Error del servidor. El servicio no está disponible temporalmente.';
            break;
          case 503:
            message = 'Servicio no disponible. Intenta nuevamente más tarde.';
            break;
          case 504:
            message = 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
            break;
          default:
            message = errorData.message || 'Error inesperado. Intenta nuevamente.';
        }
        
        const error: ApiError = {
          message,
          status: response.status,
          errors: errorData.errors,
        };
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        if (retries > 0) {
          // Exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, 2 - retries), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retries - 1, timeout);
        }
        
        const timeoutError: ApiError = {
          message: 'La solicitud tardó demasiado tiempo. Verifica tu conexión a internet.',
          status: 408,
        };
        throw timeoutError;
      }
      
      // Handle network errors
      if (error instanceof TypeError && (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('Failed to fetch')
      )) {
        if (retries > 0) {
          // Exponential backoff for network errors
          const delay = Math.min(1000 * Math.pow(2, 2 - retries), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retries - 1, timeout);
        }
        
        const networkError: ApiError = {
          message: 'Error de conexión. Verifica tu conexión a internet y vuelve a intentar.',
          status: 0,
        };
        throw networkError;
      }
      
      // Handle server errors (5xx) with retry
      if (error instanceof Error && 'status' in error) {
        const apiError = error as ApiError;
        if (apiError.status >= 500 && retries > 0) {
          // Longer delay for server errors
          const delay = Math.min(2000 * Math.pow(2, 2 - retries), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retries - 1, timeout);
        }
      }
      
      // Handle rate limiting (429) with retry
      if (error instanceof Error && 'status' in error) {
        const apiError = error as ApiError;
        if (apiError.status === 429 && retries > 0) {
          // Wait longer for rate limiting
          const delay = Math.min(5000 * Math.pow(2, 2 - retries), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retries - 1, timeout);
        }
      }
      
      throw error;
    }
  }

  // Student API methods
  async getPublicStudents(): Promise<PublicStudent[]> {
    const response = await this.request<ApiResponse<PublicStudent[]>>('/students/public');
    return response.data || [];
  }

  async registerStudent(student: Omit<Student, 'id' | 'estadoPago' | 'cantidadPago' | 'fechaRegistro' | 'fechaActualizacion'>): Promise<Student> {
    const response = await this.request<ApiResponse<Student>>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    return response.data!;
  }

  async getAdminStudents(): Promise<Student[]> {
    const response = await this.request<ApiResponse<Student[]>>('/students/admin');
    return response.data || [];
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student> {
    const response = await this.request<ApiResponse<Student>>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
    return response.data!;
  }

  async deleteStudent(id: number): Promise<{ id: number }> {
    const response = await this.request<ApiResponse<{ id: number }>>(`/students/${id}`, {
      method: 'DELETE',
    });
    return response.data!;
  }

  async checkPhoneExists(celular: string): Promise<{ exists: boolean; data?: { id: number; nombre: string; apellido: string; cursos: string[] } }> {
    const response = await this.request<ApiResponse<{ exists: boolean; data?: { id: number; nombre: string; apellido: string; cursos: string[] } }>>(`/students/check-phone/${celular}`);
    return {
      exists: response.data?.exists || false,
      data: response.data?.data
    };
  }

  // Authentication API methods
  async login(credentials: LoginCredentials): Promise<void> {
    await this.request<ApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    await this.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentAdmin(): Promise<any> {
    try {
      const response = await this.request<ApiResponse>('/auth/me');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      // Don't log 401 errors for getCurrentAdmin as they're expected when not authenticated
      if (apiError.status === 401) {
        throw error; // Re-throw without logging
      }
      // Log other unexpected errors
      console.error('Unexpected error in getCurrentAdmin:', error);
      throw error;
    }
  }

  // Silent auth check method for initial app load
  async checkAuthStatus(): Promise<boolean> {
    try {
      // Use a more direct approach for auth checking
      const url = `${this.baseURL}/auth/me`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Expected when not authenticated - return false silently
        return false;
      } else {
        // Unexpected error - throw it
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
        throw error;
      }
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError: ApiError = {
          message: 'Error de conexión. Verifica tu conexión a internet.',
          status: 0,
        };
        throw networkError;
      }
      throw error;
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export individual methods for easier testing and usage
export const studentApi = {
  getPublicStudents: () => apiService.getPublicStudents(),
  registerStudent: (student: Omit<Student, 'id' | 'estadoPago' | 'cantidadPago' | 'fechaRegistro' | 'fechaActualizacion'>) =>
    apiService.registerStudent(student),
  getAdminStudents: () => apiService.getAdminStudents(),
  updateStudent: (id: number, student: Partial<Student>) =>
    apiService.updateStudent(id, student),
  deleteStudent: (id: number) => apiService.deleteStudent(id),
  checkPhoneExists: (celular: string) => apiService.checkPhoneExists(celular),
};

export const authApi = {
  login: (credentials: LoginCredentials) => apiService.login(credentials),
  logout: () => apiService.logout(),
  getCurrentAdmin: () => apiService.getCurrentAdmin(),
  checkAuthStatus: () => apiService.checkAuthStatus(),
};