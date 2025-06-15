
// AI Overlay Detection System
// Monitors for AI assistant overlays, chat widgets, and suspicious DOM injections

// Session and throttling control variables
let sessionActive = false;
let aiWarningShown = false;
let lastAlertTime = 0;

// Safe development URLs that should be ignored
const devSafeSites = [
  'localhost',
  '127.0.0.1',
  'lovable.dev',
  'chat.openai.com',
  'claude.ai',
  'copilot.github.com'
];

// Function to check if current site is a safe development environment
const isDevSafeEnvironment = () => {
  const currentURL = window.location.hostname;
  return devSafeSites.some(site => currentURL.includes(site));
};

// Public function to control session state from outside
export function setDetectionSessionActive(active) {
  sessionActive = active;
  if (active) {
    // Reset warning flag when starting new session
    aiWarningShown = false;
    lastAlertTime = 0;
    console.log('AI detection activated for session');
  } else {
    console.log('AI detection deactivated');
  }
}

export function startAIOverlayDetection() {
  let detectionLog = [];
  let shadowDOMNodes = new Set();
  
  // Known AI tool selectors and patterns
  const AI_SELECTORS = [
    // ChatGPT and OpenAI
    '[class*="chatgpt"]', '[id*="chatgpt"]', '[data-testid*="chat"]',
    // Claude/Anthropic
    '[class*="claude"]', '[id*="claude"]', '[class*="anthropic"]',
    // Cursor AI
    '[class*="cursor"]', '[id*="cursor-ai"]', '[data-cursor]',
    // Parakit AI
    '[class*="parakit"]', '[id*="parakit"]', '[data-parakit]',
    // GitHub Copilot
    '[class*="copilot"]', '[id*="copilot"]', '[data-copilot]',
    // Generic AI patterns
    '[class*="ai-assist"]', '[class*="ai-chat"]', '[class*="assistant"]',
    '[class*="gpt"]', '[id*="ai-"]', '[data-ai]',
    // Floating widgets
    '[style*="position: fixed"]', '[style*="z-index: 9999"]'
  ];

  // AI-related text patterns
  const AI_TEXT_PATTERNS = [
    /ask me anything/i,
    /how can I help/i,
    /ai assistant/i,
    /powered by (gpt|claude|openai)/i,
    /chat with ai/i,
    /copilot/i,
    /parakit/i
  ];

  // Enhanced log detection with session and throttling control
  const logDetection = (type, details) => {
    // Only proceed if session is active and not in dev environment
    if (!sessionActive || isDevSafeEnvironment()) {
      return;
    }

    const now = Date.now();
    const event = {
      type,
      timestamp: new Date().toISOString(),
      details,
      url: window.location.href
    };
    
    detectionLog.push(event);
    console.warn("⚠️ AI overlay detected:", event);
    
    // Throttled alert system - show only once per session or after 10 second intervals
    if (!aiWarningShown || (now - lastAlertTime > 10000)) {
      setTimeout(() => {
        alert("AI Assistant Detected. This may violate test policy.");
      }, 100);
      aiWarningShown = true;
      lastAlertTime = now;
    }
    
    // Optional: Send to backend (only if session active)
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

  // Check for AI-related selectors (only during active session)
  const scanForAIElements = () => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    
    AI_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (!el.dataset.aiDetected) {
            el.dataset.aiDetected = 'true';
            logDetection('ai_selector_detected', {
              selector,
              tagName: el.tagName,
              className: el.className,
              id: el.id
            });
          }
        });
      } catch (e) {
        // Invalid selector, skip
      }
    });
  };

  // Check for AI-related text content (only during active session)
  const scanForAIText = (node) => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    
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

  // Check for shadow DOM (only during active session)
  const scanForShadowDOM = (node) => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    
    if (node.shadowRoot && !shadowDOMNodes.has(node)) {
      shadowDOMNodes.add(node);
      logDetection('shadow_dom_detected', {
        tagName: node.tagName,
        className: node.className,
        id: node.id
      });
    }
  };

  // Check for suspicious high z-index overlays (only during active session)
  const scanForSuspiciousOverlays = () => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10);
      
      if (zIndex > 9999 && 
          (style.position === 'fixed' || style.position === 'absolute') &&
          !el.dataset.overlayDetected) {
        
        el.dataset.overlayDetected = 'true';
        logDetection('suspicious_overlay_detected', {
          tagName: el.tagName,
          zIndex,
          position: style.position,
          className: el.className,
          id: el.id
        });
      }
    });
  };

  // MutationObserver callback (respects session state)
  const handleMutations = (mutations) => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the node itself
            scanForShadowDOM(node);
            
            // Check text content
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
    
    // Run periodic scans after mutations
    scanForAIElements();
    scanForSuspiciousOverlays();
  };

  // Initialize MutationObserver
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'style']
  });

  // Initial scan (only if session active)
  if (sessionActive && !isDevSafeEnvironment()) {
    scanForAIElements();
    scanForSuspiciousOverlays();
  }

  // Periodic checks with session control (every 5 seconds)
  const periodicCheck = setInterval(() => {
    if (sessionActive && !isDevSafeEnvironment()) {
      scanForAIElements();
      scanForSuspiciousOverlays();
    }
  }, 5000);

  // Cleanup function
  return () => {
    observer.disconnect();
    clearInterval(periodicCheck);
  };
}

// Auto-start detection when module loads (but inactive until session starts)
if (typeof window !== 'undefined') {
  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAIOverlayDetection);
  } else {
    startAIOverlayDetection();
  }
}
