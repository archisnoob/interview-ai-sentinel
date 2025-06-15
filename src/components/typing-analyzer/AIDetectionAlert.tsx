
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AIDetectionAlertProps {
  hasAIDetection: boolean;
}

const AIDetectionAlert: React.FC<AIDetectionAlertProps> = ({ hasAIDetection }) => {
  if (!hasAIDetection) {
    return null;
  }

  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          AI-generated content detected in paste events
        </p>
      </div>
    </div>
  );
};

export default AIDetectionAlert;
