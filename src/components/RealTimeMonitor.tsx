
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Eye, AlertCircle } from 'lucide-react';

interface RealTimeMonitorProps {
  isActive: boolean;
  tabSwitches: number;
  onSuspiciousActivity: (activity: string) => void;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ 
  isActive, 
  tabSwitches,
  onSuspiciousActivity 
}) => {
  const [focusEvents, setFocusEvents] = useState(0);
  const [windowInactive, setWindowInactive] = useState(false);
  const [inactiveStartTime, setInactiveStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const handleFocus = () => {
      setFocusEvents(prev => prev + 1);
      setWindowInactive(false);
      
      // Check if window was inactive for more than 10 seconds
      if (inactiveStartTime) {
        const inactiveDuration = (Date.now() - inactiveStartTime) / 1000;
        if (inactiveDuration > 10) {
          onSuspiciousActivity(`Window inactive for ${inactiveDuration.toFixed(1)}s - possible tab switch`);
        }
        setInactiveStartTime(null);
      }
    };

    const handleBlur = () => {
      setWindowInactive(true);
      setInactiveStartTime(Date.now());
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWindowInactive(true);
        setInactiveStartTime(Date.now());
      } else {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, inactiveStartTime, onSuspiciousActivity]);

  // Reset when session becomes inactive
  useEffect(() => {
    if (!isActive) {
      setFocusEvents(0);
      setWindowInactive(false);
      setInactiveStartTime(null);
    }
  }, [isActive]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5" />
          <span>Live System Monitoring</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive && (
          <div className="text-center text-gray-500 py-4">
            System monitoring inactive
          </div>
        )}
        
        {isActive && (
          <>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Focus Events</span>
                </div>
                <div className="text-xl font-bold text-blue-600">{focusEvents}</div>
              </div>
              
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Tab Switches</span>
                </div>
                <div className="text-xl font-bold text-yellow-600">{tabSwitches}</div>
                {tabSwitches >= 3 && (
                  <Badge variant="destructive" className="text-xs mt-1">
                    Excessive
                  </Badge>
                )}
              </div>
            </div>

            {windowInactive && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Window Currently Inactive
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <strong>Note:</strong> Tracking window focus and tab switching behavior. 
              Inactivity > 10s triggers suspicious activity flag.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
