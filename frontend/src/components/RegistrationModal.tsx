import React, { useState } from 'react';
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
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
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

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback to refresh student list
}

interface FormData {
  nombre: string;
  apellido: string;
  celular: string;
  ciudad: string;
  curso: string;
}

interface FormErrors {
  nombre?: string;
  apellido?: string;
  celular?: string;
  ciudad?: string;
  curso?: string;
}

const COURSES = [
  'Sanación de las familias',
  'Angelología',
];

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    celular: '',
    ciudad: '',
    curso: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
        default:
          validation = undefined;
      }

      if (validation && !validation.isValid) {
        // Usamos el operador de aserción no nulo (!) para indicar a TypeScript que estamos seguros de que validation.message no será undefined
        setErrors(prev => ({ ...prev, [field]: validation!.message || 'Error de validación' }));
      }
    }
  };

  const handleCourseChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, curso: value }));

    // Clear error for curso field
    if (errors.curso) {
      setErrors(prev => ({ ...prev, curso: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const studentData: Omit<Student, 'id' | 'estadoPago' | 'cantidadPago' | 'fechaRegistro' | 'fechaActualizacion'> = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        celular: formData.celular.trim(),
        ciudad: formData.ciudad.trim(),
        curso: formData.curso,
      };

      await studentApi.registerStudent(studentData);

      // Show success notification
      showSuccess(
        `¡Registro exitoso! Bienvenido ${formData.nombre} ${formData.apellido} al curso de ${formData.curso}.`,
        'Estudiante Registrado'
      );

      // Reset form and close modal
      handleClose();
      onSuccess(); // Trigger refresh of student list
    } catch (error) {
      const apiError = error as ApiError;

      // 1. Manejar errores de validación específicos del backend (ej. status 400 o 422)
      if (apiError.errors && Array.isArray(apiError.errors) && apiError.errors.length > 0) {
        const newErrors: FormErrors = {};
        apiError.errors.forEach(err => {
          // Aseguramos que el 'path' del error del backend coincida con un campo del formulario
          if (Object.keys(formData).includes(err.path)) {
            newErrors[err.path as keyof FormErrors] = err.msg;
          }
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        showError('Por favor, corrige los errores indicados en el formulario.', 'Error de Validación');
      } else {
        // 2. Manejar otros errores genéricos de la API con una notificación
        const errorMessage = apiError.message || 'Ocurrió un error inesperado al registrar. Intenta nuevamente.';
        showError(errorMessage, 'Error de Registro');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form data
      setFormData({
        nombre: '',
        apellido: '',
        celular: '',
        ciudad: '',
        curso: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isMobile ? false : "sm"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: isMobile ? 'none' : '1px solid #e5e5e5',
            margin: isMobile ? 0 : 'auto',
            maxHeight: isMobile ? '100vh' : '90vh',
            height: isMobile ? '100vh' : 'auto',
            width: isMobile ? '100vw' : 'auto'
          }
        }
      }}
    >
      <DialogTitle sx={{
        pb: isMobile ? 1 : 2,
        pt: isMobile ? 2 : 3,
        px: isMobile ? 2 : 3
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={isMobile ? 1 : 1.5}>
            <Box
              sx={{
                backgroundColor: '#4285f4',
                borderRadius: isMobile ? '8px' : '12px',
                p: isMobile ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PersonAddIcon sx={{
                color: 'white',
                fontSize: isMobile ? '1rem' : '1.25rem'
              }} />
            </Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="div"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                fontSize: isMobile ? '1.125rem' : '1.5rem'
              }}
            >
              Registro al Curso
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            size="small"
            sx={{
              backgroundColor: '#f5f5f5',
              borderRadius: isMobile ? '8px' : '10px',
              p: isMobile ? 0.5 : 1,
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: isMobile ? '1rem' : '1.125rem' }} />
          </IconButton>
        </Box>
        {!isMobile && (
          <Typography variant="body1" sx={{ mt: 2, color: '#666666', fontSize: '1rem' }}>
            Complete el formulario para registrarse a un curso
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{
          pt: isMobile ? 1 : 3,
          px: isMobile ? 2 : 3,
          pb: isMobile ? 1 : 2,
          flex: isMobile ? 1 : 'none',
          overflow: isMobile ? 'auto' : 'visible'
        }}>
          <Box
            display="flex"
            flexDirection="column"
            gap={isMobile ? 2 : 3}
            sx={{
              height: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'flex-start' : 'normal'
            }}
          >
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
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  marginTop: isMobile ? '4px' : '8px',
                },
              }}
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
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  marginTop: isMobile ? '4px' : '8px',
                },
              }}
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
              helperText={errors.celular || (isMobile ? '10 dígitos' : 'Ingrese exactamente 10 dígitos')}
              required
              fullWidth
              disabled={loading}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              placeholder="1234567890"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  marginTop: isMobile ? '4px' : '8px',
                },
              }}
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
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  marginTop: isMobile ? '4px' : '8px',
                },
              }}
              slotProps={{
                htmlInput: { maxLength: 50 }
              }}
            />

            {/* Curso */}
            <FormControl
              fullWidth
              required
              error={!!errors.curso}
              disabled={loading}
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: isMobile ? '8px' : '12px',
                  backgroundColor: '#fafafa',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  marginTop: isMobile ? '4px' : '8px',
                },
              }}
            >
              <InputLabel>Curso</InputLabel>
              <Select
                value={formData.curso}
                onChange={handleCourseChange}
                label="Curso"
              >
                {COURSES.map((course) => (
                  <MenuItem
                    key={course}
                    value={course}
                    sx={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      py: isMobile ? 1 : 1.5,
                    }}
                  >
                    {course}
                  </MenuItem>
                ))}
              </Select>
              {errors.curso && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    mt: isMobile ? 0.25 : 0.5,
                    ml: 1.5,
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                >
                  {errors.curso}
                </Typography>
              )}
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 3,
          pt: isMobile ? 1 : 2,
          gap: isMobile ? 1.5 : 2,
          flexDirection: isMobile ? 'column' : 'row',
          '& > *': {
            width: isMobile ? '100%' : 'auto'
          }
        }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={isMobile ? 16 : 20} color="inherit" /> : <PersonAddIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{
              backgroundColor: '#4285f4',
              borderRadius: isMobile ? '8px' : '12px',
              textTransform: 'none',
              fontWeight: 500,
              px: isMobile ? 3 : 4,
              py: isMobile ? 1.25 : 1.5,
              fontSize: isMobile ? '0.875rem' : '1rem',
              boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
              order: isMobile ? 1 : 2,
              '&:hover': {
                backgroundColor: '#3367d6',
                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
              },
              '&:disabled': {
                backgroundColor: '#cccccc',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size={isMobile ? "medium" : "large"}
            sx={{
              borderRadius: isMobile ? '8px' : '12px',
              borderColor: '#e0e0e0',
              color: '#666666',
              textTransform: 'none',
              fontWeight: 500,
              px: isMobile ? 3 : 3,
              py: isMobile ? 1.25 : 1.5,
              fontSize: isMobile ? '0.875rem' : '1rem',
              order: isMobile ? 2 : 1,
              '&:hover': {
                borderColor: '#d0d0d0',
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RegistrationModal;