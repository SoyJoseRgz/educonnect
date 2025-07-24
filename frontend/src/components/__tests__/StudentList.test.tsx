import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StudentList from '../StudentList';
import { studentApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  studentApi: {
    getPublicStudents: jest.fn(),
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
  {
    id: 3,
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    ciudad: 'Cali',
  },
];

describe('StudentList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    mockStudentApi.getPublicStudents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithTheme(<StudentList />);
    
    expect(screen.getByText('Cargando lista de estudiantes...')).toBeInTheDocument();
  });

  it('renders student list when data is loaded successfully', async () => {
    mockStudentApi.getPublicStudents.mockResolvedValue(mockStudents);

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('Estudiantes Registrados')).toBeInTheDocument();
    });

    expect(screen.getByText('3 estudiantes registrados')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María González')).toBeInTheDocument();
    expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.getByText('Cali')).toBeInTheDocument();
  });

  it('renders empty state when no students are found', async () => {
    mockStudentApi.getPublicStudents.mockResolvedValue([]);

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('No hay estudiantes registrados')).toBeInTheDocument();
    });

    expect(screen.getByText('Sé el primero en registrarte a un curso')).toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    const errorMessage = 'Error de conexión';
    mockStudentApi.getPublicStudents.mockRejectedValue({
      message: errorMessage,
      status: 500,
    });

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar estudiantes')).toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Recargar lista')).toBeInTheDocument();
  });

  it('retries loading when retry button is clicked', async () => {
    const errorMessage = 'Error de conexión';
    mockStudentApi.getPublicStudents
      .mockRejectedValueOnce({
        message: errorMessage,
        status: 500,
      })
      .mockResolvedValueOnce(mockStudents);

    renderWithTheme(<StudentList />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Error al cargar estudiantes')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Recargar lista');
    fireEvent.click(retryButton);

    // Wait for successful load
    await waitFor(() => {
      expect(screen.getByText('Estudiantes Registrados')).toBeInTheDocument();
    });

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(mockStudentApi.getPublicStudents).toHaveBeenCalledTimes(2);
  });

  it('refreshes data when refreshTrigger prop changes', async () => {
    mockStudentApi.getPublicStudents.mockResolvedValue(mockStudents);

    const { rerender } = renderWithTheme(<StudentList refreshTrigger={0} />);

    await waitFor(() => {
      expect(screen.getByText('Estudiantes Registrados')).toBeInTheDocument();
    });

    expect(mockStudentApi.getPublicStudents).toHaveBeenCalledTimes(1);

    // Change refreshTrigger prop
    rerender(
      <ThemeProvider theme={theme}>
        <StudentList refreshTrigger={1} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockStudentApi.getPublicStudents).toHaveBeenCalledTimes(2);
    });
  });

  it('displays correct singular/plural text for student count', async () => {
    // Test with single student
    mockStudentApi.getPublicStudents.mockResolvedValue([mockStudents[0]]);

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('1 estudiante registrado')).toBeInTheDocument();
    });
  });

  it('displays student cards with proper styling and icons', async () => {
    mockStudentApi.getPublicStudents.mockResolvedValue([mockStudents[0]]);

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    // Check that the student name and city are displayed
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Bogotá')).toBeInTheDocument();
    
    // Check that the summary footer is displayed
    expect(screen.getByText(/¡Únete a nuestra comunidad de aprendizaje!/)).toBeInTheDocument();
    expect(screen.getByText(/Ya somos 1 estudiantes/)).toBeInTheDocument();
  });

  it('handles network errors appropriately', async () => {
    mockStudentApi.getPublicStudents.mockRejectedValue({
      message: 'Error de conexión. Verifica tu conexión a internet.',
      status: 0,
    });

    renderWithTheme(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión. Verifica tu conexión a internet.')).toBeInTheDocument();
    });
  });
});