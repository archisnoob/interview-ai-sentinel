import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface SessionControlsProps {
  candidateName: string;
  setCandidateName: (name: string) => void;
  candidateType: 'Freshman Intern' | 'Pro/Competitive Coder';
  setCandidateType: (type: 'Freshman Intern' | 'Pro/Competitive Coder') => void;
  sessionActive: boolean;
  startSession: () => void;
  endSession: () => void;
  resetSession: () => void;
  liveDetectionFlags: string[];
  hasAIDetection: boolean;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  candidateName,
  setCandidateName,
  candidateType,
  setCandidateType,
  sessionActive,
  startSession,
  endSession,
  resetSession,
  liveDetectionFlags,
  hasAIDetection
}) => {
  const getVerdictColor = () => {
    if (liveDetectionFlags.length === 0) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (liveDetectionFlags.length >= 2) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getVerdictIcon = () => {
    if (liveDetectionFlags.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (liveDetectionFlags.length >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Interview Platform</h2>
        <div className="flex items-center space-x-2">
          <Badge className={getVerdictColor()}>
            {getVerdictIcon()}
            <span className="ml-1">
              {liveDetectionFlags.length === 0 ? 'Normal' : liveDetectionFlags.length >= 2 ? 'High Risk' : 'Suspicious'}
            </span>
          </Badge>
          {sessionActive && liveDetectionFlags.length > 0 && (
            <Badge variant="outline" className="border-border text-muted-foreground">
              {liveDetectionFlags.length} flags
            </Badge>
          )}
          {hasAIDetection && (
            <Badge variant="destructive" className="text-xs">
              ⚠ AI Content
            </Badge>
          )}
        </div>
      </div>

      {/* Form inputs and session controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input 
          type="text" 
          placeholder="Candidate Name" 
          value={candidateName} 
          onChange={e => setCandidateName(e.target.value)} 
          className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground" 
          disabled={sessionActive} 
        />
        
        <Select 
          value={candidateType} 
          onValueChange={(value: 'Freshman Intern' | 'Pro/Competitive Coder') => setCandidateType(value)} 
          disabled={sessionActive}
        >
          <SelectTrigger className="bg-background border-input text-foreground">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Select Candidate Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="Freshman Intern" className="text-popover-foreground">Freshman Intern</SelectItem>
            <SelectItem value="Pro/Competitive Coder" className="text-popover-foreground">Pro/Competitive Coder</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex space-x-2">
          {!sessionActive ? (
            <Button onClick={startSession} className="flex-1">
              Start Session
            </Button>
          ) : (
            <Button onClick={endSession} variant="destructive" className="flex-1">
              End Session
            </Button>
          )}
          {!sessionActive && (
            <Button onClick={resetSession} variant="outline" className="px-3">
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      {!sessionActive && (
        <div className="p-3 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20">
          <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
            Selected Profile: {candidateType}
          </h4>
          <div className="grid grid-cols-3 gap-4 text-xs text-blue-700 dark:text-blue-300">
            <div>
              <strong>Initial Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '75' : '45'}s
            </div>
            <div>
              <strong>Idle Pause:</strong> &lt;{candidateType === 'Freshman Intern' ? '40' : '25'}s
            </div>
            <div>
              <strong>Edit Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '60' : '30'}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
};