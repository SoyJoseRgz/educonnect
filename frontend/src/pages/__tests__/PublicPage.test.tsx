import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PublicPage from '../PublicPage';
import { studentApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  studentApi: {
    getPublicStudents: jest.fn(),
    registerStudent: jest.fn(),
  },
}));

const mockStudentApi = studentApi as jest.Mocked<typeof studentApi>;

// Mock Material UI theme
const theme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock student data
const mockStudents = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    ciudad: 'Bogotá',
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'González',
    ciudad: 'Medellín',
  },
];

describe('PublicPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStudentApi.getPublicStudents.mockResolvedValue(mockStudents);
  });

  it('renders main page elements', async () => {
    renderWithTheme(<PublicPage />);

    // Check header elements
    expect(screen.getByText('EduConnect')).toBeInTheDocument();
    expect(screen.getByText('Registro al Curso')).toBeInTheDocument();
    expect(screen.getByText('Administrar Curso')).toBeInTheDocument();

    // Check welcome section
    expect(screen.getByText('Bienvenido a EduConnect')).toBeInTheDocument();
    expect(screen.getByText(/Plataforma de gestión de estudiantes/)).toBeInTheDocument();

    // Check course information
    expect(screen.getByText('Cursos Disponibles')).toBeInTheDocument();
    expect(screen.getByText('Sanación de las familias')).toBeInTheDocument();
    expect(screen.getByText('Angelología')).toBeInTheDocument();

    // Wait for student list to load
    await waitFor(() => {
      expect(screen.getByText('Estudiantes Registrados')).toBeInTheDocument();
    });

    // Check footer
    expect(screen.getByText(/© 2024 EduConnect/)).toBeInTheDocument();
  });

  it('opens registration modal when registration button is clicked', () => {
    renderWithTheme(<PublicPage />);

    const registrationButton = screen.getByText('Registro al Curso');
    fireEvent.click(registrationButton);

    // Modal should open
    expect(screen.getByText('Complete el formulario para registrarse a un curso')).toBeInTheDocument();
  });

  it('closes registration modal when cancel is clicked', () => {
    renderWithTheme(<PublicPage />);

    // Open modal
    const registrationButton = screen.getByText('Registro al Curso');
    fireEvent.click(registrationButton);

    expect(screen.getByText('Complete el formulario para registrarse a un curso')).toBeInTheDocument();

    // Close modal
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    // Modal should be closed
    expect(screen.queryByText('Complete el formulario para registrarse a un curso')).not.toBeInTheDocument();
  });

  it('displays student list with data', async () => {
    renderWithTheme(<PublicPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María González')).toBeInTheDocument();
      expect(screen.getByText('Bogotá')).toBeInTheDocument();
      expect(screen.getByText('Medellín')).toBeInTheDocument();
    });
  });

  it('handles admin button click', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    renderWithTheme(<PublicPage />);

    const adminButton = screen.getByText('Administrar Curso');
    fireEvent.click(adminButton);

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to admin login');
    
    consoleSpy.mockRestore();
  });

  it('refreshes student list after successful registration', async () => {
    mockStudentApi.registerStudent.mockResolvedValue({
      id: 3,
      nombre: 'Carlos',
      apellido: 'López',
      celular: '3001234567',
      ciudad: 'Cali',
      curso: 'Sanación de las familias',
      estadoPago: 'pendiente',
      cantidadPago: 0,
    });

    renderWithTheme(<PublicPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    expect(mockStudentApi.getPublicStudents).toHaveBeenCalledTimes(1);

    // Open registration modal
    const registrationButton = screen.getByText('Registro al Curso');
    fireEvent.click(registrationButton);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Carlos' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'López' } });
    fireEvent.change(screen.getByLabelText(/número celular/i), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Cali' } });

    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    // Wait for form submission and modal close
    await waitFor(() => {
      expect(screen.queryByText('Complete el formulario para registrarse a un curso')).not.toBeInTheDocument();
    });

    // Student list should be refreshed (called again)
    expect(mockStudentApi.getPublicStudents).toHaveBeenCalledTimes(2);
  });
});