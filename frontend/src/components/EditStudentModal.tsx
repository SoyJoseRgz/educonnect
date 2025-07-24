import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { studentApi, Student, ApiError } from '../services/api';
import { ValidationUtils } from '../utils/validation';
import { useNotification } from '../contexts/NotificationContext';
import type { ValidationResult } from '../utils/validation';

// Definición local por si hay problemas con la importación
interface LocalValidationResult {
  isValid: boolean;
  message?: string;
}

interface EditStudentModalProps {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh student list
}

interface FormData {
  nombre: string;
  apellido: string;
  celular: string;
  ciudad: string;
  curso: string;
  estadoPago: 'pendiente' | 'parcial' | 'completo';
  cantidadPago: string; // Keep as string for input handling
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  celular?: string;
  ciudad?: string;
  curso?: string;
  estadoPago?: string;
  cantidadPago?: string;
}

const COURSES = [
  'Sanación de las familias',
  'Angelología',
];

const PAYMENT_STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'completo', label: 'Completo' },
];

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  open,
  student,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    celular: '',
    ciudad: '',
    curso: '',
    estadoPago: 'pendiente',
    cantidadPago: '0',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { showSuccess, showError } = useNotification();

  // Initialize form data when student prop changes
  useEffect(() => {
    if (student && open) {
      setFormData({
        nombre: student.nombre || '',
        apellido: student.apellido || '',
        celular: student.celular || '',
        ciudad: student.ciudad || '',
        curso: student.curso || '',
        estadoPago: student.estadoPago || 'pendiente',
        cantidadPago: (student.cantidadPago || 0).toString(),
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [student, open]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate nombre using utility
    const nombreValidation = ValidationUtils.validateName(formData.nombre, 'El nombre');
    if (!nombreValidation.isValid) {
      newErrors.nombre = nombreValidation.message;
    }

    // Validate apellido using utility
    const apellidoValidation = ValidationUtils.validateName(formData.apellido, 'El apellido');
    if (!apellidoValidation.isValid) {
      newErrors.apellido = apellidoValidation.message;
    }

    // Validate celular using utility
    const celularValidation = ValidationUtils.validatePhoneNumber(formData.celular);
    if (!celularValidation.isValid) {
      newErrors.celular = celularValidation.message;
    }

    // Validate ciudad using utility
    const ciudadValidation = ValidationUtils.validateCity(formData.ciudad);
    if (!ciudadValidation.isValid) {
      newErrors.ciudad = ciudadValidation.message;
    }

    // Validate curso using utility
    const cursoValidation = ValidationUtils.validateCourse(formData.curso);
    if (!cursoValidation.isValid) {
      newErrors.curso = cursoValidation.message;
    }

    // Validate estadoPago using utility
    const estadoValidation = ValidationUtils.validatePaymentStatus(formData.estadoPago);
    if (!estadoValidation.isValid) {
      newErrors.estadoPago = estadoValidation.message;
    }

    // Validate cantidadPago using utility
    const cantidadValidation = ValidationUtils.validatePaymentAmount(formData.cantidadPago);
    if (!cantidadValidation.isValid) {
      newErrors.cantidadPago = cantidadValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = event.target.value;
    
    // Apply real-time sanitization based on field type
    if (field === 'celular') {
      value = ValidationUtils.sanitizePhoneInput(value);
    } else if (field === 'nombre' || field === 'apellido' || field === 'ciudad') {
      value = ValidationUtils.sanitizeNameInput(value);
    } else if (field === 'cantidadPago') {
      value = ValidationUtils.sanitizeAmountInput(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Real-time validation feedback for better UX
    if (value.trim() !== '') {
      let validation: ValidationResult | LocalValidationResult | undefined;
      switch (field) {
        case 'nombre':
          validation = ValidationUtils.validateName(value, 'El nombre');
          break;
        case 'apellido':
          validation = ValidationUtils.validateName(value, 'El apellido');
          break;
        case 'celular':
          validation = ValidationUtils.validatePhoneNumber(value);
          break;
        case 'ciudad':
          validation = ValidationUtils.validateCity(value);
          break;
        case 'cantidadPago':
          validation = ValidationUtils.validatePaymentAmount(value);
          break;
        default:
          validation = undefined;
      }
      
      if (validation && !validation.isValid) {
        // Usamos el operador de aserción no nulo (!) para indicar a TypeScript que estamos seguros de que validation.message no será undefined
        setErrors(prev => ({ ...prev, [field]: validation!.message || 'Error de validación' }));
      }
    }
  };

  const handleSelectChange = (field: 'curso' | 'estadoPago') => (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm() || !student?.id) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const updateData: Partial<Student> = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        celular: formData.celular.trim(),
        ciudad: formData.ciudad.trim(),
        curso: formData.curso,
        estadoPago: formData.estadoPago,
        cantidadPago: parseFloat(formData.cantidadPago),
      };

      await studentApi.updateStudent(student.id, updateData);
      
      // Show success notification
      showSuccess(
        `Información de ${formData.nombre} ${formData.apellido} actualizada correctamente.`,
        'Estudiante Actualizado'
      );
      
      // Close modal and trigger refresh
      handleClose();
      onSuccess();
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Error al actualizar estudiante';
      setSubmitError(errorMessage);
      
      // Show notification for specific error types
      if (apiError.status === 401) {
        showError(
          'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          'Sesión Expirada'
        );
      } else if (apiError.status === 0 || errorMessage.toLowerCase().includes('conexión')) {
        showError(
          'No se pudo actualizar la información debido a problemas de conexión. Intenta nuevamente.',
          'Error de Conexión'
        );
      } else if (apiError.status >= 500) {
        showError(
          'Error del servidor. La actualización no se pudo completar. Intenta nuevamente en unos minutos.',
          'Error del Servidor'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  if (!student) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: { borderRadius: 2 }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6" component="div">
              Editar Estudiante
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Modifique la información del estudiante {student.nombre} {student.apellido}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={3}>
            {/* Nombre */}
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={handleInputChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
              fullWidth
              disabled={loading}
              slotProps={{
                htmlInput: { maxLength: 50 }
              }}
            />

            {/* Apellido */}
            <TextField
              label="Apellido"
              value={formData.apellido}
              onChange={handleInputChange('apellido')}
              error={!!errors.apellido}
              helperText={errors.apellido}
              required
              fullWidth
              disabled={loading}
              slotProps={{
                htmlInput: { maxLength: 50 }
              }}
            />

            {/* Celular */}
            <TextField
              label="Número Celular"
              value={formData.celular}
              onChange={handleInputChange('celular')}
              error={!!errors.celular}
              helperText={errors.celular || 'Ingrese exactamente 10 dígitos'}
              required
              fullWidth
              disabled={loading}
              placeholder="3001234567"
              slotProps={{
                htmlInput: { 
                  maxLength: 10,
                  pattern: '[0-9]*',
                  inputMode: 'numeric'
                }
              }}
            />

            {/* Ciudad */}
            <TextField
              label="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange('ciudad')}
              error={!!errors.ciudad}
              helperText={errors.ciudad}
              required
              fullWidth
              disabled={loading}
              slotProps={{
                htmlInput: { maxLength: 50 }
              }}
            />

            {/* Curso */}
            <FormControl fullWidth required error={!!errors.curso} disabled={loading}>
              <InputLabel>Curso</InputLabel>
              <Select
                value={formData.curso}
                onChange={handleSelectChange('curso')}
                label="Curso"
              >
                {COURSES.map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </Select>
              {errors.curso && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.curso}
                </Typography>
              )}
            </FormControl>

            {/* Estado de Pago */}
            <FormControl fullWidth required error={!!errors.estadoPago} disabled={loading}>
              <InputLabel>Estado de Pago</InputLabel>
              <Select
                value={formData.estadoPago}
                onChange={handleSelectChange('estadoPago')}
                label="Estado de Pago"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.estadoPago && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.estadoPago}
                </Typography>
              )}
            </FormControl>

            {/* Cantidad de Pago */}
            <TextField
              label="Cantidad Pagada"
              value={formData.cantidadPago}
              onChange={handleInputChange('cantidadPago')}
              error={!!errors.cantidadPago}
              helperText={errors.cantidadPago}
              required
              fullWidth
              disabled={loading}
              placeholder="0"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  inputMode: 'decimal',
                  pattern: '[0-9]*\\.?[0-9]*'
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditStudentModal;