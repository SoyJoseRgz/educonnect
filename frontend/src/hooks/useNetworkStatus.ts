import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  downlink?: number;
  effectiveType?: string;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  retryConnection: () => void;
  lastOnlineTime: Date | null;
  offlineDuration: number; // in seconds
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
  });
  
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  
  const [offlineDuration, setOfflineDuration] = useState(0);

  // Get connection information if available
  const getConnectionInfo = useCallback((): Partial<NetworkStatus> => {
    // @ts-ignore - NetworkInformation is not fully supported in TypeScript
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        connectionType: connection.type || connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        isSlowConnection: connection.effectiveType === 'slow-2g' || 
                         connection.effectiveType === '2g' ||
                         (connection.downlink && connection.downlink < 0.5),
      };
    }
    
    return {
      connectionType: 'unknown',
      isSlowConnection: false,
    };
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    const connectionInfo = getConnectionInfo();

    setNetworkStatus(prev => ({
      ...prev,
      isOnline,
      ...connectionInfo,
    }));

    if (isOnline) {
      setLastOnlineTime(new Date());
      setOfflineDuration(0);
    }
  }, [getConnectionInfo]);

  // Retry connection by attempting a simple fetch
  const retryConnection = useCallback(async () => {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        updateNetworkStatus();
      }
    } catch (error) {
      // Connection still not available
      console.warn('Connection retry failed:', error);
    }
  }, [updateNetworkStatus]);

  useEffect(() => {
    // Initial setup
    updateNetworkStatus();

    // Event listeners for online/offline events
    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    // Connection change listener (if supported)
    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // @ts-ignore - NetworkInformation is not fully supported in TypeScript
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus]);

  // Separate useEffect for offline duration tracking
  useEffect(() => {
    if (!networkStatus.isOnline && lastOnlineTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - lastOnlineTime.getTime()) / 1000);
        setOfflineDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setOfflineDuration(0);
    }
  }, [networkStatus.isOnline, lastOnlineTime]);

  return {
    ...networkStatus,
    retryConnection,
    lastOnlineTime,
    offlineDuration,
  };
};