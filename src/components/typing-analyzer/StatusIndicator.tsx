
import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusIndicatorProps {
  isActive: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ isActive }) => {
  return (
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
  );
};

export default StatusIndicator;
