import { AIPasteEvent } from './aiPasteDetector';

export interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'paste';
  key?: string;
  textLength?: number;
  position?: number;
}

export interface SessionData {
  id: string;
  candidateName: string;
  candidateType: string;
  code: string;
  typingEvents: TypingEvent[];
  duration: number;
  verdict: string;
  detectionFlags: string[];
  typingStats?: {
    totalWPM: number;
    totalTime: number;
    linesOfCode: number;
    typingBursts: number;
  };
  timestamp: string;
  aiPasteEvents?: AIPasteEvent[]; // New field for AI paste detection
}

export class ApiService {
  private sessions: SessionData[] = [];

  async saveSession(sessionData: Omit<SessionData, 'id' | 'timestamp'>): Promise<void> {
    const session: SessionData = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    
    this.sessions.push(session);
    console.log('Session saved:', session);
    
    // Simulate API delay
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  async getSessions(): Promise<SessionData[]> {
    // Simulate API delay
    return new Promise(resolve => 
      setTimeout(() => resolve([...this.sessions]), 100)
    );
  }

  exportSessions(sessions: SessionData[]): void {
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cheating_detection_sessions_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
