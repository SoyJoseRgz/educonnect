import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../services/api';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Redirect to admin if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  // Clear auth error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Email validation
    if (!credentials.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    // Password validation
    if (!credentials.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
    
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(credentials.email, credentials.password);
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error) {
      // Error is handled by AuthContext and displayed via authError
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPublic = () => {
    navigate('/');
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }
    }}>
      {/* Header */}
      <Box
        sx={{
          py: isMobile ? 1.5 : 2,
          px: isMobile ? 2 : 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handleBackToPublic}
              sx={{
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                borderRadius: '12px',
                color: '#4285f4',
                '&:hover': {
                  backgroundColor: 'rgba(66, 133, 244, 0.2)',
                },
              }}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '0.5px'
              }}
            >
              EduConnect
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: isMobile ? 3 : 4,
          px: 2,
          position: 'relative',
          zIndex: 5
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 3 : 5,
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #4285f4, #34a853, #fbbc05, #ea4335)',
              }
            }}
          >
            {/* Login Header */}
            <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4, pt: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? 56 : 72,
                  height: isMobile ? 56 : 72,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                  color: 'white',
                  mb: 2,
                  boxShadow: '0 8px 24px rgba(66, 133, 244, 0.3)',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: '2px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                    pointerEvents: 'none',
                  }
                }}
              >
                <AdminIcon fontSize={isMobile ? "medium" : "large"} />
              </Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: '#1a1a1a',
                  mb: 1
                }}
              >
                Panel de Administración
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: '400px',
                  mx: 'auto',
                  color: '#666666',
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  lineHeight: 1.5
                }}
              >
                Ingresa tus credenciales para acceder al sistema de gestión de estudiantes
              </Typography>
            </Box>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 2.5 : 3 }}>
                {authError && (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                      '& .MuiAlert-icon': {
                        color: '#f44336'
                      }
                    }}
                  >
                    {authError}
                  </Alert>
                )}

                <TextField
                  label="Correo Electrónico"
                  type="email"
                  value={credentials.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'rgba(250, 250, 250, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        backgroundColor: 'rgba(245, 245, 245, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 0 0 2px rgba(66, 133, 244, 0.2)',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                    },
                  }}
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  value={credentials.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  fullWidth
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'rgba(250, 250, 250, 0.8)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        backgroundColor: 'rgba(245, 245, 245, 0.9)',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 0 0 2px rgba(66, 133, 244, 0.2)',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                    },
                  }}
                />

                <Box sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 1.5 : 2,
                  mt: isMobile ? 2 : 3
                }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
                    sx={{
                      minHeight: isMobile ? 44 : 52,
                      borderRadius: '12px',
                      backgroundColor: '#4285f4',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      boxShadow: '0 4px 12px rgba(66, 133, 244, 0.4)',
                      order: isMobile ? 1 : 2,
                      '&:hover': {
                        backgroundColor: '#3367d6',
                        boxShadow: '0 6px 16px rgba(66, 133, 244, 0.5)',
                        transform: 'translateY(-1px)',
                      },
                      '&:disabled': {
                        backgroundColor: '#cccccc',
                        boxShadow: 'none',
                        transform: 'none',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                  <Button
                    onClick={handleBackToPublic}
                    disabled={isLoading}
                    variant="outlined"
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      minHeight: isMobile ? 44 : 52,
                      borderRadius: '12px',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      color: '#666666',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      order: isMobile ? 2 : 1,
                      '&:hover': {
                        borderColor: 'rgba(0, 0, 0, 0.2)',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Volver
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: isMobile ? 1.5 : 2,
          px: 2,
          mt: 'auto',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(0, 0, 0, 0.6)',
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}
        >
          © 2025 EduConnect - Sistema de Gestión de Estudiantes
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;