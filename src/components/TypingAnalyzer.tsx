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

  // Helper function to filter out modifier keys
  const shouldCountKey = (key?: string): boolean => {
    if (!key) return false;
    const modifierKeys = ['Shift', 'Control', 'Alt', 'CapsLock', 'Tab', 'Meta'];
    return !modifierKeys.includes(key);
  };

  useEffect(() => {
    if (typingEvents.length === 0) return;

    // Filter out modifier keys for keystroke counting
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown' && shouldCountKey(e.key));
    const backspaces = keydownEvents.filter(e => e.key === 'Backspace').length;
    const pastes = typingEvents.filter(e => e.type === 'paste').length;

    setTotalKeystrokes(keydownEvents.length);
    setBackspaceCount(backspaces);
    setPasteCount(pastes);

    // Calculate current WPM from recent typing (excluding modifier keys)
    if (keydownEvents.length >= 2) {
      const recent = keydownEvents.slice(-20); // Last 20 actual keystrokes
      if (recent.length >= 2) {
        const timeSpan = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 60;
        const wpm = timeSpan > 0 ? Math.round(recent.length / 5 / timeSpan) : 0;
        setCurrentWPM(wpm);

        // Check for suspicious WPM with no errors
        const recentBackspaces = recent.filter(e => e.key === 'Backspace').length;
        if (wpm > profile.thresholds.suspiciousWPM && recentBackspaces === 0 && recent.length >= 10) {
          onSuspiciousActivity(`Suspicious typing: ${wpm} WPM with 0 errors`);
        }
      }
    }

    // Count idle pauses (only between actual keystrokes, not modifier keys)
    let pauseCount = 0;
    for (let i = 1; i < keydownEvents.length; i++) {
      const pauseDuration = (keydownEvents[i].timestamp - keydownEvents[i - 1].timestamp) / 1000;
      if (pauseDuration > profile.thresholds.suspiciousIdlePause / 1000) {
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
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Live Typing Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isActive && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Start a session to begin monitoring
          </div>
        )}
        
        {isActive && (
          <>
            {/* WPM Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current WPM</span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentWPM}</span>
              </div>
              <Progress value={Math.min(currentWPM / 2, 100)} className="h-3" />
              {currentWPM > profile.thresholds.suspiciousWPM && (
                <Badge variant="destructive" className="text-xs font-medium">
                  High WPM detected
                </Badge>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Keystrokes */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {totalKeystrokes}
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                    Total Keystrokes
                  </div>
                </div>
              </div>
              
              {/* Backspaces */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50 transition-all hover:shadow-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-800 dark:text-orange-300 flex items-center justify-center mb-1">
                    <Delete className="h-5 w-5 mr-2" />
                    {backspaceCount}
                  </div>
                  <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    Backspaces
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Paste Events */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50 transition-all hover:shadow-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-1">
                    {pasteCount}
                  </div>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Paste Events
                  </div>
                </div>
              </div>
              
              {/* Idle Pauses */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50 transition-all hover:shadow-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300 flex items-center justify-center mb-1">
                    <Clock className="h-5 w-5 mr-2" />
                    {idlePauses}
                  </div>
                  <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                    Idle Pauses
                  </div>
                  {idlePauses > profile.thresholds.maxSuspiciousIdlePauses && (
                    <Badge variant="destructive" className="text-xs mt-2 font-medium">
                      Excessive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
