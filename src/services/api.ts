
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
}

export interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength?: number;
  position?: number;
}

import { StorageService } from './storage';

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
    
    console.log('Session saved:', session);
    
    return session;
  }

  async getSessions(): Promise<SessionData[]> {
    this.sessions = StorageService.loadSessions();
    return this.sessions;
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
        typingEvents: session.typingEvents.length
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
