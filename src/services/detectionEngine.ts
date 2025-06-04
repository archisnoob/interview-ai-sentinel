
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

    // Speed analysis
    if (metrics.avgWPM > 120) {
      suspiciousActivities.push(`Extremely fast average typing: ${metrics.avgWPM} WPM`);
      suspicionScore += 30;
    }
    if (metrics.maxWPM > 200) {
      suspiciousActivities.push(`Unrealistic peak typing speed: ${metrics.maxWPM} WPM`);
      suspicionScore += 25;
    }

    // Consistency analysis
    if (metrics.typingConsistency > 0.8 && metrics.avgWPM > 80) {
      suspiciousActivities.push('Robotic typing consistency detected');
      suspicionScore += 20;
    }

    // Error rate analysis
    if (metrics.backspaceRatio < 0.02 && code.length > 100) {
      suspiciousActivities.push(`Unnaturally low error rate: ${(metrics.backspaceRatio * 100).toFixed(1)}%`);
      suspicionScore += 15;
    }

    // Paste behavior
    if (metrics.pasteCount > 2) {
      suspiciousActivities.push(`Multiple paste operations: ${metrics.pasteCount}`);
      suspicionScore += 10 * metrics.pasteCount;
    }

    // Burst typing detection
    if (metrics.burstTypingEvents > 3) {
      suspiciousActivities.push('Multiple burst typing patterns detected');
      suspicionScore += 15;
    }

    // Code pattern analysis
    const codeAnalysis = this.analyzeCodePatterns(code);
    suspiciousActivities.push(...codeAnalysis.suspiciousPatterns);
    suspicionScore += codeAnalysis.suspicionScore;

    // Determine risk level and verdict
    const riskLevel = suspicionScore >= 50 ? 'high' : suspicionScore >= 25 ? 'medium' : 'low';
    const verdict = suspicionScore >= 60 ? 'ai_assisted' : suspicionScore >= 30 ? 'likely_bot' : 'human';

    return {
      riskLevel,
      verdict,
      suspiciousActivities,
      confidence: Math.min(suspicionScore, 100),
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
