
import React from 'react';
import { GaugeCircle } from 'lucide-react';

interface WpmDisplayProps {
  wpm: number;
  isActive: boolean;
}

const WpmDisplay: React.FC<WpmDisplayProps> = ({ wpm, isActive }) => {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700/50 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-lg">
          <GaugeCircle className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Current WPM</p>
          <p className={`text-lg font-bold text-gray-900 dark:text-gray-100`}>
            {isActive ? wpm.toFixed(0) : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WpmDisplay;
