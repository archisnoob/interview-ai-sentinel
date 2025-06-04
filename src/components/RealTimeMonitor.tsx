
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Monitor, Cpu, Eye, AlertCircle } from 'lucide-react';

interface RealTimeMonitorProps {
  isActive: boolean;
  onSuspiciousActivity: (activity: string) => void;
}

const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ 
  isActive, 
  onSuspiciousActivity 
}) => {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [focusEvents, setFocusEvents] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [suspiciousApps, setSuspiciousApps] = useState<string[]>([]);

  useEffect(() => {
    if (!isActive) return;

    // Simulate CPU monitoring
    const cpuInterval = setInterval(() => {
      const usage = Math.random() * 100;
      setCpuUsage(usage);
      
      // Detect high CPU usage (potential AI tools running)
      if (usage > 80) {
        onSuspiciousActivity('High CPU usage detected - possible AI tools');
      }
    }, 2000);

    // Monitor window focus/blur events
    const handleFocus = () => {
      setFocusEvents(prev => prev + 1);
    };

    const handleBlur = () => {
      setTabSwitches(prev => prev + 1);
      if (tabSwitches > 5) {
        onSuspiciousActivity('Excessive tab switching detected');
      }
    };

    // Monitor visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Simulate detection of suspicious applications
    const appCheckInterval = setInterval(() => {
      const suspiciousAppNames = ['ChatGPT', 'Copilot', 'Claude', 'Bard'];
      const detectedApps = suspiciousAppNames.filter(() => Math.random() > 0.95);
      
      if (detectedApps.length > 0) {
        setSuspiciousApps(prev => [...new Set([...prev, ...detectedApps])]);
        onSuspiciousActivity(`AI tool detected: ${detectedApps.join(', ')}`);
      }
    }, 5000);

    return () => {
      clearInterval(cpuInterval);
      clearInterval(appCheckInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, tabSwitches, onSuspiciousActivity]);

  // Reset when session becomes inactive
  useEffect(() => {
    if (!isActive) {
      setCpuUsage(0);
      setFocusEvents(0);
      setTabSwitches(0);
      setSuspiciousApps([]);
    }
  }, [isActive]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5" />
          <span>System Monitor</span>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm font-semibold">{Math.round(cpuUsage)}%</span>
              </div>
              <Progress value={cpuUsage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>

            {suspiciousApps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Detected AI Tools</span>
                </h4>
                <div className="space-y-1">
                  {suspiciousApps.map((app, index) => (
                    <Badge key={index} variant="destructive" className="mr-1">
                      {app}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
              <strong>Note:</strong> In a real implementation, system monitoring would require 
              desktop application permissions and would track actual running processes.
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeMonitor;
