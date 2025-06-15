
import { sessionState } from './sessionState';
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { logDetection } from './logging';
import { AI_TEXT_PATTERNS } from './constants';

// Check for AI-related text content (only during active session)
export const scanForAIText = (node) => {
    if (!sessionState.sessionActive || isDevSafeEnvironment()) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text.length > 10) {
        AI_TEXT_PATTERNS.forEach(pattern => {
          if (pattern.test(text)) {
            logDetection('ai_text_detected', {
              text: text.substring(0, 100),
              pattern: pattern.toString()
            });
          }
        });
      }
    }
  };
