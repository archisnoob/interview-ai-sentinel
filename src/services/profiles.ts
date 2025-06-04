
export interface CandidateProfile {
  id: 'intern' | 'professional';
  name: string;
  thresholds: {
    normalInitialDelay: { min: number; max: number };
    suspiciousInitialDelay: number;
    suspiciousIdlePause: number;
    maxSuspiciousIdlePauses: number;
    suspiciousEditDelay: number;
    maxSuspiciousEditDelays: number;
    suspiciousWPM: number;
    largePasteChars: number;
    inactivityBeforePaste: number;
  };
}

export const CANDIDATE_PROFILES: Record<string, CandidateProfile> = {
  intern: {
    id: 'intern',
    name: 'Freshman Intern',
    thresholds: {
      normalInitialDelay: { min: 15, max: 60 },
      suspiciousInitialDelay: 75,
      suspiciousIdlePause: 40,
      maxSuspiciousIdlePauses: 2,
      suspiciousEditDelay: 60,
      maxSuspiciousEditDelays: 1,
      suspiciousWPM: 90,
      largePasteChars: 80,
      inactivityBeforePaste: 30
    }
  },
  professional: {
    id: 'professional',
    name: 'Pro/Competitive Coder',
    thresholds: {
      normalInitialDelay: { min: 5, max: 30 },
      suspiciousInitialDelay: 45,
      suspiciousIdlePause: 25,
      maxSuspiciousIdlePauses: 2,
      suspiciousEditDelay: 30,
      maxSuspiciousEditDelays: 1,
      suspiciousWPM: 90,
      largePasteChars: 80,
      inactivityBeforePaste: 30
    }
  }
};

export interface BehavioralMetrics {
  initialDelay: number | null;
  idlePauses: number[];
  editDelays: number[];
  pasteEvents: Array<{
    timestamp: number;
    chars: number;
    inactivityBefore: number;
  }>;
  typingBursts: Array<{
    startTime: number;
    endTime: number;
    characterCount: number;
    wpm: number;
    errorCount: number;
  }>;
  tabSwitches: number;
  detectionFlags: string[];
}

export class ProfileBasedDetection {
  static analyzeSession(
    profile: CandidateProfile,
    typingEvents: any[],
    code: string,
    sessionStartTime: number
  ): {
    verdict: 'Human' | 'Likely Bot' | 'AI Assisted';
    detectionFlags: string[];
    behavioralMetrics: BehavioralMetrics;
  } {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    const metrics: BehavioralMetrics = {
      initialDelay: null,
      idlePauses: [],
      editDelays: [],
      pasteEvents: [],
      typingBursts: [],
      tabSwitches: 0,
      detectionFlags: []
    };

    // Calculate initial delay
    if (keydownEvents.length > 0) {
      metrics.initialDelay = (keydownEvents[0].timestamp - sessionStartTime) / 1000;
      
      if (metrics.initialDelay > profile.thresholds.suspiciousInitialDelay) {
        metrics.detectionFlags.push(`Initial delay exceeded (${metrics.initialDelay.toFixed(1)}s > ${profile.thresholds.suspiciousInitialDelay}s)`);
      }
    }

    // Analyze idle pauses between typing
    if (keydownEvents.length > 1) {
      let currentBurstStart = keydownEvents[0].timestamp;
      let currentBurstChars = 0;
      let currentBurstErrors = 0;
      
      for (let i = 1; i < keydownEvents.length; i++) {
        const pauseDuration = (keydownEvents[i].timestamp - keydownEvents[i-1].timestamp) / 1000;
        
        if (pauseDuration > profile.thresholds.suspiciousIdlePause) {
          metrics.idlePauses.push(pauseDuration);
          
          // End current typing burst
          if (currentBurstChars > 0) {
            const burstDuration = (keydownEvents[i-1].timestamp - currentBurstStart) / 1000 / 60;
            const wpm = burstDuration > 0 ? (currentBurstChars / 5) / burstDuration : 0;
            
            metrics.typingBursts.push({
              startTime: currentBurstStart,
              endTime: keydownEvents[i-1].timestamp,
              characterCount: currentBurstChars,
              wpm: Math.round(wpm),
              errorCount: currentBurstErrors
            });
          }
          
          currentBurstStart = keydownEvents[i].timestamp;
          currentBurstChars = 0;
          currentBurstErrors = 0;
        } else {
          currentBurstChars++;
          if (keydownEvents[i].key === 'Backspace') {
            currentBurstErrors++;
          }
        }
      }
    }

    // Check for excessive idle pauses
    if (metrics.idlePauses.length > profile.thresholds.maxSuspiciousIdlePauses) {
      metrics.detectionFlags.push(`Excessive idle pauses (${metrics.idlePauses.length} > ${profile.thresholds.maxSuspiciousIdlePauses})`);
    }

    // Analyze paste events
    pasteEvents.forEach(pasteEvent => {
      const beforePause = keydownEvents.filter(e => e.timestamp < pasteEvent.timestamp);
      let inactivityBefore = 0;
      
      if (beforePause.length > 0) {
        const lastTyping = beforePause[beforePause.length - 1].timestamp;
        inactivityBefore = (pasteEvent.timestamp - lastTyping) / 1000;
      }
      
      const pasteSize = pasteEvent.textLength || 0;
      
      metrics.pasteEvents.push({
        timestamp: pasteEvent.timestamp,
        chars: pasteSize,
        inactivityBefore
      });

      // Flag large paste after inactivity
      if (pasteSize > profile.thresholds.largePasteChars && 
          inactivityBefore > profile.thresholds.inactivityBeforePaste) {
        metrics.detectionFlags.push(`Large paste (${pasteSize} chars) after ${inactivityBefore.toFixed(1)}s inactivity`);
      }
    });

    // Analyze typing speed and errors
    metrics.typingBursts.forEach(burst => {
      if (burst.wpm > profile.thresholds.suspiciousWPM && burst.errorCount === 0) {
        metrics.detectionFlags.push(`Suspicious typing: ${burst.wpm} WPM with 0 errors`);
      }
    });

    // Determine verdict
    let verdict: 'Human' | 'Likely Bot' | 'AI Assisted' = 'Human';
    
    const hasAIFlags = metrics.detectionFlags.some(flag => 
      flag.includes('Large paste') || 
      (flag.includes('WPM with 0 errors') && profile.id === 'intern')
    );
    
    if (hasAIFlags) {
      verdict = 'AI Assisted';
    } else if (metrics.detectionFlags.length >= 2) {
      verdict = 'Likely Bot';
    }

    return {
      verdict,
      detectionFlags: metrics.detectionFlags,
      behavioralMetrics: metrics
    };
  }
}
