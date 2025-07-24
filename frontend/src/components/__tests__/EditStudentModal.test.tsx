import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditStudentModal from '../EditStudentModal';
import { studentApi, Student } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  studentApi: {
    updateStudent: jest.fn(),
  },
}));

const mockStudentApi = studentApi as jest.Mocked<typeof studentApi>;

const theme = createTheme();

const mockStudent: Student = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  celular: '3001234567',
  ciudad: 'Bogotá',
  curso: 'Sanación de las familias',
  estadoPago: 'pendiente',
  cantidadPago: 50000,
  fechaRegistro: '2024-01-15T10:30:00Z',
  fechaActualizacion: '2024-01-15T10:30:00Z',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('EditStudentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open with student data', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Editar Estudiante')).toBeInTheDocument();
    expect(screen.getByText(/Modifique la información del estudiante Juan Pérez/)).toBeInTheDocument();
    
    // Check that form fields are populated
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3001234567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bogotá')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
  });

  it('does not render when student is null', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={null}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Editar Estudiante')).not.toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    renderWithTheme(
      <EditStudentModal
        open={false}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Editar Estudiante')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear required fields
    const nombreField = screen.getByLabelText(/Nombre/);
    const apellidoField = screen.getByLabelText(/Apellido/);
    const celularField = screen.getByLabelText(/Número Celular/);
    const ciudadField = screen.getByLabelText(/Ciudad/);

    fireEvent.change(nombreField, { target: { value: '' } });
    fireEvent.change(apellidoField, { target: { value: '' } });
    fireEvent.change(celularField, { target: { value: '' } });
    fireEvent.change(ciudadField, { target: { value: '' } });

    // Submit form
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      expect(screen.getByText('El apellido es requerido')).toBeInTheDocument();
      expect(screen.getByText('El número celular es requerido')).toBeInTheDocument();
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument();
    });

    // API should not be called
    expect(mockStudentApi.updateStudent).not.toHaveBeenCalled();
  });

  it('validates phone number format', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const celularField = screen.getByLabelText(/Número Celular/);
    
    // Test invalid phone number
    fireEvent.change(celularField, { target: { value: '123' } });
    
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('El número celular debe tener exactamente 10 dígitos')).toBeInTheDocument();
    });
  });

  it('validates payment amount', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cantidadField = screen.getByLabelText(/Cantidad Pagada/);
    
    // Clear the field first, then set invalid amount
    fireEvent.change(cantidadField, { target: { value: '' } });
    fireEvent.change(cantidadField, { target: { value: '-100' } });
    
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('La cantidad debe ser un número válido mayor o igual a 0')).toBeInTheDocument();
    });
  });

  it('shows payment status options', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Find the select by role and click it
    const estadoPagoSelect = screen.getAllByRole('combobox')[1]; // Second combobox is payment status
    fireEvent.mouseDown(estadoPagoSelect);

    // Wait for options to appear and check for specific option elements
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(option => option.textContent);
      expect(optionTexts).toContain('Pendiente');
      expect(optionTexts).toContain('Parcial');
      expect(optionTexts).toContain('Completo');
    });
  });

  it('shows course options', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Find the select by role and click it
    const cursoSelect = screen.getAllByRole('combobox')[0]; // First combobox is course
    fireEvent.mouseDown(cursoSelect);

    // Wait for options to appear and check for specific option elements
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      const optionTexts = options.map(option => option.textContent);
      expect(optionTexts).toContain('Sanación de las familias');
      expect(optionTexts).toContain('Angelología');
    });
  });

  it('formats currency in helper text', async () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnSuccess}
        onSuccess={mockOnSuccess}
      />
    );

    const cantidadField = screen.getByLabelText(/Cantidad Pagada/);
    fireEvent.change(cantidadField, { target: { value: '100000' } });

    await waitFor(() => {
      // Should show formatted currency in helper text
      expect(screen.getByText(/Equivale a:/)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockStudentApi.updateStudent.mockResolvedValue({
      ...mockStudent,
      nombre: 'Juan Carlos',
      cantidadPago: 75000,
      estadoPago: 'parcial',
    });

    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Modify some fields
    const nombreField = screen.getByLabelText(/Nombre/);
    const cantidadField = screen.getByLabelText(/Cantidad Pagada/);
    
    fireEvent.change(nombreField, { target: { value: 'Juan Carlos' } });
    fireEvent.change(cantidadField, { target: { value: '75000' } });

    // Change payment status
    const estadoPagoSelect = screen.getAllByRole('combobox')[1]; // Second combobox is payment status
    fireEvent.mouseDown(estadoPagoSelect);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.some(option => option.textContent === 'Parcial')).toBe(true);
    });
    
    const parcialOption = screen.getAllByRole('option').find(option => option.textContent === 'Parcial');
    fireEvent.click(parcialOption!);

    // Submit form
    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStudentApi.updateStudent).toHaveBeenCalledWith(1, {
        nombre: 'Juan Carlos',
        apellido: 'Pérez',
        celular: '3001234567',
        ciudad: 'Bogotá',
        curso: 'Sanación de las familias',
        estadoPago: 'parcial',
        cantidadPago: 75000,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles API error during submission', async () => {
    const errorMessage = 'Error al actualizar estudiante';
    mockStudentApi.updateStudent.mockRejectedValue({
      message: errorMessage,
      status: 500,
    });

    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('closes modal when close button is clicked', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Find the close button by its icon
    const closeButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when cancel button is clicked', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    mockStudentApi.updateStudent.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Guardar Cambios');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('only allows numeric input for phone number', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const celularField = screen.getByLabelText(/Número Celular/);
    
    // Try to input non-numeric characters
    fireEvent.change(celularField, { target: { value: 'abc123def456' } });
    
    // Should only keep numeric characters
    expect(celularField).toHaveValue('123456');
  });

  it('only allows valid decimal input for payment amount', () => {
    renderWithTheme(
      <EditStudentModal
        open={true}
        student={mockStudent}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cantidadField = screen.getByLabelText(/Cantidad Pagada/);
    
    // Try to input invalid characters
    fireEvent.change(cantidadField, { target: { value: 'abc123.45def' } });
    
    // Should only keep valid decimal format
    expect(cantidadField).toHaveValue('50000'); // Should remain unchanged
  });
});