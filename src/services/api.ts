// Backend API service for handling cheating detection data
export interface SessionData {
  id: string;
  candidateName: string;
  candidateProfile?: string;
  code: string;
  typingEvents: TypingEvent[];
  duration: number;
  riskLevel: 'low' | 'medium' | 'high';
  verdict: 'human' | 'suspicious' | 'likely_bot' | 'ai_assisted';
  suspiciousActivities: string[];
  triggeredRules?: string[];
  timestamp: string;
  typingMetrics: {
    avgWPM: number;
    maxWPM: number;
    backspaceRatio: number;
    pasteCount: number;
  };
  behavioralMetrics?: {
    initialDelay: number | null;
    longPausesCount: number;
    editDelaysCount: number;
    typingBurstsCount: number;
  };
}

export interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength: number;
  position: number;
}

import { StorageService } from './storage';

class ApiService {
  private sessions: SessionData[] = [];

  constructor() {
    // Load existing sessions from localStorage on initialization
    this.sessions = StorageService.loadSessions();
  }

  // Enhanced save session with profile data
  async saveSession(sessionData: Omit<SessionData, 'id' | 'timestamp'>): Promise<SessionData> {
    const session: SessionData = {
      ...sessionData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      // Ensure backwards compatibility with existing data
      triggeredRules: sessionData.triggeredRules || sessionData.suspiciousActivities,
      candidateProfile: sessionData.candidateProfile || 'intern'
    };
    
    this.sessions.push(session);
    
    // Persist to localStorage
    StorageService.saveSessions(this.sessions);
    
    console.log('Enhanced session saved with profile data:', session);
    
    return session;
  }

  // Get all sessions
  async getSessions(): Promise<SessionData[]> {
    // Always load fresh data from storage
    this.sessions = StorageService.loadSessions();
    return this.sessions;
  }

  // Delete a session
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    StorageService.saveSessions(this.sessions);
  }

  // Clear all sessions
  async clearAllSessions(): Promise<void> {
    this.sessions = [];
    StorageService.clearSessions();
  }

  // Get session statistics
  getSessionStats() {
    return StorageService.getSessionStats();
  }

  // Enhanced AI detection logic
  analyzeForAIUsage(typingEvents: TypingEvent[], code: string): {
    verdict: 'human' | 'likely_bot' | 'ai_assisted';
    suspiciousActivities: string[];
    confidence: number;
  } {
    const suspiciousActivities: string[] = [];
    let suspicionScore = 0;

    // Analyze typing patterns
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    if (keydownEvents.length > 0) {
      // Calculate typing metrics
      const timeSpan = (keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp) / 1000 / 60;
      const wpm = timeSpan > 0 ? Math.round((keydownEvents.length / 5) / timeSpan) : 0;
      
      // AI-like typing speed (too fast)
      if (wpm > 120) {
        suspiciousActivities.push('Extremely fast typing speed');
        suspicionScore += 30;
      }
      
      // Calculate typing consistency (AI tends to be very consistent)
      const intervals = [];
      for (let i = 1; i < Math.min(keydownEvents.length, 50); i++) {
        intervals.push(keydownEvents[i].timestamp - keydownEvents[i-1].timestamp);
      }
      
      if (intervals.length > 10) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        
        if (standardDeviation < 20 && avgInterval < 100) {
          suspiciousActivities.push('Robotic typing consistency');
          suspicionScore += 25;
        }
      }
    }

    // Analyze paste behavior
    if (pasteEvents.length > 3) {
      suspiciousActivities.push('Multiple large paste operations');
      suspicionScore += 20;
    }

    // Analyze code patterns (AI-generated code characteristics)
    if (code.length > 50) {
      // Check for perfect syntax (no common human errors)
      const commonHumanErrors = /console\.log|debugger|todo|temp|test/gi;
      if (!commonHumanErrors.test(code) && code.length > 100) {
        suspiciousActivities.push('Unusually clean code without debug statements');
        suspicionScore += 15;
      }

      // Check for AI-like commenting patterns
      const commentPattern = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
      const comments = code.match(commentPattern) || [];
      if (comments.length > 0) {
        const hasAICommentStyle = comments.some(comment => 
          comment.includes('This function') || 
          comment.includes('algorithm') ||
          comment.toLowerCase().includes('efficient')
        );
        if (hasAICommentStyle) {
          suspiciousActivities.push('AI-style commenting detected');
          suspicionScore += 10;
        }
      }

      // Check for complete solutions without iterations
      const backspaceCount = typingEvents.filter(e => e.key === 'Backspace').length;
      const backspaceRatio = backspaceCount / Math.max(keydownEvents.length, 1);
      if (backspaceRatio < 0.02 && code.length > 200) {
        suspiciousActivities.push('Unusually low error rate');
        suspicionScore += 20;
      }
    }

    // Determine verdict based on suspicion score
    let verdict: 'human' | 'likely_bot' | 'ai_assisted';
    if (suspicionScore >= 50) {
      verdict = 'ai_assisted';
    } else if (suspicionScore >= 25) {
      verdict = 'likely_bot';
    } else {
      verdict = 'human';
    }

    return {
      verdict,
      suspiciousActivities,
      confidence: Math.min(suspicionScore, 100)
    };
  }

  // Export sessions data
  exportSessions(sessions: SessionData[]): void {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      summary: {
        human: sessions.filter(s => s.verdict === 'human').length,
        suspicious: sessions.filter(s => s.verdict === 'suspicious').length,
        likelyBot: sessions.filter(s => s.verdict === 'likely_bot').length,
        aiAssisted: sessions.filter(s => s.verdict === 'ai_assisted').length,
      },
      profileBreakdown: {
        intern: sessions.filter(s => s.candidateProfile === 'intern').length,
        professional: sessions.filter(s => s.candidateProfile === 'professional').length,
      },
      sessions: sessions.map(session => ({
        ...session,
        typingEvents: session.typingEvents.length, // Only include count for export
        triggeredRules: session.triggeredRules || session.suspiciousActivities
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile_based_detection_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
