
import { StorageService } from './storage';
import { SessionConfig } from '@/types/config'; // Ensure SessionConfig is imported

// 1. Update SessionData interface
export interface SessionData {
  id: string;
  candidateName: string;
  candidateType: 'Freshman Intern' | 'Pro/Competitive Coder';
  code: string;
  typingEvents: TypingEvent[];
  duration: number;
  verdict: 'Human' | 'Likely Bot' | 'AI Assisted';
  detectionFlags: string[];
  timestamp: string;
  typingStats: {
    totalWPM: number;
    totalTime: number;
    linesOfCode: number;
    typingBursts: number;
  };
  // New fields for extension status and config used during the session
  finalExtensionStatus?: 'Connected' | 'Inactive' | 'Not Connected' | 'Not Required';
  config?: Pick<SessionConfig, 'enableExtensionCheck' | 'profile'>; // Store relevant parts of config
}

export interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength?: number;
  position?: number;
}

class ApiService {
  private sessions: SessionData[] = [];

  constructor() {
    this.sessions = StorageService.loadSessions();
  }

  async saveSession(sessionData: Omit<SessionData, 'id' | 'timestamp'>): Promise<SessionData> {
    const session: SessionData = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    
    this.sessions.push(session);
    StorageService.saveSessions(this.sessions);
    
    // console.log('Session saved:', session); // Keep for debugging if needed
    
    return session;
  }

  async getSessions(): Promise<SessionData[]> {
    this.sessions = StorageService.loadSessions();
    // Ensure loaded sessions conform to the new SessionData structure if they were saved before this change.
    // For now, we assume new sessions will have these fields, and old ones might have them as undefined.
    return this.sessions.map(s => ({
        ...s, // Spread existing properties
        // Provide default for finalExtensionStatus if not present (for old data)
        finalExtensionStatus: s.finalExtensionStatus || 'Not Required',
        // Provide default for config if not present
        config: s.config || { enableExtensionCheck: false, profile: "Freshman Intern" }
    }));
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    StorageService.saveSessions(this.sessions);
  }

  async clearAllSessions(): Promise<void> {
    this.sessions = [];
    StorageService.clearSessions();
  }

  exportSessions(sessions: SessionData[]): void {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      summary: {
        human: sessions.filter(s => s.verdict === 'Human').length,
        likelyBot: sessions.filter(s => s.verdict === 'Likely Bot').length,
        aiAssisted: sessions.filter(s => s.verdict === 'AI Assisted').length,
      },
      candidateBreakdown: {
        intern: sessions.filter(s => s.candidateType === 'Freshman Intern').length,
        professional: sessions.filter(s => s.candidateType === 'Pro/Competitive Coder').length,
      },
      sessions: sessions.map(session => ({
        ...session,
        typingEventsCount: session.typingEvents.length, // Example: simplify typingEvents for export
        // typingEvents: session.typingEvents.length // Original, might be too verbose
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_detection_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
