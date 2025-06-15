
// Extend Window interface to include custom properties
declare global {
  interface Window {
    detectionLog?: any[];
    aiOverlayLog?: any[];
  }
}

export interface SessionState {
  candidateName: string;
  candidateType: 'Freshman Intern' | 'Pro/Competitive Coder';
  code: string;
  typingEvents: any[];
  sessionStartTime: number | null;
  liveDetectionFlags: string[];
  tabSwitches: number;
  finalDetectionResult: any;
  aiPasteEvents: any[];
  aiPasteDetector: any;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionData: Partial<SessionState> = {};

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize a clean session state
  initializeCleanSession(): Partial<SessionState> {
    this.clearAllSessionData();
    
    const cleanState: Partial<SessionState> = {
      candidateName: '',
      candidateType: 'Freshman Intern',
      code: '',
      typingEvents: [],
      sessionStartTime: null,
      liveDetectionFlags: [],
      tabSwitches: 0,
      finalDetectionResult: null,
      aiPasteEvents: [],
      aiPasteDetector: null
    };

    this.sessionData = cleanState;
    return cleanState;
  }

  // Clear all session-related data
  clearAllSessionData(): void {
    // Clear in-memory session data
    this.sessionData = {};

    // Clear localStorage/sessionStorage if used for session tracking
    this.clearStorageData();

    // Clear any temporary logs
    this.clearTemporaryLogs();

    console.log('Session data cleared successfully');
  }

  // Clear browser storage data related to session
  private clearStorageData(): void {
    // Remove specific session keys if they exist
    const sessionKeys = [
      'currentSession',
      'sessionFlags',
      'typingLogs',
      'aiPasteEvents',
      'detectionResults',
      'candidateData'
    ];

    sessionKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  // Clear any temporary log files (frontend only)
  private clearTemporaryLogs(): void {
    // Clear any cached detection logs with safe property access
    if (typeof window !== 'undefined') {
      if (window.detectionLog) {
        window.detectionLog = [];
      }

      // Reset AI overlay detection log if exists
      if (window.aiOverlayLog) {
        window.aiOverlayLog = [];
      }
    }
  }

  // Handle session end cleanup
  handleSessionEnd(): void {
    console.log('Handling session end - clearing all data');
    this.clearAllSessionData();
    
    // Optional: Send cleanup notification to backend
    this.notifyBackendSessionEnd();
  }

  // Handle tab close/page unload
  handlePageUnload(): void {
    console.log('Page unload detected - performing cleanup');
    this.clearAllSessionData();
  }

  // Optional: Notify backend about session end for cleanup
  private async notifyBackendSessionEnd(): Promise<void> {
    try {
      await fetch('/api/session/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cleanup',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.log('Backend cleanup notification failed (endpoint may not exist):', error);
    }
  }

  // Get current session state
  getSessionState(): Partial<SessionState> {
    return { ...this.sessionData };
  }

  // Update session state
  updateSessionState(updates: Partial<SessionState>): void {
    this.sessionData = { ...this.sessionData, ...updates };
  }
}

// Setup page unload listener
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    SessionManager.getInstance().handlePageUnload();
  });
}

export const sessionManager = SessionManager.getInstance();
