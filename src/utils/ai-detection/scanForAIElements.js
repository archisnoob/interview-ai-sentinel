
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { isElementVisible, getElementScore } from './domUtils';

// Respect DOM Elements with data-ignore-ai-scan="true" and check visibility
export const scanForAIElements = () => {
    const matchedElements = [];
    if (isDevSafeEnvironment()) {
        return matchedElements;
    }

    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.closest('[data-ignore-ai-scan="true"]') || !isElementVisible(el)) {
        return;
      }

      const score = getElementScore(el);
      if (score >= 3) {
        matchedElements.push(el);
      }
    });

    return matchedElements;
  };
