
/**
 * CopyingDetection.ts
 * 
 * Standalone copying detection module for AI cheating detection system.
 * 
 * Assumptions:
 * - Keystroke logs contain timestamp and character data
 * - Sentence delimiters: \n, ;, {, }
 * - Similarity threshold of 0.85 indicates potential copying
 * - Rhythmic patterns with std dev < 1.5 and mean gap > 4s are suspicious
 * - Module operates independently without affecting existing detection systems
 */

export interface Keystroke {
  timestamp: number;
  char: string;
}

export interface SentenceLog {
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface CopyingDetectionConfig {
  features?: {
    copyingDetection?: boolean;
  };
  similarityThreshold?: number;
  rhythmicStdDevThreshold?: number;
  rhythmicMeanGapThreshold?: number;
  durationDifferenceThreshold?: number;
}

export interface CopyingSuspicionResult {
  copyingSuspicionScore: number;
  metadata: {
    suspiciousPairs: number;
    rhythmicTypingDetected: boolean;
    averageGap: number;
    stdDevGap: number;
  };
}

interface SuspiciousPair {
  sentence1Index: number;
  sentence2Index: number;
  similarity: number;
  durationDifference: number;
}

/**
 * Segments keystroke log into sentences based on delimiters
 */
function segmentIntoSentences(keystrokeLog: Keystroke[]): SentenceLog[] {
  if (keystrokeLog.length === 0) return [];
  
  const delimiters = new Set(['\n', ';', '{', '}']);
  const sentences: SentenceLog[] = [];
  let currentText = '';
  let sentenceStartTime = keystrokeLog[0].timestamp;
  
  for (let i = 0; i < keystrokeLog.length; i++) {
    const keystroke = keystrokeLog[i];
    currentText += keystroke.char;
    
    if (delimiters.has(keystroke.char) || i === keystrokeLog.length - 1) {
      const trimmedText = currentText.trim();
      
      if (trimmedText.length > 0) {
        sentences.push({
          text: trimmedText,
          startTime: sentenceStartTime,
          endTime: keystroke.timestamp,
          duration: keystroke.timestamp - sentenceStartTime
        });
      }
      
      // Reset for next sentence
      currentText = '';
      if (i < keystrokeLog.length - 1) {
        sentenceStartTime = keystroke.timestamp;
      }
    }
  }
  
  return sentences;
}

/**
 * Tokenizes text for similarity comparison
 */
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Calculates cosine similarity between two tokenized sentences
 */
function calculateCosineSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  // Create vocabulary
  const vocab = new Set([...tokens1, ...tokens2]);
  
  // Create vectors
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  for (const word of vocab) {
    vector1.push(tokens1.filter(token => token === word).length);
    vector2.push(tokens2.filter(token => token === word).length);
  }
  
  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Finds suspicious sentence pairs based on similarity and duration
 */
function findSuspiciousPairs(
  sentences: SentenceLog[], 
  config: CopyingDetectionConfig
): SuspiciousPair[] {
  const suspiciousPairs: SuspiciousPair[] = [];
  const similarityThreshold = config.similarityThreshold || 0.85;
  const durationThreshold = config.durationDifferenceThreshold || 2000; // 2 seconds
  
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const sentence1 = sentences[i];
      const sentence2 = sentences[j];
      
      const tokens1 = tokenize(sentence1.text);
      const tokens2 = tokenize(sentence2.text);
      
      const similarity = calculateCosineSimilarity(tokens1, tokens2);
      const durationDifference = Math.abs(sentence1.duration - sentence2.duration);
      
      if (similarity > similarityThreshold && durationDifference < durationThreshold) {
        suspiciousPairs.push({
          sentence1Index: i,
          sentence2Index: j,
          similarity,
          durationDifference
        });
      }
    }
  }
  
  return suspiciousPairs;
}

/**
 * Calculates standard deviation of an array of numbers
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Detects rhythmic typing patterns
 */
function detectRhythmicPatterns(
  sentences: SentenceLog[], 
  suspiciousPairs: SuspiciousPair[],
  config: CopyingDetectionConfig
): { detected: boolean; averageGap: number; stdDevGap: number } {
  if (sentences.length < 2) {
    return { detected: false, averageGap: 0, stdDevGap: 0 };
  }
  
  const gaps: number[] = [];
  
  for (let i = 1; i < sentences.length; i++) {
    const gap = sentences[i].startTime - sentences[i - 1].endTime;
    gaps.push(gap);
  }
  
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const stdDevGap = calculateStandardDeviation(gaps);
  
  const rhythmicStdDevThreshold = config.rhythmicStdDevThreshold || 1500; // 1.5 seconds
  const rhythmicMeanGapThreshold = config.rhythmicMeanGapThreshold || 4000; // 4 seconds
  
  const detected = stdDevGap < rhythmicStdDevThreshold && 
                  averageGap > rhythmicMeanGapThreshold && 
                  suspiciousPairs.length >= 2;
  
  return { detected, averageGap, stdDevGap };
}

/**
 * Calculates the copying suspicion score
 */
function calculateSuspicionScore(
  sentences: SentenceLog[],
  suspiciousPairs: SuspiciousPair[],
  rhythmicDetected: boolean
): number {
  let score = 0;
  
  // Base score from suspicious pairs
  score += 0.2 * suspiciousPairs.length;
  
  // Bonus for rhythmic pattern
  if (rhythmicDetected) {
    score += 0.4;
  }
  
  // Check for fast typing of long sentences
  if (sentences.length > 0) {
    const avgLength = sentences.reduce((sum, s) => sum + s.text.length, 0) / sentences.length;
    const avgTime = sentences.reduce((sum, s) => sum + s.duration, 0) / sentences.length;
    
    if (avgLength > 50 && avgTime < 5000) { // 5 seconds
      score += 0.2;
    }
  }
  
  // Clamp to maximum 1.0
  return Math.min(score, 1.0);
}

/**
 * Main exported function for copying detection
 */
export function getCopyingSuspicionScore(
  keystrokeLog: Keystroke[],
  config: CopyingDetectionConfig = {}
): CopyingSuspicionResult {
  // Check if copying detection is enabled
  if (!config.features?.copyingDetection) {
    return {
      copyingSuspicionScore: 0,
      metadata: {
        suspiciousPairs: 0,
        rhythmicTypingDetected: false,
        averageGap: 0,
        stdDevGap: 0
      }
    };
  }
  
  // Segment keystroke log into sentences
  const sentences = segmentIntoSentences(keystrokeLog);
  
  if (sentences.length === 0) {
    return {
      copyingSuspicionScore: 0,
      metadata: {
        suspiciousPairs: 0,
        rhythmicTypingDetected: false,
        averageGap: 0,
        stdDevGap: 0
      }
    };
  }
  
  // Find suspicious pairs
  const suspiciousPairs = findSuspiciousPairs(sentences, config);
  
  // Detect rhythmic patterns
  const rhythmicResult = detectRhythmicPatterns(sentences, suspiciousPairs, config);
  
  // Calculate suspicion score
  const copyingSuspicionScore = calculateSuspicionScore(
    sentences, 
    suspiciousPairs, 
    rhythmicResult.detected
  );
  
  return {
    copyingSuspicionScore,
    metadata: {
      suspiciousPairs: suspiciousPairs.length,
      rhythmicTypingDetected: rhythmicResult.detected,
      averageGap: rhythmicResult.averageGap,
      stdDevGap: rhythmicResult.stdDevGap
    }
  };
}

// Unit test helper functions (exported for testing purposes)
export const testHelpers = {
  segmentIntoSentences,
  tokenize,
  calculateCosineSimilarity,
  findSuspiciousPairs,
  calculateStandardDeviation,
  detectRhythmicPatterns,
  calculateSuspicionScore
};
