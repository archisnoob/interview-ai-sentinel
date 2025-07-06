import React from 'react';
import { Badge } from '@/components/ui/badge';

interface FlagSummaryProps {
  sessionActive: boolean;
  liveDetectionFlags: string[];
}

export const FlagSummary: React.FC<FlagSummaryProps> = ({
  sessionActive,
  liveDetectionFlags
}) => {
  if (!sessionActive || liveDetectionFlags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-destructive-foreground">Live Detection Flags:</h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {liveDetectionFlags.slice(-5).map((flag, index) => (
          <Badge key={index} variant="destructive" className="text-xs block w-full">
            {flag}
          </Badge>
        ))}
      </div>
    </div>
  );
};