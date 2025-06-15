
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Copy, Pause, AlertTriangle, Brain } from 'lucide-react';
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
  const [stats, setStats] = useState({
    totalKeystrokes: 0,
    backspaces: 0,
    pasteEvents: 0,
    idlePauses: 0
  });

  // Calculate typing statistics
  useEffect(() => {
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown');
    const backspaceEvents = keydownEvents.filter(e => e.key === 'Backspace');
    const pasteEvents = typingEvents.filter(e => e.type === 'paste');
    
    // Calculate idle pauses (gaps > suspiciousIdlePause threshold)
    let idlePauses = 0;
    for (let i = 1; i < typingEvents.length; i++) {
      const timeDiff = typingEvents[i].timestamp - typingEvents[i-1].timestamp;
      if (timeDiff > profile.thresholds.suspiciousIdlePause * 1000) {
        idlePauses++;
      }
    }

    setStats({
      totalKeystrokes: keydownEvents.length,
      backspaces: backspaceEvents.length,
      pasteEvents: pasteEvents.length,
      idlePauses
    });

    // Check for suspicious patterns
    if (idlePauses > profile.thresholds.maxSuspiciousIdlePauses) {
      onSuspiciousActivity(`Excessive idle pauses detected: ${idlePauses}`);
    }

    // Check for paste events exceeding threshold
    const largePastes = pasteEvents.filter(e => (e.textLength || 0) > profile.thresholds.largePasteChars);
    if (largePastes.length > 0) {
      largePastes.forEach(paste => {
        onSuspiciousActivity(`Large paste detected: ${paste.textLength} characters`);
      });
    }

  }, [typingEvents, profile, onSuspiciousActivity]);

  // Check for AI-related suspicious activity
  const hasAIDetection = aiPasteEvents.some(event => 
    event.looksGPTPattern || (event.pauseBeforePaste && event.pasteLength >= 200)
  );

  const getStatColor = (value: number, threshold: number) => {
    if (value === 0) return 'text-gray-500 dark:text-gray-400';
    if (value >= threshold) return 'text-red-600 dark:text-red-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>Live Typing Analysis</span>
          {hasAIDetection && (
            <Badge variant="destructive" className="ml-2 text-xs">
              <Brain className="h-3 w-3 mr-1" />
              AI Detected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stat Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Keystrokes */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Keystrokes</p>
                  <p className={`text-lg font-bold ${getStatColor(stats.totalKeystrokes, 200)}`}>
                    {stats.totalKeystrokes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Backspaces */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded-lg">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Backspaces</p>
                  <p className={`text-lg font-bold ${getStatColor(stats.backspaces, 20)}`}>
                    {stats.backspaces}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Paste Events */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg">
                  <Copy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Paste Events</p>
                  <p className={`text-lg font-bold ${getStatColor(stats.pasteEvents, 2)}`}>
                    {stats.pasteEvents}
                    {hasAIDetection && (
                      <AlertTriangle className="inline h-4 w-4 ml-1 text-red-500" />
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Idle Pauses */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-700/50 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
                  <Pause className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Idle Pauses</p>
                  <p className={`text-lg font-bold ${getStatColor(stats.idlePauses, profile.thresholds.maxSuspiciousIdlePauses)}`}>
                    {stats.idlePauses}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Detection Alert */}
        {hasAIDetection && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                AI-generated content detected in paste events
              </p>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {isActive ? 'Monitoring Active' : 'Session Inactive'}
            </span>
          </div>
          {isActive && (
            <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
