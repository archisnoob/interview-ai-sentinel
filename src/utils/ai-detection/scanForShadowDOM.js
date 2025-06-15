
import { sessionState } from './sessionState';
import { isDevSafeEnvironment } from './isDevSafeEnvironment';
import { logDetection } from './logging';

// Check for shadow DOM (only during active session)
export const scanForShadowDOM = (node) => {
    if (!sessionState.sessionActive || isDevSafeEnvironment()) return;
    
    if (node.shadowRoot && !sessionState.shadowDOMNodes.has(node)) {
      sessionState.shadowDOMNodes.add(node);
      logDetection('shadow_dom_detected', {
        tagName: node.tagName,
        className: node.className,
        id: node.id
      });
    }
};
