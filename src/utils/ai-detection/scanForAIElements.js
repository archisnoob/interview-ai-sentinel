
import { sessionState } from './sessionState';
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { isElementVisible } from './domUtils';
import { logDetection } from './logging';
import { AI_SELECTORS } from './constants';

// Respect DOM Elements with data-ignore-ai-scan="true" and check visibility
export const scanForAIElements = () => {
    if (!sessionState.sessionActive || isDevSafeEnvironment()) return;
    console.log('[AI Scan] Scanning for AI selectors at', new Date().toISOString());

    AI_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.closest('[data-ignore-ai-scan="true"]')) {
            return;
          }
          
          if (!isElementVisible(el)) {
            return;
          }

          if (!el.dataset.aiDetected) {
            el.dataset.aiDetected = 'true';
            const isLikelyAITool = [
              'chatgpt', 'claude', 'anthropic', 'cursor', 'parakit', 'copilot', 'ai-assist', 'ai-chat', 'assistant', 'gpt', 'gemini', 'poe'
            ].some(aiKey => selector.toLowerCase().includes(aiKey));
            
            if (isLikelyAITool) {
              logDetection('ai_selector_detected', {
                selector,
                tagName: el.tagName,
                className: el.className,
                id: el.id
              });
              console.log('[AI Scan] Flagged VISIBLE AI overlay/assistant:', selector, el);
            } else {
              console.log('[AI Scan] Matched generic selector, but not a specific AI tool:', selector, el);
            }
          }
        });
      } catch (e) {
        // Invalid selector, skip
      }
    });
  };
