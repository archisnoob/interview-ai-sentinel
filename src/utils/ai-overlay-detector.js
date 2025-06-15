
import { sessionState } from './ai-detection/sessionState';
import { isDevSafeEnvironment } from './ai-detection/isDevSafeEnvironment';
import { scanForAIElements } from './ai-detection/scanForAIElements';
import { scanForSuspiciousOverlays } from './ai-detection/scanForSuspiciousOverlays';
import { scanForAIText } from './ai-detection/scanForAIText';
import { scanForShadowDOM } from './ai-detection/scanForShadowDOM';
import { registerScanLoop, setDetectionSessionActive as setSessionActive } from './ai-detection/sessionUtils';

// Public function to control session state, preserving the original external API
export { setSessionActive as setDetectionSessionActive };

function randomIntervalDelay() {
  return 3000 + Math.floor(Math.random() * 2000);
}

function scanLoop() {
  if (!sessionState.sessionActive || isDevSafeEnvironment()) {
    window.__aiScanIntervalActive__ = false;
    return;
  }
  scanForAIElements();
  scanForSuspiciousOverlays();

  if (window.__aiScanIntervalActive__ && sessionState.sessionActive) {
    setTimeout(() => scanLoop(), randomIntervalDelay());
  } else {
    window.__aiScanIntervalActive__ = false;
  }
}

// Register the scanLoop with the session utility so it can be started correctly
registerScanLoop(scanLoop);

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
    
    scanForAIElements();
    scanForSuspiciousOverlays();
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
}
