
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Clock, Delete } from 'lucide-react';
import { CandidateProfile } from '@/services/profiles';

interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength?: number;
  position?: number;
}

interface TypingAnalyzerProps {
  typingEvents: TypingEvent[];
  isActive: boolean;
  profile: CandidateProfile;
  onSuspiciousActivity: (activity: string) => void;
}

const TypingAnalyzer: React.FC<TypingAnalyzerProps> = ({ 
  typingEvents, 
  isActive, 
  profile,
  onSuspiciousActivity 
}) => {
  const [currentWPM, setCurrentWPM] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [idlePauses, setIdlePauses] = useState(0);

  useEffect(() => {
    if (typingEvents.length === 0) return;

    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const backspaces = keydownEvents.filter(e => e.key === 'Backspace').length;
    const pastes = typingEvents.filter(e => e.type === 'paste').length;
    
    setTotalKeystrokes(keydownEvents.length);
    setBackspaceCount(backspaces);
    setPasteCount(pastes);

    // Calculate current WPM from recent typing
    if (keydownEvents.length >= 2) {
      const recent = keydownEvents.slice(-20); // Last 20 keystrokes
      if (recent.length >= 2) {
        const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 60;
        const wpm = timeSpan > 0 ? Math.round((recent.length / 5) / timeSpan) : 0;
        setCurrentWPM(wpm);
        
        // Check for suspicious WPM with no errors
        const recentBackspaces = recent.filter(e => e.key === 'Backspace').length;
        if (wpm > profile.thresholds.suspiciousWPM && recentBackspaces === 0 && recent.length >= 10) {
          onSuspiciousActivity(`Suspicious typing: ${wpm} WPM with 0 errors`);
        }
      }
    }

    // Count idle pauses
    let pauseCount = 0;
    for (let i = 1; i < keydownEvents.length; i++) {
      const pauseDuration = (keydownEvents[i].timestamp - keydownEvents[i-1].timestamp) / 1000;
      if (pauseDuration > profile.thresholds.suspiciousIdlePause) {
        pauseCount++;
      }
    }
    setIdlePauses(pauseCount);

    // Check for excessive idle pauses
    if (pauseCount > profile.thresholds.maxSuspiciousIdlePauses) {
      onSuspiciousActivity(`Excessive idle pauses: ${pauseCount} > ${profile.thresholds.maxSuspiciousIdlePauses}`);
    }

  }, [typingEvents, profile, onSuspiciousActivity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Live Typing Analysis</span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Current WPM</span>
                </div>
                <span className="text-lg font-bold">{currentWPM}</span>
              </div>
              <Progress value={Math.min(currentWPM / 2, 100)} className="h-2" />
              {currentWPM > profile.thresholds.suspiciousWPM && (
                <Badge variant="destructive" className="text-xs">
                  High WPM detected
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold">{totalKeystrokes}</div>
                <div className="text-xs text-gray-600">Total Keystrokes</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold flex items-center justify-center">
                  <Delete className="h-4 w-4 mr-1" />
                  {backspaceCount}
                </div>
                <div className="text-xs text-gray-600">Backspaces</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold">{pasteCount}</div>
                <div className="text-xs text-blue-600">Paste Events</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {idlePauses}
                </div>
                <div className="text-xs text-yellow-600">Idle Pauses</div>
                {idlePauses > profile.thresholds.maxSuspiciousIdlePauses && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Excessive
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
