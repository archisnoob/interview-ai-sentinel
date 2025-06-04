
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Delete } from 'lucide-react';

interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength: number;
  position: number;
}

interface TypingAnalyzerProps {
  typingEvents: TypingEvent[];
  isActive: boolean;
  onRiskLevelChange: (level: 'low' | 'medium' | 'high') => void;
}

const TypingAnalyzer: React.FC<TypingAnalyzerProps> = ({ 
  typingEvents, 
  isActive, 
  onRiskLevelChange 
}) => {
  const [currentWPM, setCurrentWPM] = useState(0);
  const [avgWPM, setAvgWPM] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<string[]>([]);

  useEffect(() => {
    if (typingEvents.length === 0) return;

    // Calculate typing metrics
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const backspaces = keydownEvents.filter(e => e.key === 'Backspace').length;
    const pastes = typingEvents.filter(e => e.type === 'paste').length;
    
    setTotalKeystrokes(keydownEvents.length);
    setBackspaceCount(backspaces);
    setPasteCount(pastes);

    // Calculate WPM (Words Per Minute)
    if (keydownEvents.length >= 2) {
      const timeSpan = (keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp) / 1000 / 60;
      const wordsTyped = keydownEvents.length / 5; // Average 5 characters per word
      const wpm = timeSpan > 0 ? Math.round(wordsTyped / timeSpan) : 0;
      setCurrentWPM(wpm);
      setAvgWPM(wpm);
    }

    // Detect suspicious patterns
    const patterns: string[] = [];
    
    // Extremely fast typing (over 120 WPM sustained)
    if (currentWPM > 120) {
      patterns.push('Extremely fast typing detected');
    }
    
    // Multiple large pastes
    if (pastes > 2) {
      patterns.push('Multiple paste operations');
    }
    
    // Very low backspace ratio (too perfect)
    const backspaceRatio = backspaces / Math.max(keydownEvents.length, 1);
    if (backspaceRatio < 0.02 && keydownEvents.length > 50) {
      patterns.push('Unusually low error rate');
    }
    
    // Burst typing patterns (AI-like)
    const recentEvents = keydownEvents.slice(-20);
    if (recentEvents.length >= 10) {
      const intervals = [];
      for (let i = 1; i < recentEvents.length; i++) {
        intervals.push(recentEvents[i].timestamp - recentEvents[i-1].timestamp);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval < 50) { // Very consistent fast typing
        patterns.push('Robotic typing pattern detected');
      }
    }

    setSuspiciousPatterns(patterns);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (patterns.length >= 3 || currentWPM > 150 || pastes > 3) {
      riskLevel = 'high';
    } else if (patterns.length >= 1 || currentWPM > 100 || pastes > 1) {
      riskLevel = 'medium';
    }
    
    onRiskLevelChange(riskLevel);
  }, [typingEvents, currentWPM, onRiskLevelChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Typing Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive && (
          <div className="text-center text-gray-500 py-4">
            Start a session to begin monitoring
          </div>
        )}
        
        {isActive && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Current WPM</span>
                </div>
                <div className="text-2xl font-bold">{currentWPM}</div>
                <Progress value={Math.min(currentWPM / 2, 100)} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Avg WPM</span>
                </div>
                <div className="text-2xl font-bold">{avgWPM}</div>
                <Progress value={Math.min(avgWPM / 2, 100)} className="h-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold">{totalKeystrokes}</div>
                <div className="text-xs text-gray-600">Keystrokes</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold flex items-center justify-center">
                  <Delete className="h-4 w-4 mr-1" />
                  {backspaceCount}
                </div>
                <div className="text-xs text-gray-600">Backspaces</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-semibold">{pasteCount}</div>
                <div className="text-xs text-gray-600">Pastes</div>
              </div>
            </div>

            {suspiciousPatterns.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600">Suspicious Patterns</h4>
                <div className="space-y-1">
                  {suspiciousPatterns.map((pattern, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
