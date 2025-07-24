import { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Container,
  Stack,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    // errorReportingService.captureException(error, {
    //   extra: errorInfo,
    //   tags: { errorId: this.state.errorId }
    // });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Box sx={{ mb: 3 }}>
              <ErrorIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main',
                  mb: 2 
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom color="error">
                ¡Oops! Algo salió mal
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ha ocurrido un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Detalles del Error</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>ID del Error:</strong> {this.state.errorId}
              </Typography>
              {this.state.error && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Mensaje:</strong> {this.state.error.message}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Por favor, incluye este ID al reportar el problema.
              </Typography>
            </Alert>

            {isDevelopment && this.state.error && this.state.errorInfo && (
              <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                <AlertTitle>Información de Desarrollo</AlertTitle>
                <Box component="pre" sx={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto',
                  maxHeight: '200px',
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  mt: 1
                }}>
                  {this.state.error.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </Box>
              </Alert>
            )}

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
            >
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                size="large"
              >
                Reintentar
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                size="large"
              >
                Recargar Página
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
                size="large"
              >
                Ir al Inicio
              </Button>
            </Stack>

            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Si el problema persiste, puedes:
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  size="small"
                  startIcon={<BugIcon />}
                  onClick={() => {
                    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`);
                    const body = encodeURIComponent(
                      `Error ID: ${this.state.errorId}\n` +
                      `Error Message: ${this.state.error?.message || 'Unknown'}\n` +
                      `URL: ${window.location.href}\n` +
                      `User Agent: ${navigator.userAgent}\n\n` +
                      `Descripción del problema:\n[Describe qué estabas haciendo cuando ocurrió el error]`
                    );
                    window.open(`mailto:support@educonnect.com?subject=${subject}&body=${body}`);
                  }}
                >
                  Reportar Error
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;