
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Play, Save, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TypingAnalyzer from '@/components/TypingAnalyzer';
import RealTimeMonitor from '@/components/RealTimeMonitor';
import { apiService, TypingEvent } from '@/services/api';
import { DetectionEngine } from '@/services/detectionEngine';

const CodingInterface = () => {
  const [code, setCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [realTimeDetection, setRealTimeDetection] = useState({
    verdict: 'human' as 'human' | 'likely_bot' | 'ai_assisted',
    confidence: 0,
    suspiciousActivities: [] as string[]
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Real-time analysis effect
  useEffect(() => {
    if (sessionActive && typingEvents.length > 10) {
      const analysis = DetectionEngine.analyze(
        typingEvents, 
        code, 
        sessionStartTime ? Date.now() - sessionStartTime : 0
      );
      
      setRiskLevel(analysis.riskLevel);
      setRealTimeDetection({
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        suspiciousActivities: analysis.suspiciousActivities
      });

      // Alert on high risk detection
      if (analysis.riskLevel === 'high' && analysis.confidence > 70) {
        toast({
          title: "High Risk Activity Detected",
          description: `Confidence: ${analysis.confidence}% - ${analysis.suspiciousActivities[0]}`,
          variant: "destructive"
        });
      }
    }
  }, [typingEvents, code, sessionActive, sessionStartTime, toast]);

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
    
    // Immediate paste analysis
    if (pastedText.length > 50) {
      setRiskLevel('high');
      toast({
        title: "Large Paste Detected",
        description: `${pastedText.length} characters pasted`,
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
    setRealTimeDetection({
      verdict: 'human',
      confidence: 0,
      suspiciousActivities: []
    });
    
    toast({
      title: "Session Started",
      description: "Real-time monitoring activated"
    });
  };

  const endSession = async () => {
    if (!sessionStartTime) return;

    // Perform final analysis
    const finalAnalysis = DetectionEngine.analyze(
      typingEvents, 
      code, 
      Date.now() - sessionStartTime
    );

    // Save session data
    try {
      await apiService.saveSession({
        candidateName,
        code,
        typingEvents,
        duration: Date.now() - sessionStartTime,
        riskLevel: finalAnalysis.riskLevel,
        verdict: finalAnalysis.verdict,
        suspiciousActivities: finalAnalysis.suspiciousActivities,
        typingMetrics: {
          avgWPM: finalAnalysis.detailedMetrics.avgWPM,
          maxWPM: finalAnalysis.detailedMetrics.maxWPM,
          backspaceRatio: finalAnalysis.detailedMetrics.backspaceRatio,
          pasteCount: finalAnalysis.detailedMetrics.pasteCount
        }
      });

      setSessionActive(false);
      
      toast({
        title: "Session Ended",
        description: `Final verdict: ${finalAnalysis.verdict.replace('_', ' ')} (${finalAnalysis.confidence}% confidence)`,
        variant: finalAnalysis.verdict === 'human' ? 'default' : 'destructive'
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save session data",
        variant: "destructive"
      });
    }
  };

  const runCode = () => {
    toast({
      title: "Code Execution",
      description: "In a real environment, this would execute the code safely"
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
              <CardTitle>Coding Interview - Enhanced Detection</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getRiskColor()}>
                  {getRiskIcon()}
                  <span className="ml-1 capitalize">{riskLevel} Risk</span>
                </Badge>
                {sessionActive && realTimeDetection.confidence > 0 && (
                  <Badge variant="outline">
                    {realTimeDetection.confidence}% confidence
                  </Badge>
                )}
              </div>
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
                Problem: Implement a function to reverse a string efficiently
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

            {sessionActive && realTimeDetection.suspiciousActivities.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">Live Detection Alerts:</h4>
                <div className="space-y-1">
                  {realTimeDetection.suspiciousActivities.slice(-3).map((activity, index) => (
                    <div key={index} className="text-xs text-red-700">{activity}</div>
                  ))}
                </div>
              </div>
            )}
            
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
              title: "System Alert",
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
