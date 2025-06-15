
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GaugeCircle } from 'lucide-react';

interface TypingSpeedMonitorProps {
  speed: number;
  isActive: boolean;
}

const TypingSpeedMonitor: React.FC<TypingSpeedMonitorProps> = ({ speed, isActive }) => {
  if (!isActive) {
    return (
        <Card className="bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Typing Speed</CardTitle>
                <GaugeCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">-.- c/s</div>
                <p className="text-xs text-gray-400 dark:text-gray-500">characters/sec</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden shadow-lg border-none 
                   bg-gradient-to-br from-violet-500 to-pink-500
                   dark:from-purple-700 dark:to-purple-500 
                   dark:ring-1 dark:ring-purple-400/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-white">Typing Speed</CardTitle>
            <GaugeCircle className="h-4 w-4 text-white" />
        </CardHeader>
        <CardContent className="z-10 relative">
            <div className="text-2xl font-bold text-white drop-shadow-md">
                {speed.toFixed(2)} c/s
            </div>
            <p className="text-xs text-white/90">
                characters/sec
            </p>
        </CardContent>
    </Card>
  );
};

export default TypingSpeedMonitor;
