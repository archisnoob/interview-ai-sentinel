
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Copy, AlertTriangle, Brain, Keyboard, ArrowLeft, Pause } from 'lucide-react';
import { TypingEvent } from '@/services/api';
import { CandidateProfile } from '@/services/profiles';
import { AIPasteEvent } from '@/services/aiPasteDetector';

import { useWpm } from './typing-analyzer/hooks/useWpm';
import { useTypingStats } from './typing-analyzer/hooks/useTypingStats';
import StatCard from './typing-analyzer/StatCard';
import WpmDisplay from './typing-analyzer/WpmDisplay';
import AIDetectionAlert from './typing-analyzer/AIDetectionAlert';
import StatusIndicator from './typing-analyzer/StatusIndicator';

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
  const wpm = useWpm(typingEvents, isActive);
  const { stats, keystrokeData, backspaceData } = useTypingStats(
    typingEvents,
    profile,
    onSuspiciousActivity,
    isActive
  );

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
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Keyboard className="h-4 w-4 text-white" />}
            title="Total Keystrokes"
            value={stats.totalKeystrokes}
            valueColor={getStatColor(stats.totalKeystrokes, 200)}
            isActive={isActive}
            sparklineData={keystrokeData}
            sparklineColor="#3b82f6"
            containerClasses="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50"
            iconContainerClasses="bg-blue-600 dark:bg-blue-500"
            titleClasses="text-blue-700 dark:text-blue-300"
          />
          <StatCard
            icon={<ArrowLeft className="h-4 w-4 text-white" />}
            title="Backspaces"
            value={stats.backspaces}
            valueColor={getStatColor(stats.backspaces, 20)}
            isActive={isActive}
            sparklineData={backspaceData}
            sparklineColor="#f97316"
            containerClasses="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700/50"
            iconContainerClasses="bg-orange-600 dark:bg-orange-500"
            titleClasses="text-orange-700 dark:text-orange-300"
          />
          <StatCard
            icon={<Copy className="h-4 w-4 text-white" />}
            title="Paste Events"
            value={stats.pasteEvents}
            valueColor={getStatColor(stats.pasteEvents, 2)}
            isActive={isActive}
            containerClasses="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700/50"
            iconContainerClasses="bg-purple-600 dark:bg-purple-500"
            titleClasses="text-purple-700 dark:text-purple-300"
          >
            {hasAIDetection && (
              <AlertTriangle className="inline h-4 w-4 ml-1 text-red-500" />
            )}
          </StatCard>
          <StatCard
            icon={<Pause className="h-4 w-4 text-white" />}
            title="Idle Pauses"
            value={stats.idlePauses}
            valueColor={getStatColor(stats.idlePauses, profile.thresholds.maxSuspiciousIdlePauses)}
            isActive={isActive}
            containerClasses="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border border-green-200 dark:border-green-700/50"
            iconContainerClasses="bg-green-600 dark:bg-green-500"
            titleClasses="text-green-700 dark:text-green-300"
          />
        </div>

        <WpmDisplay wpm={wpm} isActive={isActive} />

        <AIDetectionAlert hasAIDetection={hasAIDetection} />

        <StatusIndicator isActive={isActive} />
      </CardContent>
    </Card>
  );
};

export default TypingAnalyzer;
