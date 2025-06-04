
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Play, Save, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TypingAnalyzer from '@/components/TypingAnalyzer';
import RealTimeMonitor from '@/components/RealTimeMonitor';

interface TypingEvent {
  timestamp: number;
  type: 'keydown' | 'keyup' | 'paste';
  key?: string;
  textLength: number;
  position: number;
}

const CodingInterface = () => {
  const [code, setCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Track typing behavior
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sessionActive) return;
    
    const event: TypingEvent = {
      timestamp: Date.now(),
      type: 'keydown',
      key: e.key,
      textLength: code.length,
      position: textareaRef.current?.selectionStart || 0
    };
    
    setTypingEvents(prev => [...prev, event]);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!sessionActive) return;
    
    const pastedText = e.clipboardData.getData('text');
    const event: TypingEvent = {
      timestamp: Date.now(),
      type: 'paste',
      textLength: code.length + pastedText.length,
      position: textareaRef.current?.selectionStart || 0
    };
    
    setTypingEvents(prev => [...prev, event]);
    
    // Large paste operations are suspicious
    if (pastedText.length > 50) {
      setRiskLevel('high');
      toast({
        title: "Suspicious Activity Detected",
        description: "Large text paste detected",
        variant: "destructive"
      });
    }
  };

  const startSession = () => {
    if (!candidateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter candidate name",
        variant: "destructive"
      });
      return;
    }
    
    setSessionActive(true);
    setSessionStartTime(Date.now());
    setTypingEvents([]);
    setRiskLevel('low');
    
    toast({
      title: "Session Started",
      description: "Monitoring has begun"
    });
  };

  const endSession = () => {
    setSessionActive(false);
    
    // Simulate sending data to backend
    const sessionData = {
      candidateName,
      code,
      typingEvents,
      duration: sessionStartTime ? Date.now() - sessionStartTime : 0,
      riskLevel
    };
    
    console.log('Session data:', sessionData);
    
    toast({
      title: "Session Ended",
      description: "Data saved for analysis"
    });
  };

  const runCode = () => {
    toast({
      title: "Code Execution",
      description: "Code would be executed in a real environment"
    });
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Coding Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Coding Interview</CardTitle>
              <Badge className={getRiskColor()}>
                {getRiskIcon()}
                <span className="ml-1 capitalize">{riskLevel} Risk</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Candidate Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sessionActive}
              />
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
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Problem: Implement a function to reverse a string
              </label>
              <Textarea
                ref={textareaRef}
                placeholder="Write your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                className="min-h-96 font-mono text-sm"
                disabled={!sessionActive}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={runCode} disabled={!sessionActive}>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </Button>
              <Button onClick={() => console.log('Saving...', code)} variant="outline" disabled={!sessionActive}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monitoring Panel */}
      <div className="space-y-6">
        <TypingAnalyzer 
          typingEvents={typingEvents}
          isActive={sessionActive}
          onRiskLevelChange={setRiskLevel}
        />
        
        <RealTimeMonitor 
          isActive={sessionActive}
          onSuspiciousActivity={(activity) => {
            setRiskLevel('high');
            toast({
              title: "Suspicious Activity",
              description: activity,
              variant: "destructive"
            });
          }}
        />
      </div>
    </div>
  );
};

export default CodingInterface;
