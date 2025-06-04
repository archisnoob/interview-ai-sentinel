
export interface CandidateProfile {
  id: 'intern' | 'professional';
  name: string;
  thresholds: {
    normalPause: { min: number; max: number };
    suspiciousPause: number;
    normalEditDelay: { min: number; max: number };
    suspiciousEditDelay: number;
    normalInitialDelay: { min: number; max: number };
    suspiciousInitialDelay: number;
    maxSuspiciousPauses: number;
    maxSuspiciousEditDelays: number;
    suspiciousWPM: number;
    inactivityThreshold: number;
  };
}

export const CANDIDATE_PROFILES: Record<string, CandidateProfile> = {
  intern: {
    id: 'intern',
    name: 'Freshman Intern',
    thresholds: {
      normalPause: { min: 10, max: 30 },
      suspiciousPause: 40,
      normalEditDelay: { min: 15, max: 45 },
      suspiciousEditDelay: 60,
      normalInitialDelay: { min: 15, max: 60 },
      suspiciousInitialDelay: 75,
      maxSuspiciousPauses: 2,
      maxSuspiciousEditDelays: 1,
      suspiciousWPM: 90,
      inactivityThreshold: 60
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional/Competitive Coder',
    thresholds: {
      normalPause: { min: 5, max: 15 },
      suspiciousPause: 25,
      normalEditDelay: { min: 5, max: 20 },
      suspiciousEditDelay: 30,
      normalInitialDelay: { min: 5, max: 30 },
      suspiciousInitialDelay: 45,
      maxSuspiciousPauses: 2,
      maxSuspiciousEditDelays: 1,
      suspiciousWPM: 90,
      inactivityThreshold: 60
    }
  }
};

export interface BehavioralMetrics {
  initialDelay: number | null;
  longPauses: number[];
  editDelays: number[];
  typingBursts: Array<{
    startTime: number;
    endTime: number;
    characterCount: number;
    wpm: number;
  }>;
  suspiciousActivities: Array<{
    type: string;
    timestamp: number;
    details: string;
    ruleTriggered: string;
  }>;
}

export class ProfileBasedDetection {
  static analyzeSession(
    profile: CandidateProfile,
    typingEvents: any[],
    code: string,
    sessionStartTime: number
  ): {
    verdict: 'human' | 'suspicious' | 'likely_bot' | 'ai_assisted';
    confidence: number;
    triggeredRules: string[];
    behavioralMetrics: BehavioralMetrics;
  } {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    const metrics: BehavioralMetrics = {
      initialDelay: null,
      longPauses: [],
      editDelays: [],
      typingBursts: [],
      suspiciousActivities: []
    };

    const triggeredRules: string[] = [];
    let suspicionScore = 0;

    // Calculate initial delay
    if (keydownEvents.length > 0) {
      metrics.initialDelay = (keydownEvents[0].timestamp - sessionStartTime) / 1000;
      
      if (metrics.initialDelay > profile.thresholds.suspiciousInitialDelay) {
        const rule = `Initial delay exceeded (${metrics.initialDelay.toFixed(1)}s > ${profile.thresholds.suspiciousInitialDelay}s)`;
        triggeredRules.push(rule);
        metrics.suspiciousActivities.push({
          type: 'initial_delay',
          timestamp: keydownEvents[0].timestamp,
          details: `Took ${metrics.initialDelay.toFixed(1)} seconds to start typing`,
          ruleTriggered: rule
        });
        suspicionScore += 20;
      }
    }

    // Analyze pauses and typing bursts
    if (keydownEvents.length > 1) {
      let currentBurstStart = keydownEvents[0].timestamp;
      let currentBurstChars = 0;
      
      for (let i = 1; i < keydownEvents.length; i++) {
        const pauseDuration = (keydownEvents[i].timestamp - keydownEvents[i-1].timestamp) / 1000;
        
        if (pauseDuration > profile.thresholds.suspiciousPause) {
          metrics.longPauses.push(pauseDuration);
          
          // End current burst and start new one
          if (currentBurstChars > 0) {
            const burstDuration = (keydownEvents[i-1].timestamp - currentBurstStart) / 1000 / 60;
            const wpm = burstDuration > 0 ? (currentBurstChars / 5) / burstDuration : 0;
            
            metrics.typingBursts.push({
              startTime: currentBurstStart,
              endTime: keydownEvents[i-1].timestamp,
              characterCount: currentBurstChars,
              wpm: Math.round(wpm)
            });
          }
          
          currentBurstStart = keydownEvents[i].timestamp;
          currentBurstChars = 0;
        } else {
          currentBurstChars++;
        }
      }
    }

    // Check for too many long pauses
    if (metrics.longPauses.length > profile.thresholds.maxSuspiciousPauses) {
      const rule = `Excessive long pauses (${metrics.longPauses.length} > ${profile.thresholds.maxSuspiciousPauses})`;
      triggeredRules.push(rule);
      metrics.suspiciousActivities.push({
        type: 'excessive_pauses',
        timestamp: Date.now(),
        details: `${metrics.longPauses.length} pauses exceeding ${profile.thresholds.suspiciousPause}s`,
        ruleTriggered: rule
      });
      suspicionScore += 25;
    }

    // Analyze typing speed patterns
    metrics.typingBursts.forEach(burst => {
      if (burst.wpm > profile.thresholds.suspiciousWPM) {
        const rule = `Suspicious typing speed (${burst.wpm} WPM > ${profile.thresholds.suspiciousWPM} WPM)`;
        if (!triggeredRules.includes(rule)) {
          triggeredRules.push(rule);
          metrics.suspiciousActivities.push({
            type: 'high_speed_typing',
            timestamp: burst.startTime,
            details: `Typing burst at ${burst.wpm} WPM`,
            ruleTriggered: rule
          });
          suspicionScore += 20;
        }
      }
    });

    // Check for large code blocks after inactivity
    pasteEvents.forEach(pasteEvent => {
      const beforePause = keydownEvents.filter(e => e.timestamp < pasteEvent.timestamp);
      if (beforePause.length > 0) {
        const lastTyping = beforePause[beforePause.length - 1].timestamp;
        const inactivityDuration = (pasteEvent.timestamp - lastTyping) / 1000;
        
        if (inactivityDuration > profile.thresholds.inactivityThreshold) {
          const rule = `Large code block after ${inactivityDuration.toFixed(1)}s inactivity`;
          triggeredRules.push(rule);
          metrics.suspiciousActivities.push({
            type: 'code_after_inactivity',
            timestamp: pasteEvent.timestamp,
            details: `Paste event after ${inactivityDuration.toFixed(1)}s of inactivity`,
            ruleTriggered: rule
          });
          suspicionScore += 30;
        }
      }
    });

    // Determine verdict based on triggered rules and score
    let verdict: 'human' | 'suspicious' | 'likely_bot' | 'ai_assisted';
    
    if (suspicionScore >= 60 || triggeredRules.length >= 3) {
      verdict = 'ai_assisted';
    } else if (suspicionScore >= 40 || triggeredRules.length >= 2) {
      verdict = 'likely_bot';
    } else if (suspicionScore >= 20 || triggeredRules.length >= 1) {
      verdict = 'suspicious';
    } else {
      verdict = 'human';
    }

    return {
      verdict,
      confidence: Math.min(suspicionScore, 100),
      triggeredRules,
      behavioralMetrics: metrics
    };
  }
}
