
import { useState, useEffect, useCallback, useRef } from 'react';
import { SessionConfig } from '@/types/config';

export interface ExtensionStatus {
  status: 'Connected' | 'Inactive' | 'Not Connected' | 'Not Required';
  lastPing: number | null;
  disconnected: boolean;
  initiallyConnected: boolean;
  wasExpected: boolean;
}

export const useExtensionMonitor = (sessionActive: boolean, config: SessionConfig) => {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    status: config.enableExtensionCheck ? 'Not Connected' : 'Not Required',
    lastPing: null,
    disconnected: false,
    initiallyConnected: false,
    wasExpected: config.enableExtensionCheck
  });
  const [detectionFlags, setDetectionFlags] = useState<string[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);

  // Silent background polling to localhost:4201/handshake
  const performSilentHandshake = useCallback(async (): Promise<boolean> => {
    if (!config.enableExtensionCheck) return false;
    
    try {
      const response = await fetch('http://localhost:4201/handshake', {
        method: 'GET',
        timeout: 1000
      } as any);
      
      if (response.ok) {
        failureCountRef.current = 0;
        setExtensionStatus(prev => ({ 
          ...prev, 
          status: 'Connected',
          lastPing: Date.now(),
          initiallyConnected: true,
          disconnected: false
        }));
        return true;
      }
    } catch (error) {
      // Silent failure - no console logs or UI messages
    }
    
    failureCountRef.current += 1;
    
    // After 3 consecutive failures, mark as inactive
    if (failureCountRef.current >= 3) {
      setExtensionStatus(prev => {
        if (prev.initiallyConnected && prev.status === 'Connected') {
          // Only flag if was previously connected
          setDetectionFlags(prevFlags => [...prevFlags, 'Extension became inactive mid-session']);
          return { ...prev, status: 'Inactive', disconnected: true };
        } else if (!prev.initiallyConnected && prev.status === 'Not Connected') {
          // Never connected during session
          setDetectionFlags(prevFlags => [...prevFlags, 'Extension not connected']);
          return { ...prev, status: 'Not Connected' };
        }
        return prev;
      });
    }
    
    return false;
  }, [config.enableExtensionCheck]);

  // Monitor extension during session with silent polling
  useEffect(() => {
    if (!sessionActive || !config.enableExtensionCheck) {
      // Cleanup when session ends or extension check disabled
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      return;
    }

    // Start silent background polling every 10 seconds
    pingIntervalRef.current = setInterval(() => {
      performSilentHandshake();
    }, 10000);

    // Initial handshake attempt
    performSilentHandshake();

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [sessionActive, config.enableExtensionCheck, performSilentHandshake]);

  const getExtensionVerdict = useCallback(() => {
    if (!config.enableExtensionCheck) {
      return 'Extension not required';
    }
    
    switch (extensionStatus.status) {
      case 'Connected':
        return 'Extension connected during full session';
      case 'Inactive':
      case 'Not Connected':
        return 'Extension not present or inactive';
      default:
        return 'Extension status unknown';
    }
  }, [config.enableExtensionCheck, extensionStatus.status]);

  return {
    extensionStatus,
    detectionFlags,
    getExtensionVerdict
  };
};
