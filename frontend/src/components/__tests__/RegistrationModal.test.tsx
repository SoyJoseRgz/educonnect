import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RegistrationModal from '../RegistrationModal';
import { studentApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  studentApi: {
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

// Mock props
const mockProps = {
  open: true,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
};

describe('RegistrationModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with all form fields when open', () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    expect(screen.getByText('Registro al Curso')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número celular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/curso/i)).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithTheme(<RegistrationModal {...mockProps} open={false} />);
    
    expect(screen.queryByText('Registro al Curso')).not.toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('El apellido es requerido')).toBeInTheDocument();
      expect(screen.getByText('El número celular es requerido')).toBeInTheDocument();
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
      expect(screen.getByText('Debe seleccionar un curso')).toBeInTheDocument();
    });

    expect(mockStudentApi.registerStudent).not.toHaveBeenCalled();
  });

  it('validates phone number format', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const phoneInput = screen.getByLabelText(/número celular/i);
    
    // Test invalid phone number
    fireEvent.change(phoneInput, { target: { value: '123' } });
    
    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El número celular debe tener exactamente 10 dígitos')).toBeInTheDocument();
    });
  });

  it('only allows numeric input for phone number', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const phoneInput = screen.getByLabelText(/número celular/i) as HTMLInputElement;
    
    fireEvent.change(phoneInput, { target: { value: 'abc123def456' } });
    
    await waitFor(() => {
      expect(phoneInput.value).toBe('123456');
    });
  });

  it('limits phone number to 10 digits', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const phoneInput = screen.getByLabelText(/número celular/i) as HTMLInputElement;
    
    // Simulate typing more than 10 digits
    fireEvent.change(phoneInput, { target: { value: '12345678901234' } });
    
    // The component should limit to 10 digits
    await waitFor(() => {
      expect(phoneInput.value.length).toBeLessThanOrEqual(10);
    });
  });

  it('has course selection field', () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const courseSelect = screen.getByLabelText(/curso/i);
    expect(courseSelect).toBeInTheDocument();
  });

  it('validates form before submission', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    // Fill only some fields
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Pérez' } });
    // Leave other fields empty

    // Submit form
    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('El número celular es requerido')).toBeInTheDocument();
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
      expect(screen.getByText('Debe seleccionar un curso')).toBeInTheDocument();
    });

    expect(mockStudentApi.registerStudent).not.toHaveBeenCalled();
  });

  it('shows form fields and buttons correctly', () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    // Check all form elements are present
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número celular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/curso/i)).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    // Submit empty form to trigger validation errors
    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });

    // Start typing in name field
    const nameInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'J' } });

    await waitFor(() => {
      expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('validates minimum length for name and apellido', async () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'B' } });

    const submitButton = screen.getByText('Registrarse');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeInTheDocument();
      expect(screen.getByText('El apellido debe tener al menos 2 caracteres')).toBeInTheDocument();
    });
  });

  it('handles form input changes correctly', () => {
    renderWithTheme(<RegistrationModal {...mockProps} />);

    const nameInput = screen.getByLabelText(/nombre/i) as HTMLInputElement;
    const phoneInput = screen.getByLabelText(/número celular/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Juan' } });
    fireEvent.change(phoneInput, { target: { value: '3001234567' } });

    expect(nameInput.value).toBe('Juan');
    expect(phoneInput.value).toBe('3001234567');
  });
});