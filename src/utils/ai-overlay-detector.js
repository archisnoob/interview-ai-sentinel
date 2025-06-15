
import { sessionState } from './ai-detection/sessionState';
import { isDevSafeEnvironment } from './ai-detection/isDevSafeEnvironment';
import { scanForAIElements } from './ai-detection/scanForAIElements';
import { scanForSuspiciousOverlays } from './ai-detection/scanForSuspiciousOverlays';
import { scanForAIText } from './ai-detection/scanForAIText';
import { scanForShadowDOM } from './ai-detection/scanForShadowDOM';
import { setDetectionSessionActive as setSessionActive } from './ai-detection/sessionUtils';
import { logDetection } from './ai-detection/logging';

// Public function to control session state, preserving the original external API
export { setSessionActive as setDetectionSessionActive };

export function startAIOverlayDetection() {
  const handleMutations = (mutations) => {
    if (!sessionState.sessionActive || isDevSafeEnvironment()) return;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanForShadowDOM(node);
            
            const walker = document.createTreeWalker(
              node,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            let textNode;
            while (textNode = walker.nextNode()) {
              scanForAIText(textNode);
            }
          }
        });
      }
    });
    
    const aiMatches = scanForAIElements();
    const overlayMatches = scanForSuspiciousOverlays();
    if (aiMatches.length > 0 || overlayMatches.length > 0) {
      logDetection('assistant_detected_on_mutation', {
        aiElementCount: aiMatches.length,
        overlayCount: overlayMatches.length,
      });
    }
  };

  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'style']
  });

  return () => {
    observer.disconnect();
  };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAIOverlayDetection);
  } else {
    startAIOverlayDetection();
  }

  if (!window.__aiSentinelScanInterval) {
    window.__aiSentinelScanInterval = setInterval(() => {
      if (sessionState.sessionActive) {
        const aiMatches = scanForAIElements();
        const overlayMatches = scanForSuspiciousOverlays();
  
        if ((aiMatches.length > 0 || overlayMatches.length > 0)) {
            logDetection('assistant_detected_periodic_scan', {
                aiElementCount: aiMatches.length,
                overlayCount: overlayMatches.length,
              });
        }
      }
    }, Math.floor(Math.random() * 2000) + 3000); // 3–5 sec
  }
}
