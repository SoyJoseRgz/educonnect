import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminPage from '../AdminPage';
import { authApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  authApi: {
    logout: jest.fn(),
  },
}));

// Mock the child components
jest.mock('../../components/AdminStudentList', () => {
  return function MockAdminStudentList({ 
    onEditStudent, 
    refreshTrigger 
  }: { 
    onEditStudent: (student: any) => void; 
    refreshTrigger: number; 
  }) {
    return (
      <div data-testid="admin-student-list">
        <span>Admin Student List - Refresh: {refreshTrigger}</span>
        <button 
          onClick={() => onEditStudent({ id: 1, nombre: 'Test', apellido: 'Student' })}
        >
          Edit Student
        </button>
      </div>
    );
  };
});

jest.mock('../../components/EditStudentModal', () => {
  return function MockEditStudentModal({ 
    open, 
    student, 
    onClose, 
    onSuccess 
  }: { 
    open: boolean; 
    student: any; 
    onClose: () => void; 
    onSuccess: () => void; 
  }) {
    if (!open) return null;
    return (
      <div data-testid="edit-student-modal">
        <span>Edit Student Modal - {student?.nombre}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Save</button>
      </div>
    );
  };
});

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AdminPage', () => {
  const mockOnLogout = jest.fn();
  const mockOnNavigateHome = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders admin page with header and student list', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    expect(screen.getByText('EduConnect - Panel de Administración')).toBeInTheDocument();
    expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
    expect(screen.getByText('Gestiona la información completa de los estudiantes registrados en los cursos')).toBeInTheDocument();
    expect(screen.getByTestId('admin-student-list')).toBeInTheDocument();
  });

  it('shows navigation buttons in header', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    expect(screen.getByText('Vista Pública')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument();
  });

  it('calls onNavigateHome when Vista Pública button is clicked', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    const homeButton = screen.getByText('Vista Pública');
    fireEvent.click(homeButton);

    expect(mockOnNavigateHome).toHaveBeenCalled();
  });

  it('calls logout API and onLogout when Cerrar Sesión button is clicked', async () => {
    mockAuthApi.logout.mockResolvedValue();

    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthApi.logout).toHaveBeenCalled();
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  it('shows loading state during logout', async () => {
    mockAuthApi.logout.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    expect(screen.getByText('Cerrando...')).toBeInTheDocument();
    expect(logoutButton).toBeDisabled();
  });

  it('handles logout error', async () => {
    const errorMessage = 'Error al cerrar sesión';
    mockAuthApi.logout.mockRejectedValue({
      message: errorMessage,
      status: 500,
    });

    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    const logoutButton = screen.getByText('Cerrar Sesión');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnLogout).not.toHaveBeenCalled();
    });
  });

  it('opens edit modal when student is selected for editing', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    const editButton = screen.getByText('Edit Student');
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-student-modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Student Modal - Test')).toBeInTheDocument();
  });

  it('closes edit modal when close button is clicked', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    // Open modal
    const editButton = screen.getByText('Edit Student');
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-student-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('edit-student-modal')).not.toBeInTheDocument();
  });

  it('refreshes student list and shows success message when edit is successful', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    // Check initial refresh trigger
    expect(screen.getByText('Admin Student List - Refresh: 0')).toBeInTheDocument();

    // Open modal
    const editButton = screen.getByText('Edit Student');
    fireEvent.click(editButton);

    // Save changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Check that modal is closed and refresh trigger is incremented
    expect(screen.queryByTestId('edit-student-modal')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Student List - Refresh: 1')).toBeInTheDocument();
    expect(screen.getByText('Estudiante actualizado exitosamente')).toBeInTheDocument();
  });

  it('closes snackbar when close button is clicked', async () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    // Trigger success message
    const editButton = screen.getByText('Edit Student');
    fireEvent.click(editButton);
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    expect(screen.getByText('Estudiante actualizado exitosamente')).toBeInTheDocument();

    // Close snackbar
    const closeSnackbarButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeSnackbarButton);

    await waitFor(() => {
      expect(screen.queryByText('Estudiante actualizado exitosamente')).not.toBeInTheDocument();
    });
  });

  it('renders footer with correct text', () => {
    renderWithTheme(
      <AdminPage 
        onLogout={mockOnLogout} 
        onNavigateHome={mockOnNavigateHome} 
      />
    );

    expect(screen.getByText('© 2024 EduConnect - Panel de Administración')).toBeInTheDocument();
  });
});