import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { authApi, ApiError } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      const isAuthenticated = await authApi.checkAuthStatus();
      setAuthState(prev => ({
        ...prev,
        isAuthenticated,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // Log unexpected errors (401s are handled silently in checkAuthStatus)
      console.warn('Unexpected error checking auth status:', error);

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await authApi.login({ email, password });
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const apiError = error as ApiError;
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: apiError.status === 401
          ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
          : apiError.message || 'Error al iniciar sesión. Intenta nuevamente.',
      }));
      throw error; // Re-throw to allow component-level handling
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      await authApi.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.warn('Logout request failed:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const contextValue: AuthContextType = useMemo(() => ({
    ...authState,
    login,
    logout,
    clearError,
  }), [authState, login, logout, clearError]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};