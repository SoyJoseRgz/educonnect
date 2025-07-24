import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentAdmin: jest.fn(),
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Test component to access auth context
const TestComponent: React.FC = () => {
  const auth = useAuth();
  
  const handleLogin = async () => {
    try {
      await auth.login('test@example.com', 'password');
    } catch (error) {
      // Error is handled by the context
    }
  };
  
  return (
    <div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{auth.isLoading.toString()}</div>
      <div data-testid="error">{auth.error || 'null'}</div>
      <button 
        data-testid="login-btn" 
        onClick={handleLogin}
      >
        Login
      </button>
      <button 
        data-testid="logout-btn" 
        onClick={() => auth.logout()}
      >
        Logout
      </button>
      <button 
        data-testid="clear-error-btn" 
        onClick={() => auth.clearError()}
      >
        Clear Error
      </button>
    </div>
  );
};

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('initializes with loading state and checks authentication', async () => {
    mockAuthApi.getCurrentAdmin.mockRejectedValueOnce(new Error('Not authenticated'));
    
    renderWithAuthProvider(<TestComponent />);
    
    // Initially should be loading
    expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    
    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(mockAuthApi.getCurrentAdmin).toHaveBeenCalledTimes(1);
  });

  it('sets authenticated state when getCurrentAdmin succeeds', async () => {
    mockAuthApi.getCurrentAdmin.mockResolvedValueOnce({ id: 1, email: 'admin@example.com' });
    
    renderWithAuthProvider(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });

  it('handles successful login', async () => {
    mockAuthApi.getCurrentAdmin.mockRejectedValueOnce(new Error('Not authenticated'));
    mockAuthApi.login.mockResolvedValueOnce(undefined);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    // Perform login
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(mockAuthApi.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('handles login error with 401 status', async () => {
    mockAuthApi.getCurrentAdmin.mockRejectedValueOnce(new Error('Not authenticated'));
    const authError = { status: 401, message: 'Unauthorized' };
    mockAuthApi.login.mockRejectedValueOnce(authError);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    // Perform login
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Credenciales incorrectas. Verifica tu correo y contraseña.');
    });
    
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
  });

  it('handles login error with generic error', async () => {
    mockAuthApi.getCurrentAdmin.mockRejectedValueOnce(new Error('Not authenticated'));
    const authError = { status: 500, message: 'Server error' };
    mockAuthApi.login.mockRejectedValueOnce(authError);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    // Perform login
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Server error');
    });
    
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  it('handles successful logout', async () => {
    mockAuthApi.getCurrentAdmin.mockResolvedValueOnce({ id: 1, email: 'admin@example.com' });
    mockAuthApi.logout.mockResolvedValueOnce(undefined);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check (should be authenticated)
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    
    // Perform logout
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(mockAuthApi.logout).toHaveBeenCalledTimes(1);
  });

  it('handles logout failure gracefully', async () => {
    mockAuthApi.getCurrentAdmin.mockResolvedValueOnce({ id: 1, email: 'admin@example.com' });
    mockAuthApi.logout.mockRejectedValueOnce(new Error('Logout failed'));
    
    // Mock console.warn to avoid test output noise
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check (should be authenticated)
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });
    
    // Perform logout
    await act(async () => {
      screen.getByTestId('logout-btn').click();
    });
    
    // Should still clear local state even if server logout fails
    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
    
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    
    consoleSpy.mockRestore();
  });

  it('clears error when clearError is called', async () => {
    mockAuthApi.getCurrentAdmin.mockRejectedValueOnce(new Error('Not authenticated'));
    const authError = { status: 500, message: 'Server error' };
    mockAuthApi.login.mockRejectedValueOnce(authError);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });
    
    // Trigger error
    await act(async () => {
      screen.getByTestId('login-btn').click();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Server error');
    });
    
    // Clear error
    await act(async () => {
      screen.getByTestId('clear-error-btn').click();
    });
    
    expect(screen.getByTestId('error')).toHaveTextContent('null');
  });
});