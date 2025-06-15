
import { sessionState } from './sessionState';

let _startScanLoop = () => { console.error("startScanLoop callback has not been registered."); };

export function registerScanLoop(startFn) {
    _startScanLoop = startFn;
}

export function setDetectionSessionActive(active) {
  sessionState.sessionActive = active;
  if (active) {
    sessionState.aiWarningShown = false;
    sessionState.lastAlertTime = 0;
    console.log('AI detection activated for session');
    if (typeof window !== "undefined") {
      if (!window.__aiScanIntervalActive__) {
        window.__aiScanIntervalActive__ = true;
        _startScanLoop();
      }
    }
  } else {
    console.log('AI detection deactivated');
    window.__aiScanIntervalActive__ = false;
  }
}
