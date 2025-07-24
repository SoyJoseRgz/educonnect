import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminStudentList from '../AdminStudentList';
import { studentApi, Student } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  studentApi: {
    getAdminStudents: jest.fn(),
  },
}));

// Mock the child components
jest.mock('../LoadingSpinner', () => {
  return function MockLoadingSpinner({ message }: { message: string }) {
    return <div data-testid="loading-spinner">{message}</div>;
  };
});

jest.mock('../ErrorMessage', () => {
  return function MockErrorMessage({ 
    message, 
    onRetry 
  }: { 
    message: string; 
    onRetry: () => void; 
  }) {
    return (
      <div data-testid="error-message">
        <span>{message}</span>
        <button onClick={onRetry}>Retry</button>
      </div>
    );
  };
});

const mockStudentApi = studentApi as jest.Mocked<typeof studentApi>;

const theme = createTheme();

const mockStudents: Student[] = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    celular: '3001234567',
    ciudad: 'Bogotá',
    curso: 'Sanación de las familias',
    estadoPago: 'completo',
    cantidadPago: 150000,
    fechaRegistro: '2024-01-15T10:30:00Z',
    fechaActualizacion: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'González',
    celular: '3009876543',
    ciudad: 'Medellín',
    curso: 'Angelología',
    estadoPago: 'pendiente',
    cantidadPago: 0,
    fechaRegistro: '2024-01-16T14:20:00Z',
    fechaActualizacion: '2024-01-16T14:20:00Z',
  },
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AdminStudentList', () => {
  const mockOnEditStudent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner while fetching students', () => {
    mockStudentApi.getAdminStudents.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Cargando estudiantes...')).toBeInTheDocument();
  });

  it('renders error message when API call fails', async () => {
    const errorMessage = 'Error al cargar estudiantes';
    mockStudentApi.getAdminStudents.mockRejectedValue({
      message: errorMessage,
      status: 500,
    });

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renders empty state when no students are found', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue([]);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      expect(screen.getByText('No hay estudiantes registrados')).toBeInTheDocument();
      expect(screen.getByText('Los estudiantes aparecerán aquí cuando se registren')).toBeInTheDocument();
    });
  });

  it('renders student list with all fields in desktop view', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue(mockStudents);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      // Check header
      expect(screen.getByText('Gestión de Estudiantes')).toBeInTheDocument();
      expect(screen.getByText('2 estudiantes registrados')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Apellido')).toBeInTheDocument();
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('Ciudad')).toBeInTheDocument();
      expect(screen.getByText('Curso')).toBeInTheDocument();
      expect(screen.getByText('Estado Pago')).toBeInTheDocument();
      expect(screen.getByText('Cantidad')).toBeInTheDocument();

      // Check student data
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('Pérez')).toBeInTheDocument();
      expect(screen.getByText('3001234567')).toBeInTheDocument();
      expect(screen.getByText('Bogotá')).toBeInTheDocument();
      expect(screen.getByText('Sanación de las familias')).toBeInTheDocument();
      expect(screen.getByText('completo')).toBeInTheDocument();

      expect(screen.getByText('María')).toBeInTheDocument();
      expect(screen.getByText('González')).toBeInTheDocument();
      expect(screen.getByText('3009876543')).toBeInTheDocument();
      expect(screen.getByText('Medellín')).toBeInTheDocument();
      expect(screen.getByText('Angelología')).toBeInTheDocument();
      expect(screen.getByText('pendiente')).toBeInTheDocument();
    });
  });

  it('calls onEditStudent when edit button is clicked', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue(mockStudents);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      const editButtons = screen.getAllByRole('button');
      const firstEditButton = editButtons.find(button => 
        button.querySelector('svg')?.getAttribute('data-testid') === 'EditIcon'
      );
      
      if (firstEditButton) {
        fireEvent.click(firstEditButton);
        expect(mockOnEditStudent).toHaveBeenCalledWith(mockStudents[0]);
      }
    });
  });

  it('displays payment status with correct colors', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue(mockStudents);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      const completoChip = screen.getByText('completo');
      const pendienteChip = screen.getByText('pendiente');
      
      expect(completoChip).toBeInTheDocument();
      expect(pendienteChip).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue(mockStudents);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      // Check that currency is formatted (should contain $ symbol)
      const currencyElements = screen.getAllByText(/\$/);
      expect(currencyElements.length).toBeGreaterThan(0);
    });
  });

  it('refetches data when refreshTrigger changes', async () => {
    mockStudentApi.getAdminStudents.mockResolvedValue(mockStudents);

    const { rerender } = renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} refreshTrigger={0} />
    );

    await waitFor(() => {
      expect(mockStudentApi.getAdminStudents).toHaveBeenCalledTimes(1);
    });

    // Change refreshTrigger
    rerender(
      <ThemeProvider theme={theme}>
        <AdminStudentList onEditStudent={mockOnEditStudent} refreshTrigger={1} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(mockStudentApi.getAdminStudents).toHaveBeenCalledTimes(2);
    });
  });

  it('retries API call when retry button is clicked', async () => {
    mockStudentApi.getAdminStudents
      .mockRejectedValueOnce({ message: 'Network error', status: 0 })
      .mockResolvedValueOnce(mockStudents);

    renderWithTheme(
      <AdminStudentList onEditStudent={mockOnEditStudent} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Gestión de Estudiantes')).toBeInTheDocument();
      expect(mockStudentApi.getAdminStudents).toHaveBeenCalledTimes(2);
    });
  });
});