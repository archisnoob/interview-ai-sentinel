import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Play, Save, AlertTriangle, CheckCircle, Clock, User, Code, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TypingAnalyzer from '@/components/TypingAnalyzer';
import RealTimeMonitor from '@/components/RealTimeMonitor';
import RiskVerdictDisplay from '@/components/RiskVerdictDisplay';
import { apiService, TypingEvent } from '@/services/api';
import { CANDIDATE_PROFILES, SessionVerdictEngine, CandidateProfile } from '@/services/profiles';
import { DetectionEngine } from '@/services/detectionEngine';

const CodingInterface = () => {
  const [code, setCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateType, setCandidateType] = useState<'Freshman Intern' | 'Pro/Competitive Coder'>('Freshman Intern');
  const [sessionActive, setSessionActive] = useState(false);
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [liveDetectionFlags, setLiveDetectionFlags] = useState<string[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [finalDetectionResult, setFinalDetectionResult] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const currentProfile = candidateType === 'Freshman Intern' ? CANDIDATE_PROFILES.intern : CANDIDATE_PROFILES.professional;

  // Helper function to filter out modifier keys
  const shouldLogKey = (key: string): boolean => {
    const modifierKeys = ['Shift', 'Control', 'Alt', 'CapsLock', 'Tab', 'Meta'];
    return !modifierKeys.includes(key);
  };

  // Track typing behavior with improved filtering
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sessionActive) return;

    // Only log keys that result in actual typing or content changes
    if (shouldLogKey(e.key)) {
      const event: TypingEvent = {
        timestamp: Date.now(),
        type: 'keydown',
        key: e.key,
        textLength: code.length,
        position: textareaRef.current?.selectionStart || 0
      };
      setTypingEvents(prev => [...prev, event]);
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!sessionActive) return;
    const pastedText = e.clipboardData.getData('text');
    const event: TypingEvent = {
      timestamp: Date.now(),
      type: 'paste',
      textLength: pastedText.length,
      position: textareaRef.current?.selectionStart || 0
    };
    setTypingEvents(prev => [...prev, event]);

    // Check for large paste
    if (pastedText.length > currentProfile.thresholds.largePasteChars) {
      const newFlag = `Large paste detected: ${pastedText.length} characters`;
      setLiveDetectionFlags(prev => [...prev, newFlag]);
      toast({
        title: "Suspicious Activity",
        description: newFlag,
        variant: "destructive"
      });
    }
  };

  // Track window focus/blur for tab switching
  React.useEffect(() => {
    if (!sessionActive) return;
    const handleBlur = () => {
      setTabSwitches(prev => prev + 1);
      if (tabSwitches >= 3) {
        const flag = "Excessive tab switching detected";
        setLiveDetectionFlags(prev => [...prev, flag]);
        toast({
          title: "Suspicious Activity",
          description: flag,
          variant: "destructive"
        });
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [sessionActive, tabSwitches, toast]);
  
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
    setLiveDetectionFlags([]);
    setTabSwitches(0);
    setFinalDetectionResult(null);
    toast({
      title: "Session Started",
      description: `Monitoring ${candidateType} behavior`
    });
  };
  
  const endSession = async () => {
    if (!sessionStartTime) return;

    // Perform final analysis using both engines
    const sessionDuration = Date.now() - sessionStartTime;

    // Use the improved DetectionEngine for analysis
    const detectionResult = DetectionEngine.analyze(typingEvents, code, sessionDuration);
    setFinalDetectionResult(detectionResult);

    // Also use SessionVerdictEngine for comparison
    const finalAnalysis = SessionVerdictEngine.analyzeSession(currentProfile, typingEvents, code, sessionStartTime);

    // Calculate typing stats
    const keydownEvents = typingEvents.filter(e => e.type === 'keydown' && shouldLogKey(e.key || ''));
    const totalTime = sessionDuration / 1000 / 60; // in minutes
    const totalWPM = totalTime > 0 ? Math.round(keydownEvents.length / 5 / totalTime) : 0;
    const linesOfCode = code.split('\n').length;
    try {
      await apiService.saveSession({
        candidateName,
        candidateType,
        code,
        typingEvents,
        duration: sessionDuration,
        verdict: detectionResult.verdict === 'human' ? 'Human' : detectionResult.verdict === 'likely_bot' ? 'Likely Bot' : 'AI Assisted',
        detectionFlags: detectionResult.suspiciousActivities,
        typingStats: {
          totalWPM,
          totalTime: Math.round(totalTime * 100) / 100,
          linesOfCode,
          typingBursts: detectionResult.detailedMetrics.burstTypingEvents
        }
      });
      setSessionActive(false);
      toast({
        title: "Session Completed",
        description: `Verdict: ${detectionResult.verdict} (Confidence: ${detectionResult.confidence})`,
        variant: detectionResult.verdict === 'human' ? 'default' : 'destructive'
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

  const getStatusVariant = () => {
    if (liveDetectionFlags.length === 0) return 'default';
    if (liveDetectionFlags.length >= 2) return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (liveDetectionFlags.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (liveDetectionFlags.length >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (liveDetectionFlags.length === 0) return 'Safe';
    if (liveDetectionFlags.length >= 2) return 'High Risk';
    return 'Warning';
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Coding Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Code className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span>Interview Platform</span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant()} className="gap-1">
                    {getStatusIcon()}
                    {getStatusText()}
                  </Badge>
                  {sessionActive && liveDetectionFlags.length > 0 && (
                    <Badge variant="outline">
                      {liveDetectionFlags.length} flags
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="Candidate Name" 
                  value={candidateName} 
                  onChange={e => setCandidateName(e.target.value)} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                  disabled={sessionActive} 
                />
                
                <Select value={candidateType} onValueChange={(value: 'Freshman Intern' | 'Pro/Competitive Coder') => setCandidateType(value)} disabled={sessionActive}>
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select Candidate Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Freshman Intern">Freshman Intern</SelectItem>
                    <SelectItem value="Pro/Competitive Coder">Pro/Competitive Coder</SelectItem>
                  </SelectContent>
                </Select>
                
                {!sessionActive ? (
                  <Button onClick={startSession} className="gap-2">
                    <Shield className="h-4 w-4" />
                    Start Session
                  </Button>
                ) : (
                  <Button onClick={endSession} variant="destructive" className="gap-2">
                    <Shield className="h-4 w-4" />
                    End Session
                  </Button>
                )}
              </div>

              {/* Profile Information */}
              {!sessionActive && (
                <Alert>
                  <Code className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-semibold">Selected Profile: {candidateType}</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>Initial Delay: &lt;{candidateType === 'Freshman Intern' ? '75' : '45'}s</div>
                        <div>Idle Pause: &lt;{candidateType === 'Freshman Intern' ? '40' : '25'}s</div>
                        <div>Edit Delay: &lt;{candidateType === 'Freshman Intern' ? '60' : '30'}s</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Separator />
              
              {/* Problem Statement */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">
                  Problem: Implement a function to reverse a string efficiently
                </label>
                <Textarea 
                  ref={textareaRef}
                  placeholder="Write your code here..." 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  onPaste={handlePaste} 
                  className="min-h-96 font-mono text-sm resize-none" 
                  disabled={!sessionActive} 
                />
              </div>

              {/* Live Detection Flags */}
              {sessionActive && liveDetectionFlags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-destructive">Live Detection Flags:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {liveDetectionFlags.slice(-5).map((flag, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm font-medium">
                          {flag}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button onClick={runCode} disabled={!sessionActive} className="gap-2">
                  <Play className="h-4 w-4" />
                  Run Code
                </Button>
                <Button onClick={() => console.log('Saving...', code)} variant="outline" disabled={!sessionActive} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Risk Verdict Display */}
          <RiskVerdictDisplay 
            detectionResult={finalDetectionResult} 
            isVisible={!sessionActive && finalDetectionResult !== null} 
          />
        </div>

        {/* Monitoring Panel */}
        <div className="space-y-6">
          <TypingAnalyzer 
            typingEvents={typingEvents} 
            isActive={sessionActive} 
            profile={currentProfile} 
            onSuspiciousActivity={activity => {
              setLiveDetectionFlags(prev => [...prev, activity]);
              toast({
                title: "Suspicious Activity",
                description: activity,
                variant: "destructive"
              });
            }} 
          />
          
          <RealTimeMonitor 
            isActive={sessionActive} 
            tabSwitches={tabSwitches} 
            onSuspiciousActivity={activity => {
              setLiveDetectionFlags(prev => [...prev, activity]);
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default CodingInterface;
