
// AI Overlay Detection System
// Monitors for AI assistant overlays, chat widgets, and suspicious DOM injections

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

  // Log detection event
  const logDetection = (type, details) => {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      details,
      url: window.location.href
    };
    
    detectionLog.push(event);
    console.warn("⚠️ AI overlay detected:", event);
    
    // Show alert (non-blocking)
    setTimeout(() => {
      alert("AI Assistant Detected. This may violate test policy.");
    }, 100);
    
    // Optional: Send to backend
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

  // Check for AI-related selectors
  const scanForAIElements = () => {
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

  // Check for AI-related text content
  const scanForAIText = (node) => {
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

  // Check for shadow DOM
  const scanForShadowDOM = (node) => {
    if (node.shadowRoot && !shadowDOMNodes.has(node)) {
      shadowDOMNodes.add(node);
      logDetection('shadow_dom_detected', {
        tagName: node.tagName,
        className: node.className,
        id: node.id
      });
    }
  };

  // Check for suspicious high z-index overlays
  const scanForSuspiciousOverlays = () => {
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

  // MutationObserver callback
  const handleMutations = (mutations) => {
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

  // Initial scan
  scanForAIElements();
  scanForSuspiciousOverlays();

  // Periodic checks (every 5 seconds)
  const periodicCheck = setInterval(() => {
    scanForAIElements();
    scanForSuspiciousOverlays();
  }, 5000);

  // Cleanup function
  return () => {
    observer.disconnect();
    clearInterval(periodicCheck);
  };
}

// Auto-start detection when module loads
if (typeof window !== 'undefined') {
  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAIOverlayDetection);
  } else {
    startAIOverlayDetection();
  }
}
