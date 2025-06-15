export interface AIPasteEvent {
  timestamp: string;
  sessionId: string;
  pasteLength: number;
  pauseBeforePaste: boolean;
  typingBurst: boolean;
  looksGPTPattern: boolean;
  timeSinceLastKey: number;
}

export class AIPasteDetector {
  private lastKeystrokeTime: number = 0;
  private keystrokeTimestamps: number[] = [];
  private sessionId: string = '';
  
  // GPT-like patterns to detect AI-generated content
  private static readonly GPT_PATTERNS = [
    /let me explain/i,
    /here's the code/i,
    /here's how you can/i,
    /to solve this problem/i,
    /you can try this approach/i,
    /here's a solution/i,
    /this approach will/i,
    /the solution is/i,
    /you can implement/i,
    /here's what you need/i,
    /this code will/i,
    /the following code/i,
    /this function will/i,
    /you can use this/i,
    /simply use the/i
  ];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  // Track keystroke timing for burst detection
  recordKeystroke(): void {
    const now = Date.now();
    this.lastKeystrokeTime = now;
    
    // Keep only recent keystrokes (last 2 seconds)
    this.keystrokeTimestamps = this.keystrokeTimestamps.filter(
      timestamp => now - timestamp <= 2000
    );
    this.keystrokeTimestamps.push(now);
  }

  // Detect if recent keystrokes constitute a burst
  private detectTypingBurst(): boolean {
    const now = Date.now();
    const recentKeystrokes = this.keystrokeTimestamps.filter(
      timestamp => now - timestamp <= 500
    );
    
    // 20+ characters in 500ms indicates possible automated input
    return recentKeystrokes.length >= 20;
  }

  // Check if paste content matches GPT-like patterns
  private detectGPTPattern(pastedText: string): boolean {
    if (pastedText.length < 150) return false;
    
    return AIPasteDetector.GPT_PATTERNS.some(pattern => 
      pattern.test(pastedText)
    );
  }

  // Analyze paste event and return detection result
  analyzePaste(pastedText: string): AIPasteEvent {
    const now = Date.now();
    const timeSinceLastKey = this.lastKeystrokeTime > 0 ? now - this.lastKeystrokeTime : 0;
    
    const pasteEvent: AIPasteEvent = {
      timestamp: new Date(now).toISOString(),
      sessionId: this.sessionId,
      pasteLength: pastedText.length,
      pauseBeforePaste: timeSinceLastKey >= 3000, // 3+ seconds idle
      typingBurst: this.detectTypingBurst(),
      looksGPTPattern: this.detectGPTPattern(pastedText),
      timeSinceLastKey
    };

    // Log detection for debugging
    if (pasteEvent.looksGPTPattern || pasteEvent.pauseBeforePaste || pasteEvent.pasteLength > 200) {
      console.log('AI Paste Detection:', pasteEvent);
    }

    return pasteEvent;
  }

  // Reset detector state (useful when starting new session)
  reset(): void {
    this.lastKeystrokeTime = 0;
    this.keystrokeTimestamps = [];
  }
}
