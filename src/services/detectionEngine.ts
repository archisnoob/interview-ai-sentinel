
import { TypingEvent } from './api';

export interface DetectionResult {
  riskLevel: 'low' | 'medium' | 'high';
  verdict: 'human' | 'likely_bot' | 'ai_assisted';
  suspiciousActivities: string[];
  confidence: number;
  detailedMetrics: {
    avgWPM: number;
    maxWPM: number;
    minWPM: number;
    typingConsistency: number;
    backspaceRatio: number;
    pasteCount: number;
    burstTypingEvents: number;
    longPauses: number;
  };
}

export class DetectionEngine {
  static analyze(typingEvents: TypingEvent[], code: string, sessionDuration: number): DetectionResult {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    const backspaceEvents = keydownEvents.filter(e => e.key === 'Backspace');

    // Calculate detailed metrics
    const metrics = this.calculateMetrics(typingEvents, sessionDuration);
    
    // Run detection algorithms
    const suspiciousActivities: string[] = [];
    let suspicionScore = 0;
    let forceAIAssisted = false;

    // NEW: Per-type flag throttling
    const MAX_FLAGS_PER_TYPE = 5;
    const flagCountPerType: { [key: string]: number } = {};

    const tryAddActivity = (type: string, activity: string, score: number = 0): boolean => {
      const currentCount = flagCountPerType[type] || 0;
      if (currentCount < MAX_FLAGS_PER_TYPE) {
        suspiciousActivities.push(activity);
        suspicionScore += score;
        flagCountPerType[type] = currentCount + 1;
        return true;
      }
      return false;
    };

    console.log("=== Detection Engine Analysis ===");
    console.log("Metrics:", metrics);

    // NEW FEATURE 1 & 2: Large paste detection with bypass prevention
    const hasUserTyped = keydownEvents.length > 0;
    const largePasteEvents = pasteEvents.filter(e => (e.textLength || 0) >= 160);
    
    if (largePasteEvents.length > 0) {
      const activity = `Large paste content detected (≥160 chars)`;
      if (tryAddActivity('large_paste', activity)) {
        forceAIAssisted = true;
        console.log("Flag: Large paste detected - forcing AI Assisted verdict");
      }
      
      if (hasUserTyped) {
        if (tryAddActivity('paste_after_typing', 'Pasted AI code after initial manual typing')) {
          console.log("Flag: Manual typing before large paste detected");
        }
      }
    }

    // Speed analysis
    if (metrics.avgWPM > 120) {
      const activity = `Extremely fast average typing: ${metrics.avgWPM} WPM`;
      if (tryAddActivity('high_avg_wpm', activity, 30)) {
        console.log("Flag: High average WPM +30");
      }
    }
    if (metrics.maxWPM > 200) {
      const activity = `Unrealistic peak typing speed: ${metrics.maxWPM} WPM`;
      if (tryAddActivity('peak_wpm', activity, 25)) {
        console.log("Flag: Unrealistic peak WPM +25");
      }
    }

    // Consistency analysis
    if (metrics.typingConsistency > 0.8 && metrics.avgWPM > 80) {
      if (tryAddActivity('robotic_consistency', 'Robotic typing consistency detected', 20)) {
        console.log("Flag: Robotic consistency +20");
      }
    }

    // Error rate analysis
    if (metrics.backspaceRatio < 0.02 && code.length > 100) {
      const activity = `Unnaturally low error rate: ${(metrics.backspaceRatio * 100).toFixed(1)}%`;
      if (tryAddActivity('low_error_rate', activity, 15)) {
        console.log("Flag: Low error rate +15");
      }
    }

    // Paste behavior
    if (metrics.pasteCount > 2) {
      const activity = `Multiple paste operations: ${metrics.pasteCount}`;
      if (tryAddActivity('multiple_pastes', activity, 10 * metrics.pasteCount)) {
        console.log(`Flag: Multiple pastes +${10 * metrics.pasteCount}`);
      }
    }

    // Burst typing detection
    if (metrics.burstTypingEvents > 3) {
      if (tryAddActivity('burst_typing', 'Multiple burst typing patterns detected', 15)) {
        console.log("Flag: Burst typing +15");
      }
    }

    // Code pattern analysis
    const codeAnalysis = this.analyzeCodePatterns(code);
    const codeAnalysisType = 'code_analysis_event';
    const currentCodeAnalysisCount = flagCountPerType[codeAnalysisType] || 0;
    
    if (currentCodeAnalysisCount < MAX_FLAGS_PER_TYPE) {
      if (codeAnalysis.suspiciousPatterns.length > 0) {
        suspiciousActivities.push(...codeAnalysis.suspiciousPatterns);
        suspicionScore += codeAnalysis.suspicionScore;
        flagCountPerType[codeAnalysisType] = currentCodeAnalysisCount + 1;
        if (codeAnalysis.suspicionScore > 0) {
          console.log(`Flag: Code patterns +${codeAnalysis.suspicionScore}`);
        }
      }
    }

    console.log("Suspicion Score:", suspicionScore);
    console.log("Suspicious Activities:", suspiciousActivities);

    // Determine risk level and verdict with large paste override
    let riskLevel: 'low' | 'medium' | 'high';
    let verdict: 'human' | 'likely_bot' | 'ai_assisted';

    if (forceAIAssisted) {
      riskLevel = 'high';
      verdict = 'ai_assisted';
    } else if (suspicionScore >= 45) {
      riskLevel = 'high';
      verdict = 'ai_assisted';
    } else if (suspicionScore >= 15) {
      riskLevel = 'medium';
      verdict = 'likely_bot';
    } else {
      riskLevel = 'low';
      verdict = 'human';
    }

    console.log("Final Verdict:", verdict, "Risk Level:", riskLevel);
    console.log("=== End Analysis ===");

    return {
      riskLevel,
      verdict,
      suspiciousActivities,
      confidence: suspicionScore,
      detailedMetrics: metrics
    };
  }

  private static calculateMetrics(typingEvents: TypingEvent[], sessionDuration: number) {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    const backspaceEvents = keydownEvents.filter(e => e.key === 'Backspace');

    if (keydownEvents.length === 0) {
      return {
        avgWPM: 0, maxWPM: 0, minWPM: 0, typingConsistency: 0,
        backspaceRatio: 0, pasteCount: 0, burstTypingEvents: 0, longPauses: 0
      };
    }

    // Calculate WPM over time windows
    const windowSize = 10000; // 10 seconds
    const wpmWindows: number[] = [];
    
    for (let i = 0; i < keydownEvents.length - 5; i += 5) {
      const windowEvents = keydownEvents.slice(i, i + 10);
      if (windowEvents.length >= 2) {
        const timeSpan = (windowEvents[windowEvents.length - 1].timestamp - windowEvents[0].timestamp) / 1000 / 60;
        if (timeSpan > 0) {
          const wpm = (windowEvents.length / 5) / timeSpan;
          wpmWindows.push(wpm);
        }
      }
    }

    const avgWPM = wpmWindows.length > 0 ? wpmWindows.reduce((a, b) => a + b, 0) / wpmWindows.length : 0;
    const maxWPM = wpmWindows.length > 0 ? Math.max(...wpmWindows) : 0;
    const minWPM = wpmWindows.length > 0 ? Math.min(...wpmWindows) : 0;

    // Calculate typing consistency (lower variance = more consistent = more suspicious)
    const variance = wpmWindows.length > 1 ? 
      wpmWindows.reduce((sum, wpm) => sum + Math.pow(wpm - avgWPM, 2), 0) / wpmWindows.length : 0;
    const standardDeviation = Math.sqrt(variance);
    const typingConsistency = avgWPM > 0 ? Math.max(0, 1 - (standardDeviation / avgWPM)) : 0;

    // Calculate burst typing events (very fast consecutive keystrokes)
    let burstTypingEvents = 0;
    for (let i = 0; i < keydownEvents.length - 10; i++) {
      const burst = keydownEvents.slice(i, i + 10);
      const burstDuration = burst[9].timestamp - burst[0].timestamp;
      if (burstDuration < 1000) { // 10 characters in less than 1 second
        burstTypingEvents++;
        i += 5; // Skip ahead to avoid counting overlapping bursts
      }
    }

    // Calculate long pauses (suspicious if too few)
    let longPauses = 0;
    for (let i = 1; i < keydownEvents.length; i++) {
      const gap = keydownEvents[i].timestamp - keydownEvents[i-1].timestamp;
      if (gap > 2000) { // Pause longer than 2 seconds
        longPauses++;
      }
    }

    return {
      avgWPM: Math.round(avgWPM),
      maxWPM: Math.round(maxWPM),
      minWPM: Math.round(minWPM),
      typingConsistency: Math.round(typingConsistency * 100) / 100,
      backspaceRatio: backspaceEvents.length / Math.max(keydownEvents.length, 1),
      pasteCount: pasteEvents.length,
      burstTypingEvents,
      longPauses
    };
  }

  private static analyzeCodePatterns(code: string): { suspiciousPatterns: string[]; suspicionScore: number } {
    const patterns: string[] = [];
    let score = 0;

    if (code.length < 10) return { suspiciousPatterns: patterns, suspicionScore: score };

    // Check for AI-typical perfect formatting
    const lines = code.split('\n');
    const properlyIndentedLines = lines.filter(line => 
      line.trim() === '' || line.match(/^[\s]*[a-zA-Z]/)).length;
    
    if (lines.length > 5 && properlyIndentedLines / lines.length > 0.9) {
      patterns.push('Perfect code formatting detected');
      score += 10;
    }

    // Check for AI-style variable naming
    const aiVariablePattern = /\b(result|output|input|data|value|item|element|current|next|previous)\b/gi;
    const aiMatches = code.match(aiVariablePattern);
    if (aiMatches && aiMatches.length > 3) {
      patterns.push('AI-typical variable naming patterns');
      score += 8;
    }

    // Check for complete algorithm implementation without trial-and-error
    const functionCount = (code.match(/function|def|\=\>/g) || []).length;
    const commentCount = (code.match(/\/\/|\/\*|\#/g) || []).length;
    
    if (functionCount > 0 && commentCount / functionCount > 1.5) {
      patterns.push('Overly documented code (AI characteristic)');
      score += 5;
    }

    // Check for lack of debugging traces
    const debugPattern = /console\.log|print|debug|todo|fixme|temp/gi;
    if (code.length > 200 && !debugPattern.test(code)) {
      patterns.push('No debugging traces in substantial code');
      score += 12;
    }

    return { suspiciousPatterns: patterns, suspicionScore: score };
  }
}
