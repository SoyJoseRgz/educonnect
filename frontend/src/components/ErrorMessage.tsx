import React, { useState, useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { 
  Error as ErrorIcon, 
  Refresh as RefreshIcon,
  WifiOff as WifiOffIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Home as HomeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface ErrorMessageProps {
  message: string;
  errors?: string[];
  severity?: 'error' | 'warning' | 'info';
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  showDetails?: boolean;
  onClose?: () => void;
  errorCode?: string | number;
  timestamp?: Date;
  showRecoveryOptions?: boolean;
  onGoHome?: () => void;
  onReportError?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  errors = [],
  severity = 'error',
  title,
  onRetry,
  retryText = 'Reintentar',
  showDetails = false,
  onClose,
  errorCode,
  timestamp = new Date(),
  showRecoveryOptions = false,
  onGoHome,
  onReportError
}) => {
  const [detailsOpen, setDetailsOpen] = useState(showDetails && errors.length > 0);
  const [retryCount, setRetryCount] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleToggleDetails = () => {
    setDetailsOpen(!detailsOpen);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  const handleCopyError = async () => {
    const errorInfo = {
      message,
      errors,
      errorCode,
      timestamp: timestamp.toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.warn('Failed to copy error info:', err);
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return message.toLowerCase().includes('conexión') || message.toLowerCase().includes('network') 
          ? <WifiOffIcon /> 
          : <ErrorIcon />;
    }
  };

  const getSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    if (message.toLowerCase().includes('conexión') || message.toLowerCase().includes('network')) {
      suggestions.push('Verifica tu conexión a internet');
      suggestions.push('Intenta recargar la página');
      suggestions.push('Verifica que no haya problemas con tu proveedor de internet');
    }
    
    if (message.toLowerCase().includes('timeout') || message.toLowerCase().includes('tiempo')) {
      suggestions.push('La operación tardó demasiado, intenta nuevamente');
      suggestions.push('Verifica tu velocidad de internet');
    }
    
    if (message.toLowerCase().includes('servidor') || message.toLowerCase().includes('500')) {
      suggestions.push('Hay un problema temporal con el servidor');
      suggestions.push('Intenta nuevamente en unos minutos');
    }
    
    if (message.toLowerCase().includes('credenciales') || message.toLowerCase().includes('401')) {
      suggestions.push('Verifica que tus credenciales sean correctas');
      suggestions.push('Intenta cerrar sesión e iniciar sesión nuevamente');
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Alert 
        severity={severity}
        icon={getIcon()}
        onClose={onClose}
        sx={{ 
          '& .MuiAlert-message': { 
            width: '100%' 
          } 
        }}
      >
        <Box sx={{ width: '100%' }}>
          {title && <AlertTitle>{title}</AlertTitle>}
          
          <Typography variant="body2" sx={{ mb: 1 }}>
            {message}
          </Typography>

          {errorCode && (
            <Box sx={{ mb: 1 }}>
              <Chip 
                label={`Código: ${errorCode}`} 
                size="small" 
                variant="outlined" 
                color={severity}
              />
            </Box>
          )}

          {retryCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Intentos realizados: {retryCount}
            </Typography>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
            {onRetry && (
              <Button
                color="inherit"
                size="small"
                onClick={handleRetry}
                startIcon={<RefreshIcon />}
                variant="outlined"
              >
                {retryText}
              </Button>
            )}
            
            <Button
              color="inherit"
              size="small"
              onClick={handleCopyError}
              startIcon={<CopyIcon />}
              variant="outlined"
            >
              {copySuccess ? 'Copiado!' : 'Copiar Error'}
            </Button>

            {showRecoveryOptions && (
              <>
                {onGoHome && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={onGoHome}
                    startIcon={<HomeIcon />}
                    variant="outlined"
                  >
                    Ir al Inicio
                  </Button>
                )}
                
                {onReportError && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={onReportError}
                    startIcon={<BugIcon />}
                    variant="outlined"
                  >
                    Reportar
                  </Button>
                )}
              </>
            )}
          </Stack>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Sugerencias:
              </Typography>
              <List dense sx={{ mt: 0.5 }}>
                {suggestions.map((suggestion, index) => (
                  <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                    <ListItemText 
                      primary={`• ${suggestion}`}
                      slotProps={{
                        primary: {
                          variant: 'caption',
                          color: 'text.secondary'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Error Details */}
          {errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={handleToggleDetails}
                sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
              >
                {detailsOpen ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
              </Button>
              
              <Collapse in={detailsOpen}>
                <Box sx={{ mt: 1, p: 1, backgroundColor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Detalles técnicos:
                  </Typography>
                  <List dense>
                    {errors.map((error, index) => (
                      <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
                        <ListItemText 
                          primary={`• ${error}`}
                          slotProps={{
                            primary: {
                              variant: 'caption',
                              color: 'text.secondary',
                              sx: { fontFamily: 'monospace' }
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    Timestamp: {timestamp.toLocaleString()}
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default ErrorMessage;