
import { sessionState } from './sessionState';
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { isElementVisible } from './domUtils';

// Respect data-ignore-ai-scan and only warn for *true* overlays
export const scanForSuspiciousOverlays = () => {
    if (!sessionState.sessionActive || isDevSafeEnvironment()) return;
    console.log('[AI Scan] Checking for suspicious overlays (diagnostics only) at', new Date().toISOString());

    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.closest('[data-ignore-ai-scan="true"]')) {
        return;
      }
      
      if (!isElementVisible(el)) {
        return;
      }

      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10);

      if (zIndex > 9999 && 
          (style.position === 'fixed' || style.position === 'absolute') &&
          !el.dataset.overlayDetected) {
        el.dataset.overlayDetected = 'true';
        console.log('[AI Scan] Found high z-index/fixed VISIBLE overlay (informational only):', el);
      }
    });
  };
