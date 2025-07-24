import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  LinearProgress,
  Fade,
  keyframes,
} from '@mui/material';
import { Wifi as WifiIcon } from '@mui/icons-material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  overlay?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
  variant?: 'circular' | 'linear' | 'dots';
  showProgress?: boolean;
  progress?: number; // 0-100
  timeout?: number; // Show timeout message after this many ms
  onTimeout?: () => void;
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const dotsAnimation = keyframes`
  0%, 20% {
    color: transparent;
    text-shadow: 0.25em 0 0 transparent, 0.5em 0 0 transparent;
  }
  40% {
    color: currentColor;
    text-shadow: 0.25em 0 0 transparent, 0.5em 0 0 transparent;
  }
  60% {
    text-shadow: 0.25em 0 0 currentColor, 0.5em 0 0 transparent;
  }
  80%, 100% {
    text-shadow: 0.25em 0 0 currentColor, 0.5em 0 0 currentColor;
  }
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando...',
  size = 40,
  overlay = false,
  color = 'primary',
  variant = 'circular',
  showProgress = false,
  progress = 0,
  timeout = 10000, // 10 seconds
  onTimeout
}) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      if (elapsed >= timeout) {
        setShowTimeoutMessage(true);
        if (onTimeout) {
          onTimeout();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeout, onTimeout]);

  const formatElapsedTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            <LinearProgress 
              color={color} 
              variant={showProgress ? 'determinate' : 'indeterminate'}
              value={showProgress ? progress : undefined}
              sx={{ height: 6, borderRadius: 3 }}
            />
            {showProgress && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                {Math.round(progress)}%
              </Typography>
            )}
          </Box>
        );
      
      case 'dots':
        return (
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'monospace',
              animation: `${dotsAnimation} 1.4s infinite ease-in-out`,
              color: color === 'primary' ? 'primary.main' : color === 'secondary' ? 'secondary.main' : 'inherit'
            }}
          >
            •••
          </Typography>
        );
      
      default:
        return (
          <CircularProgress 
            size={size} 
            color={color}
            variant={showProgress ? 'determinate' : 'indeterminate'}
            value={showProgress ? progress : undefined}
            sx={{
              animation: showTimeoutMessage ? `${pulseAnimation} 2s infinite` : undefined
            }}
          />
        );
    }
  };

  const spinnerContent = (
    <Fade in={true} timeout={300}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        p={2}
        sx={{
          minWidth: variant === 'linear' ? 320 : 'auto'
        }}
      >
        {renderSpinner()}
        
        {message && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            textAlign="center"
            sx={{ maxWidth: 300 }}
          >
            {message}
          </Typography>
        )}

        {showProgress && variant === 'circular' && (
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}% completado
          </Typography>
        )}

        {elapsedTime > 3000 && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            Tiempo transcurrido: {formatElapsedTime(elapsedTime)}
          </Typography>
        )}

        {showTimeoutMessage && (
          <Fade in={true}>
            <Box 
              sx={{ 
                textAlign: 'center',
                p: 2,
                backgroundColor: 'warning.light',
                borderRadius: 1,
                maxWidth: 300
              }}
            >
              <WifiIcon sx={{ color: 'warning.dark', mb: 1 }} />
              <Typography variant="caption" color="warning.dark" display="block">
                La operación está tardando más de lo esperado.
              </Typography>
              <Typography variant="caption" color="warning.dark" display="block">
                Verifica tu conexión a internet.
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>
    </Fade>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(2px)'
        }}
        open={true}
      >
        {spinnerContent}
      </Backdrop>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
      width="100%"
    >
      {spinnerContent}
    </Box>
  );
};

export default LoadingSpinner;