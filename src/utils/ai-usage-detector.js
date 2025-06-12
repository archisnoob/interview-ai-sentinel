// src/utils/ai-usage-detector.js
export function startMonitoring() {
  let detectionSignals = new Set(); // Use a Set to store unique signals

  const aiToolSelectors = [
    '.monica-widget',
    '.harpa-popup',
    '#merlin-ui',
    '.ghostwriter-popup', // Added another example
    // Add more selectors as they become known
  ];

  const sendAlert = () => {
    if (detectionSignals.size >= 2) {
      const details = Array.from(detectionSignals);
      console.log('AI Usage Suspected:', { type: "ai-suspected", timestamp: new Date().toISOString(), details });
      fetch('/flag-extension-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: "ai-suspected", timestamp: new Date().toISOString(), details }),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Failed to send AI usage report:', response.statusText);
        } else {
          console.log('AI usage report sent successfully.');
        }
      })
      .catch(error => {
        console.error('Error sending AI usage report:', error);
      });
      // Clear signals after reporting to prevent immediate re-triggering for the same combination.
      // New, different signals can still trigger a new report.
      detectionSignals.clear();
    }
  };

  const addSignal = (signal) => {
    if (!detectionSignals.has(signal)) {
      detectionSignals.add(signal);
      // No immediate call to sendAlert here, let the interval or specific event handlers decide
    }
  };

  const detectAISelectors = () => {
    aiToolSelectors.forEach(selector => {
      if (document.querySelector(selector)) {
        addSignal(`selector_detected:${selector}`);
      }
    });
  };

  const detectOverlays = () => {
    const potentialOverlays = document.querySelectorAll('body *'); // Check all elements
    potentialOverlays.forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseInt(style.zIndex, 10) > 10000) { // High z-index
        addSignal(`high_z_index_detected:${el.tagName}#${el.id}.${el.className}`);
         // Check for transparency or hidden visibility only if z-index is high
        if (parseFloat(style.opacity) < 0.2 && parseFloat(style.opacity) > 0) { // very transparent but not fully hidden by opacity
             addSignal(`transparent_overlay_detected:${el.tagName}#${el.id}.${el.className}`);
        }
        if (style.visibility === 'hidden') {
            addSignal(`hidden_overlay_detected:${el.tagName}#${el.id}.${el.className}`);
        }
      }
       // Check for elements that might be overlays without extreme z-index but are fixed and cover large area
      if (style.position === 'fixed' &&
          (parseInt(style.width,10) > window.innerWidth * 0.8 || parseInt(style.height,10) > window.innerHeight * 0.8) &&
          (parseFloat(style.opacity) < 0.2 && parseFloat(style.opacity) > 0)
      ) {
          addSignal(`large_fixed_transparent_overlay:${el.tagName}#${el.id}.${el.className}`);
      }
    });
  };

  const mutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) { // Check if it's an element
            // Check against AI selectors
            aiToolSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                addSignal(`dynamic_selector_detected:${selector}`);
              } else if (node.querySelector && node.querySelector(selector)){ // check children too
                addSignal(`dynamic_selector_in_subtree_detected:${selector}`);
              }
            });

            // Check for overlay characteristics on dynamically added elements
            const style = window.getComputedStyle(node);
            if (parseInt(style.zIndex, 10) > 10000) {
              addSignal(`dynamic_high_z_index_detected:${node.tagName}#${node.id}.${node.className}`);
              if (parseFloat(style.opacity) < 0.2 && parseFloat(style.opacity) > 0) {
                   addSignal(`dynamic_transparent_overlay_detected:${node.tagName}#${node.id}.${node.className}`);
              }
              if (style.visibility === 'hidden') {
                  addSignal(`dynamic_hidden_overlay_detected:${node.tagName}#${node.id}.${node.className}`);
              }
            }
          }
        });
      }
    }
    // After processing mutations, check if enough signals are gathered
    // This is important because a single mutation might add multiple signals
    // or complete the required number of signals.
    sendAlert();
  };

  const observer = new MutationObserver(mutationCallback);

  const monitorPasteEvents = () => {
    document.addEventListener('paste', (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        addSignal('paste_event_detected');
        // Log timing: For now, just log the paste.
        // More sophisticated timing would require knowing when a question was presented.
        console.log(`Paste event on ${event.target.tagName} at ${new Date().toISOString()}`);
        sendAlert(); // Check if this paste event, possibly combined with others, triggers an alert
      }
    }, true); // Use capture phase to catch event early
  };

  // Main execution
  console.log("AI Usage Monitor: Starting...");

  // Start MutationObserver
  observer.observe(document.body, { childList: true, subtree: true });

  // Start paste monitoring
  monitorPasteEvents();

  // Periodic checks for selectors and overlays
  // requestIdleCallback is preferred for less critical background tasks
  const periodicCheck = () => {
    detectAISelectors();
    detectOverlays();
    sendAlert(); // Check signals after periodic checks

    // Schedule the next check
    if (window.requestIdleCallback) {
      window.requestIdleCallback(periodicCheck, { timeout: 1000 }); // timeout helps ensure it runs
    } else {
      setTimeout(periodicCheck, 1000);
    }
  };

  // Start periodic checks
  if (window.requestIdleCallback) {
    window.requestIdleCallback(periodicCheck, { timeout: 1000 });
  } else {
    setTimeout(periodicCheck, 1000);
  }

  // Ensure the function doesn't run multiple times if called again, though the plan is to call it once.
  // This basic example doesn't include complex re-initialization guards.
  // It's assumed to be called once as per requirements.
}
