
import { sessionState } from './sessionState';

export function setDetectionSessionActive(active) {
  sessionState.sessionActive = active;
  if (active) {
    sessionState.aiWarningShown = false;
    sessionState.lastAlertTime = 0;
    console.log('AI detection activated for session');
  } else {
    console.log('AI detection deactivated');
  }
}
