import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Button,
  Slide,
  SlideProps,
} from '@mui/material';
import {
  Close as CloseIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string, action?: Notification['action']) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideNotification: (id: string) => void;
  hideAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const networkStatus = useNetworkStatus();

  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      duration: 6000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-hide non-persistent notifications
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, newNotification.duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const hideAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'success',
      title,
      message,
    });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string, action?: Notification['action']) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      action,
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: 7000,
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification({
      type: 'info',
      title,
      message,
    });
  }, [showNotification]);

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
    hideAllNotifications,
  };

  // Format offline duration
  const formatOfflineDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Network Status Notification */}
      <Snackbar
        open={!networkStatus.isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slots={{ transition: SlideTransition }}
        sx={{ zIndex: (theme) => theme.zIndex.snackbar + 1 }}
      >
        <Alert
          severity="error"
          variant="filled"
          icon={<WifiOffIcon />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={networkStatus.retryConnection}
                startIcon={<RefreshIcon />}
              >
                Reintentar
              </Button>
            </Box>
          }
          sx={{ minWidth: 300 }}
        >
          <AlertTitle>Sin conexión a internet</AlertTitle>
          <Typography variant="body2">
            {networkStatus.offlineDuration > 0 
              ? `Desconectado por ${formatOfflineDuration(networkStatus.offlineDuration)}`
              : 'Verifica tu conexión a internet'
            }
          </Typography>
        </Alert>
      </Snackbar>

      {/* Slow Connection Warning */}
      <Snackbar
        open={networkStatus.isOnline && networkStatus.isSlowConnection}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={10000}
        slots={{ transition: SlideTransition }}
      >
        <Alert
          severity="warning"
          variant="filled"
          icon={<WifiIcon />}
          onClose={() => {}} // Will auto-hide
        >
          <AlertTitle>Conexión lenta detectada</AlertTitle>
          <Typography variant="body2">
            La aplicación puede funcionar más lentamente de lo normal.
          </Typography>
        </Alert>
      </Snackbar>

      {/* Regular Notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          slots={{ transition: SlideTransition }}
          sx={{ 
            zIndex: (theme) => theme.zIndex.snackbar,
            transform: `translateY(-${index * 70}px)` // Stack notifications
          }}
        >
          <Alert
            severity={notification.type}
            variant="filled"
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {notification.action && (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={notification.action.onClick}
                  >
                    {notification.action.label}
                  </Button>
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => hideNotification(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
            sx={{ minWidth: 300, maxWidth: 500 }}
          >
            {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
            <Typography variant="body2">
              {notification.message}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};