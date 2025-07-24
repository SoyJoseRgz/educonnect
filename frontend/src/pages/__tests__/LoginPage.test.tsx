import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockLogin = jest.fn();
const mockClearError = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    error: null,
    clearError: mockClearError,
  }),
}));

import LoginPage from '../LoginPage';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin.mockClear();
    mockClearError.mockClear();
  });

  it('renders login form with all required elements', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    expect(screen.getByText('Ingresa tus credenciales para acceder al sistema de gestión de estudiantes')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
      expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Ingresa un correo electrónico válido')).toBeInTheDocument();
    });
  });

  it('clears field errors when user starts typing', async () => {
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    // Trigger validation error
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('El correo electrónico es requerido')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText('El correo electrónico es requerido')).not.toBeInTheDocument();
    });
  });

  it('renders back button and back icon', () => {
    renderWithProviders(<LoginPage />);
    
    expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument();
    // Check for back arrow icon button
    expect(screen.getByTestId('ArrowBackIcon')).toBeInTheDocument();
  });

  it('calls navigate when back button is clicked', () => {
    renderWithProviders(<LoginPage />);
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('calls login function when form is submitted with valid data', async () => {
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    
    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
    });
  });

  it('displays proper styling and layout', () => {
    renderWithProviders(<LoginPage />);
    
    // Check for admin icon
    expect(screen.getByTestId('AdminPanelSettingsIcon')).toBeInTheDocument();
    
    // Check for footer
    expect(screen.getByText('© 2024 EduConnect - Sistema de Gestión de Estudiantes')).toBeInTheDocument();
    
    // Check for EduConnect branding in header
    expect(screen.getByText('EduConnect')).toBeInTheDocument();
  });
});