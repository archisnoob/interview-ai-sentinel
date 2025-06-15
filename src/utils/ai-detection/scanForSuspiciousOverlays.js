
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { isElementVisible, getElementScore } from './domUtils';

// Respect data-ignore-ai-scan and only warn for *true* overlays
export const scanForSuspiciousOverlays = () => {
    const overlays = [];
    if (isDevSafeEnvironment()) {
        return overlays;
    }

    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.closest('[data-ignore-ai-scan="true"]') || !isElementVisible(el)) {
        return;
      }
      
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10) || 0;
      const position = style.position;

      if ((position === 'fixed' || position === 'absolute') && zIndex > 9999) {
        const score = getElementScore(el);
        if (score >= 3) {
          overlays.push(el);
        }
      }
    });

    return overlays;
  };
