
import { sessionState } from './sessionState';
import { isDevSafeEnvironment } from './isDevSafeEnvironment';

// Enhanced log detection with session and throttling control
export const logDetection = (type, details) => {
  if (!sessionState.sessionActive || isDevSafeEnvironment()) {
    return;
  }

  const now = Date.now();
  const event = {
    type,
    timestamp: new Date().toISOString(),
    details,
    url: window.location.href
  };
  
  sessionState.detectionLog.push(event);
  console.warn("⚠️ AI overlay detected:", event);

  if (!sessionState.aiWarningShown || (now - sessionState.lastAlertTime > 10000)) {
    setTimeout(() => {
      alert("AI Assistant Detected. This may violate test policy.");
    }, 100);
    sessionState.aiWarningShown = true;
    sessionState.lastAlertTime = now;
  }

  try {
    fetch('/log/ai-overlay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(err => console.log('Logging endpoint not available:', err.message));
  } catch (e) {
    // Silently fail if endpoint doesn't exist
  }
};
