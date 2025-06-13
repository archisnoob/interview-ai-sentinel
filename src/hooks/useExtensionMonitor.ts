
import { useState, useEffect, useCallback, useRef } from 'react';

export interface ExtensionStatus {
  isActive: boolean;
  lastPing: number | null;
  disconnected: boolean;
  initiallyConnected: boolean;
  wasExpected: boolean;
}

export const useExtensionMonitor = (sessionActive: boolean, extensionExpected: boolean = true) => {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    isActive: false,
    lastPing: null,
    disconnected: false,
    initiallyConnected: false,
    wasExpected: extensionExpected
  });
  const [detectionFlags, setDetectionFlags] = useState<string[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if extension is active with handshake
  const checkExtensionActive = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      let responseReceived = false;

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'AI_EXTENSION_ACK') {
          responseReceived = true;
          setExtensionStatus(prev => ({ 
            ...prev, 
            isActive: true, 
            lastPing: Date.now(),
            initiallyConnected: true
          }));
          window.removeEventListener('message', handleMessage);
          resolve(true);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Send handshake
      window.postMessage({ type: 'AI_EXTENSION_HANDSHAKE' }, '*');
      
      // Timeout after 1 second
      setTimeout(() => {
        if (!responseReceived) {
          window.removeEventListener('message', handleMessage);
          setExtensionStatus(prev => ({ 
            ...prev, 
            isActive: false,
            initiallyConnected: false
          }));
          
          // Only flag if extension was expected
          if (extensionExpected) {
            setDetectionFlags(prevFlags => [...prevFlags, 'Extension not active']);
            console.log('Extension handshake failed - extension was expected but not found');
          }
          resolve(false);
        }
      }, 1000);
    });
  }, [extensionExpected]);

  // Monitor extension during session
  useEffect(() => {
    if (!sessionActive) {
      // Cleanup when session ends
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }
      return;
    }

    // Start monitoring during active session
    const handlePongMessage = (event: MessageEvent) => {
      if (event.data?.type === 'AI_EXTENSION_PONG') {
        setExtensionStatus(prev => ({ ...prev, lastPing: Date.now(), disconnected: false }));
        if (responseTimeoutRef.current) {
          clearTimeout(responseTimeoutRef.current);
          responseTimeoutRef.current = null;
        }
      }
    };

    window.addEventListener('message', handlePongMessage);

    // Set up ping interval
    pingIntervalRef.current = setInterval(() => {
      window.postMessage({ type: 'AI_EXTENSION_PING' }, '*');
      
      // Wait for pong with timeout
      responseTimeoutRef.current = setTimeout(() => {
        setExtensionStatus(prev => {
          // Only flag disconnection if extension was initially connected AND was expected
          if (prev.initiallyConnected && prev.wasExpected) {
            setDetectionFlags(prevFlags => [...prevFlags, 'Extension inactive during session']);
            console.log('Extension ping timeout - marking as disconnected');
            return { ...prev, disconnected: true };
          }
          return prev;
        });
      }, 800);
    }, 10000);

    return () => {
      window.removeEventListener('message', handlePongMessage);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, [sessionActive]);

  // Test cases for verification
  const runTests = useCallback(() => {
    console.log('=== Extension Monitor Test Cases ===');
    
    // Test 1: No extension ever installed
    console.log('Test 1: No extension expected - should not raise flags');
    
    // Test 2: Extension active at start, then goes inactive mid-session
    console.log('Test 2: Extension active then inactive - should flag "Extension inactive during session"');
    
    // Test 3: Extension missing at session start, but was expected
    console.log('Test 3: Extension expected but missing - should flag "Extension not active"');
    
    // Test 4: Extension active throughout
    console.log('Test 4: Extension active throughout - should not raise flags');
    
    console.log('Current status:', extensionStatus);
    console.log('Current flags:', detectionFlags);
    console.log('=== End Test Cases ===');
  }, [extensionStatus, detectionFlags]);

  return {
    extensionStatus,
    detectionFlags,
    checkExtensionActive,
    runTests
  };
};
