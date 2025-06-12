
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
    <Card className="typing-guard-shadow border border-border rounded-2xl bg-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-card-foreground">
          <Monitor className="h-5 w-5" />
          <span>Live System Monitoring</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isActive && (
          <div className="text-center text-muted-foreground py-4">
            System monitoring inactive
          </div>
        )}
        
        {isActive && (
          <>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-3 bg-muted rounded-xl">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-card-foreground">Focus Events</span>
                </div>
                <div className="text-xl font-bold text-primary">{focusEvents}</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-xl">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-card-foreground">Tab Switches</span>
                </div>
                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{tabSwitches}</div>
                {tabSwitches >= 3 && (
                  <Badge variant="destructive" className="text-xs mt-1 rounded-lg">
                    Excessive
                  </Badge>
                )}
              </div>
            </div>

            {windowInactive && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    Window Currently Inactive
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground p-2 bg-muted rounded-xl">
              <strong>Note:</strong> Tracking window focus and tab switching behavior. 
              Inactivity &gt; 10s triggers suspicious activity flag.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
