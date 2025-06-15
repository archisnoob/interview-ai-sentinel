import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Clock, Clipboard, PauseCircle, AlertTriangle } from 'lucide-react';
import { TypingEvent } from '@/services/api';
import { CandidateProfile } from '@/services/profiles';
import { AIPasteEvent } from '@/services/aiPasteDetector';

interface TypingAnalyzerProps {
  typingEvents: TypingEvent[];
  isActive: boolean;
  profile: CandidateProfile;
  onSuspiciousActivity: (activity: string) => void;
  aiPasteEvents?: AIPasteEvent[];
}

const TypingAnalyzer: React.FC<TypingAnalyzerProps> = ({
  typingEvents,
  isActive,
  profile,
  onSuspiciousActivity,
  aiPasteEvents = []
}) => {
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [idlePauses, setIdlePauses] = useState(0);
  const [avgWPM, setAvgWPM] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setTotalKeystrokes(0);
      setBackspaceCount(0);
      setPasteCount(0);
      setIdlePauses(0);
      setAvgWPM(0);
      setLastActivityTime(null);
      return;
    }

    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const backspaces = keydownEvents.filter(e => e.key === 'Backspace');
    const pastes = typingEvents.filter(e => e.type === 'paste');

    setTotalKeystrokes(keydownEvents.length);
    setBackspaceCount(backspaces.length);
    setPasteCount(pastes.length);

    // Calculate idle pauses
    let pauses = 0;
    for (let i = 1; i < keydownEvents.length; i++) {
      const gap = keydownEvents[i].timestamp - keydownEvents[i-1].timestamp;
      if (gap > profile.thresholds.maxIdlePauseMs) {
        pauses++;
      }
    }
    setIdlePauses(pauses);

    // Calculate WPM
    if (keydownEvents.length > 0) {
      const timeSpan = (keydownEvents[keydownEvents.length - 1].timestamp - keydownEvents[0].timestamp) / 1000 / 60;
      if (timeSpan > 0) {
        const wpm = Math.round((keydownEvents.length / 5) / timeSpan);
        setAvgWPM(wpm);
      }
    }

    setLastActivityTime(Date.now());
  }, [typingEvents, isActive, profile.thresholds.maxIdlePauseMs]);

  // Check for AI-related suspicious activities
  const hasAIContent = aiPasteEvents.some(event => event.looksGPTPattern);
  const hasSuspiciousPauses = aiPasteEvents.some(event => event.pauseBeforePaste && event.pasteLength >= 200);

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 transition-colors">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-gray-100">
          <div className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Live Typing Analysis</span>
          </div>
          {(hasAIContent || hasSuspiciousPauses) && (
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Typing analysis inactive
          </div>
        )}
        
        {isActive && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Total Keystrokes */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40 p-6 rounded-xl border border-blue-200 dark:border-blue-700/50 transition-all hover:shadow-lg hover:scale-[1.02] duration-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200 flex items-center justify-center mb-3">
                    <Keyboard className="h-6 w-6 mr-2" />
                    {totalKeystrokes}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide">
                    Total Keystrokes
                  </div>
                  {avgWPM > 0 && (
                    <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      {avgWPM} WPM avg
                    </div>
                  )}
                </div>
              </div>
              
              {/* Backspaces */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/40 p-6 rounded-xl border border-orange-200 dark:border-orange-700/50 transition-all hover:shadow-lg hover:scale-[1.02] duration-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-800 dark:text-orange-200 flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 mr-2" />
                    {backspaceCount}
                  </div>
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-300 uppercase tracking-wide">
                    Backspaces
                  </div>
                  {totalKeystrokes > 0 && (
                    <div className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                      {Math.round((backspaceCount / totalKeystrokes) * 100)}% error rate
                    </div>
                  )}
                </div>
              </div>
              
              {/* Paste Events */}
              <div className={`bg-gradient-to-br ${hasAIContent ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/40' : 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/40'} p-6 rounded-xl border ${hasAIContent ? 'border-red-200 dark:border-red-700/50' : 'border-purple-200 dark:border-purple-700/50'} transition-all hover:shadow-lg hover:scale-[1.02] duration-200`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${hasAIContent ? 'text-red-800 dark:text-red-200' : 'text-purple-800 dark:text-purple-200'} flex items-center justify-center mb-3`}>
                    <Clipboard className="h-6 w-6 mr-2" />
                    {pasteCount}
                  </div>
                  <div className={`text-xs font-semibold ${hasAIContent ? 'text-red-600 dark:text-red-300' : 'text-purple-600 dark:text-purple-300'} uppercase tracking-wide`}>
                    Paste Events
                  </div>
                  {hasAIContent && (
                    <Badge variant="destructive" className="text-xs mt-2 font-medium">
                      ⚠ AI Content
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Idle Pauses */}
              <div className={`bg-gradient-to-br ${hasSuspiciousPauses ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/40' : 'from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/60'} p-6 rounded-xl border ${hasSuspiciousPauses ? 'border-red-200 dark:border-red-700/50' : 'border-gray-200 dark:border-gray-600/50'} transition-all hover:shadow-lg hover:scale-[1.02] duration-200`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${hasSuspiciousPauses ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-gray-200'} flex items-center justify-center mb-3`}>
                    <PauseCircle className="h-6 w-6 mr-2" />
                    {idlePauses}
                  </div>
                  <div className={`text-xs font-semibold ${hasSuspiciousPauses ? 'text-red-600 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'} uppercase tracking-wide`}>
                    Idle Pauses
                  </div>
                  {hasSuspiciousPauses && (
                    <Badge variant="destructive" className="text-xs mt-2 font-medium">
                      Suspicious Pattern
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <strong className="text-gray-700 dark:text-gray-300">Profile:</strong> {profile.name} | 
              <strong className="text-gray-700 dark:text-gray-300 ml-2">Max Idle:</strong> {profile.thresholds.maxIdlePauseMs / 1000}s | 
              <strong className="text-gray-700 dark:text-gray-300 ml-2">AI Detection:</strong> Active
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
