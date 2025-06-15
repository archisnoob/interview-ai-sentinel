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
    if (typeof window !== "undefined") {
      // Start scanning when session starts
      if (!window.__aiScanIntervalActive__) {
        window.__aiScanIntervalActive__ = true;
        scanLoop();
      }
    }
  } else {
    console.log('AI detection deactivated');
    // Pause scan timer until re-activated
    window.__aiScanIntervalActive__ = false;
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

  // 1. Respect DOM Elements with data-ignore-ai-scan="true"
  const scanForAIElements = () => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    console.log('[AI Scan] Scanning for AI selectors at', new Date().toISOString());

    AI_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // SKIP if this element or ancestor has the ignore attribute
          if (el.closest('[data-ignore-ai-scan="true"]')) {
            console.log('[AI Scan] Skipped element for selector:', selector, 'Reason: data-ignore-ai-scan present');
            return;
          }
          if (!el.dataset.aiDetected) {
            el.dataset.aiDetected = 'true';
            // Only trigger warning/flag for actual recognized AI overlays/assistants
            // NOT generic high-z-index/fixed UI components. We'll use selector as indicator and ignore ultra-generic selectors below.
            // Only log if selector matches a genuine AI tool indicator:
            const isLikelyAITool = [
              'chatgpt', 'claude', 'anthropic', 'cursor', 'parakit', 'copilot', 'ai-assist', 'ai-chat', 'assistant', 'gpt'
            ].some(aiKey => selector.includes(aiKey));
            if (isLikelyAITool) {
              logDetection('ai_selector_detected', {
                selector,
                tagName: el.tagName,
                className: el.className,
                id: el.id
              });
              console.log('[AI Scan] Flagged AI overlay/assistant:', selector, el);
            } else {
              // Suppress alerts for generic UI
              console.log('[AI Scan] Matched generic selector, but not AI tool:', selector, el);
            }
          }
        });
      } catch (e) {
        // Invalid selector, skip
      }
    });
  };

  // 1 & 3. Respect data-ignore-ai-scan and only warn for *true* overlays
  const scanForSuspiciousOverlays = () => {
    if (!sessionActive || isDevSafeEnvironment()) return;
    console.log('[AI Scan] Scanning for suspicious overlays at', new Date().toISOString());

    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.closest('[data-ignore-ai-scan="true"]')) {
        console.log('[AI Scan] Skipped overlay candidate:', el, 'Reason: data-ignore-ai-scan present');
        return;
      }
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex, 10);

      // From legacy logic: We no longer flag just on high z-index or fixed; need actual AI signature as well (see scanForAIElements).
      // So here, we only log overlays if they match likely known AI selectors.
      // If you want to extend, you can add known AI overlay classes/z-index combos here in future.

      // (We still mark overlays for internal diagnostics/logs if desired:)
      if (zIndex > 9999 && 
          (style.position === 'fixed' || style.position === 'absolute') &&
          !el.dataset.overlayDetected) {
        el.dataset.overlayDetected = 'true';
        // Only log if we have evidence from scanForAIElements that this element (or ancestry) was AI-marked.
        // Otherwise, just log to debug.
        console.log('[AI Scan] Found high z-index/fixed overlay, NOT flagged as AI (informational only):', el);
        // (Do not use logDetection() here unless a verified AI element.)
      }
    });
  };

  // ⏱️ 2. Reliable 3–5 Second Scanning Interval, only while sessionActive
  function randomIntervalDelay() {
    // Return a value between 3000–5000 ms
    return 3000 + Math.floor(Math.random() * 2000);
  }

  // Periodic scan loop with proper pausing + re-entry
  function scanLoop() {
    if (!sessionActive || isDevSafeEnvironment()) {
      window.__aiScanIntervalActive__ = false;
      return;
    }
    scanForAIElements();
    scanForSuspiciousOverlays();

    // Schedule the next scan only if session still active
    if (window.__aiScanIntervalActive__ && sessionActive) {
      setTimeout(() => scanLoop(), randomIntervalDelay());
    } else {
      window.__aiScanIntervalActive__ = false;
    }
  }

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
