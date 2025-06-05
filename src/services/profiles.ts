
export interface CandidateProfile {
  name: string;
  thresholds: {
    suspiciousInitialDelay: number;
    suspiciousIdlePause: number;
    maxSuspiciousIdlePauses: number;
    suspiciousEditDelay: number;
    maxSuspiciousEditDelays: number;
    largePasteChars: number;
    suspiciousWPM: number;
    suspiciousTabSwitches: number;
  };
}

export const CANDIDATE_PROFILES: Record<string, CandidateProfile> = {
  intern: {
    name: 'Freshman Intern',
    thresholds: {
      suspiciousInitialDelay: 75000, // 75 seconds
      suspiciousIdlePause: 40000, // 40 seconds
      maxSuspiciousIdlePauses: 2,
      suspiciousEditDelay: 60000, // 60 seconds
      maxSuspiciousEditDelays: 1,
      largePasteChars: 80,
      suspiciousWPM: 90,
      suspiciousTabSwitches: 3
    }
  },
  professional: {
    name: 'Pro/Competitive Coder',
    thresholds: {
      suspiciousInitialDelay: 45000, // 45 seconds
      suspiciousIdlePause: 25000, // 25 seconds
      maxSuspiciousIdlePauses: 2,
      suspiciousEditDelay: 30000, // 30 seconds
      maxSuspiciousEditDelays: 1,
      largePasteChars: 80,
      suspiciousWPM: 90,
      suspiciousTabSwitches: 3
    }
  }
};

export interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength?: number;
  position?: number;
}

export interface DetectionFlag {
  type: string;
  message: string;
  severity: number;
  timestamp: number;
}

export interface AnalysisResult {
  verdict: 'Human' | 'Likely Bot' | 'AI Assisted';
  detectionFlags: DetectionFlag[];
  behavioralMetrics: {
    initialDelay: number;
    idlePauses: number[];
    editDelays: number[];
    typingBursts: { start: number; end: number; wpm: number }[];
    pasteEvents: number;
    averageWPM: number;
    totalTypingTime: number;
  };
  severityScore: number;
}

export class SessionVerdictEngine {
  static analyzeSession(
    profile: CandidateProfile,
    typingEvents: TypingEvent[],
    code: string,
    sessionStartTime: number
  ): AnalysisResult {
    const detectionFlags: DetectionFlag[] = [];
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    // Calculate behavioral metrics
    const initialDelay = keydownEvents.length > 0 ? 
      keydownEvents[0].timestamp - sessionStartTime : 0;
    
    const idlePauses = this.calculateIdlePauses(keydownEvents);
    const editDelays = this.calculateEditDelays(keydownEvents);
    const typingBursts = this.calculateTypingBursts(keydownEvents);
    const averageWPM = this.calculateAverageWPM(keydownEvents);
    const totalTypingTime = keydownEvents.length > 1 ? 
      (keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp) / 1000 : 0;

    // Check initial delay
    if (initialDelay > profile.thresholds.suspiciousInitialDelay) {
      detectionFlags.push({
        type: 'initial_delay',
        message: `Suspicious initial delay: ${(initialDelay / 1000).toFixed(1)}s`,
        severity: 2,
        timestamp: Date.now()
      });
    }

    // Check idle pauses
    const longPauses = idlePauses.filter(pause => pause > profile.thresholds.suspiciousIdlePause);
    if (longPauses.length > profile.thresholds.maxSuspiciousIdlePauses) {
      detectionFlags.push({
        type: 'idle_pauses',
        message: `Excessive idle pauses: ${longPauses.length} > ${profile.thresholds.maxSuspiciousIdlePauses}`,
        severity: 2,
        timestamp: Date.now()
      });
    }

    // Check edit delays
    const longEditDelays = editDelays.filter(delay => delay > profile.thresholds.suspiciousEditDelay);
    if (longEditDelays.length > profile.thresholds.maxSuspiciousEditDelays) {
      detectionFlags.push({
        type: 'edit_delay',
        message: `Suspicious edit delays: ${longEditDelays.length} > ${profile.thresholds.maxSuspiciousEditDelays}`,
        severity: 2,
        timestamp: Date.now()
      });
    }

    // Check paste events
    pasteEvents.forEach(pasteEvent => {
      if (pasteEvent.textLength && pasteEvent.textLength > profile.thresholds.largePasteChars) {
        // Check if there was no typing in the last 30 seconds before paste
        const recentTyping = keydownEvents.filter(e => 
          pasteEvent.timestamp - e.timestamp < 30000
        );
        
        if (recentTyping.length === 0) {
          detectionFlags.push({
            type: 'large_paste',
            message: `Large paste after inactivity: ${pasteEvent.textLength} characters`,
            severity: 3,
            timestamp: Date.now()
          });
        }
      }
    });

    // Check burst typing (high WPM with no errors)
    typingBursts.forEach(burst => {
      if (burst.wpm > profile.thresholds.suspiciousWPM) {
        // Check for errors in this burst (backspace events)
        const burstEvents = keydownEvents.filter(e => 
          e.timestamp >= burst.start && e.timestamp <= burst.end
        );
        const backspaces = burstEvents.filter(e => e.key === 'Backspace');
        
        if (backspaces.length === 0 && burstEvents.length >= 10) {
          detectionFlags.push({
            type: 'burst_typing',
            message: `Suspicious typing burst: ${burst.wpm} WPM with 0 errors`,
            severity: 2,
            timestamp: Date.now()
          });
        }
      }
    });

    // Calculate total severity score
    const severityScore = detectionFlags.reduce((total, flag) => total + flag.severity, 0);

    // Determine final verdict using new logic
    const verdict = this.calculateVerdict(detectionFlags, severityScore, code, initialDelay, typingBursts.length);

    return {
      verdict,
      detectionFlags,
      behavioralMetrics: {
        initialDelay,
        idlePauses,
        editDelays,
        typingBursts,
        pasteEvents: pasteEvents.length,
        averageWPM,
        totalTypingTime
      },
      severityScore
    };
  }

  private static calculateVerdict(
    flags: DetectionFlag[], 
    severityScore: number, 
    code: string, 
    initialDelay: number,
    typingBursts: number
  ): 'Human' | 'Likely Bot' | 'AI Assisted' {
    const linesOfCode = code.split('\n').length;
    const hasPaste = flags.some(f => f.type === 'large_paste');
    const hasInitialDelay = flags.some(f => f.type === 'initial_delay');

    // Special case: Initial delay > 75s AND code pasted (lines > 20, typing bursts = 0)
    if (initialDelay > 75000 && hasPaste && linesOfCode > 20 && typingBursts === 0) {
      return 'AI Assisted';
    }

    // Severity-based scoring
    if (severityScore >= 6) {
      return 'Likely Bot';
    }
    
    if (severityScore >= 4) {
      return 'AI Assisted';
    }

    // Multiple detection flags (more than 1)
    if (flags.length > 1) {
      return 'Likely Bot';
    }

    // Single low-severity flag (severity <= 2)
    if (flags.length === 1 && flags[0].severity <= 2) {
      return 'Human';
    }

    // No flags or very low severity
    return 'Human';
  }

  private static calculateIdlePauses(keydownEvents: TypingEvent[]): number[] {
    const pauses: number[] = [];
    
    for (let i = 1; i < keydownEvents.length; i++) {
      const pause = keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp;
      if (pause > 2000) { // Only count pauses > 2 seconds
        pauses.push(pause);
      }
    }
    
    return pauses;
  }

  private static calculateEditDelays(keydownEvents: TypingEvent[]): number[] {
    const delays: number[] = [];
    let lastSignificantEdit = 0;
    
    for (let i = 0; i < keydownEvents.length; i++) {
      const event = keydownEvents[i];
      
      // Consider significant edits (not just single character changes)
      if (event.key && event.key.length === 1) { // Regular character
        if (lastSignificantEdit > 0) {
          const delay = event.timestamp - lastSignificantEdit;
          if (delay > 5000) { // Only count delays > 5 seconds
            delays.push(delay);
          }
        }
        lastSignificantEdit = event.timestamp;
      }
    }
    
    return delays;
  }

  private static calculateTypingBursts(keydownEvents: TypingEvent[]): Array<{ start: number; end: number; wpm: number }> {
    const bursts: Array<{ start: number; end: number; wpm: number }> = [];
    let burstStart = 0;
    let burstEvents: TypingEvent[] = [];
    
    for (let i = 0; i < keydownEvents.length; i++) {
      const event = keydownEvents[i];
      
      if (burstEvents.length === 0) {
        burstStart = event.timestamp;
        burstEvents = [event];
      } else {
        const timeSinceLastEvent = event.timestamp - burstEvents[burstEvents.length - 1].timestamp;
        
        if (timeSinceLastEvent < 2000) { // Within 2 seconds = same burst
          burstEvents.push(event);
        } else {
          // End current burst and calculate WPM
          if (burstEvents.length >= 5) { // Minimum 5 keystrokes for a burst
            const duration = (burstEvents[burstEvents.length - 1].timestamp - burstStart) / 1000 / 60;
            const wpm = duration > 0 ? Math.round((burstEvents.length / 5) / duration) : 0;
            
            bursts.push({
              start: burstStart,
              end: burstEvents[burstEvents.length - 1].timestamp,
              wpm
            });
          }
          
          // Start new burst
          burstStart = event.timestamp;
          burstEvents = [event];
        }
      }
    }
    
    // Handle final burst
    if (burstEvents.length >= 5) {
      const duration = (burstEvents[burstEvents.length - 1].timestamp - burstStart) / 1000 / 60;
      const wpm = duration > 0 ? Math.round((burstEvents.length / 5) / duration) : 0;
      
      bursts.push({
        start: burstStart,
        end: burstEvents[burstEvents.length - 1].timestamp,
        wpm
      });
    }
    
    return bursts;
  }

  private static calculateAverageWPM(keydownEvents: TypingEvent[]): number {
    if (keydownEvents.length < 2) return 0;
    
    const duration = (keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp) / 1000 / 60;
    return duration > 0 ? Math.round((keydownEvents.length / 5) / duration) : 0;
  }
}

// Backwards compatibility
export const ProfileBasedDetection = SessionVerdictEngine;
