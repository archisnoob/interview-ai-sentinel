import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Save, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
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
  const {
    toast
  } = useToast();
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
  const getVerdictColor = () => {
    if (liveDetectionFlags.length === 0) return 'bg-green-100 text-green-800';
    if (liveDetectionFlags.length >= 2) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };
  const getVerdictIcon = () => {
    if (liveDetectionFlags.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (liveDetectionFlags.length >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Coding Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Interview Platform</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getVerdictColor()}>
                  {getVerdictIcon()}
                  <span className="ml-1">
                    {liveDetectionFlags.length === 0 ? 'Normal' : liveDetectionFlags.length >= 2 ? 'High Risk' : 'Suspicious'}
                  </span>
                </Badge>
                {sessionActive && liveDetectionFlags.length > 0 && <Badge variant="outline">
                    {liveDetectionFlags.length} flags
                  </Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Candidate Name" value={candidateName} onChange={e => setCandidateName(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={sessionActive} />
              
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
              
              <div className="flex space-x-2">
                {!sessionActive ? <Button onClick={startSession} className="flex-1">
                    Start Session
                  </Button> : <Button onClick={endSession} variant="destructive" className="flex-1">
                    End Session
                  </Button>}
              </div>
            </div>

            {/* Profile Information */}
            {!sessionActive && <div className="p-3 border border-blue-200 rounded-md bg-indigo-950">
                <h4 className="text-sm font-medium mb-2 text-zinc-100">
                  Selected Profile: {candidateType}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                  <div className="bg-indigo-950">
                    <strong className="bg-indigo-950">Initial Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '75' : '45'}s
                  </div>
                  <div className="bg-indigo-950">
                    <strong>Idle Pause:</strong> &lt;{candidateType === 'Freshman Intern' ? '40' : '25'}s
                  </div>
                  <div className="bg-indigo-950">
                    <strong>Edit Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '60' : '30'}s
                  </div>
                </div>
              </div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 bg-gray-950">
                Problem: Implement a function to reverse a string efficiently
              </label>
              <Textarea ref={textareaRef} placeholder="Write your code here..." value={code} onChange={e => setCode(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} className="min-h-96 font-mono text-sm" disabled={!sessionActive} />
            </div>

            {/* Live Detection Flags */}
            {sessionActive && liveDetectionFlags.length > 0 && <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800">Live Detection Flags:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {liveDetectionFlags.slice(-5).map((flag, index) => <Badge key={index} variant="destructive" className="text-xs block w-full">
                      {flag}
                    </Badge>)}
                </div>
              </div>}
            
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

        {/* Risk Verdict Display */}
        <RiskVerdictDisplay detectionResult={finalDetectionResult} isVisible={!sessionActive && finalDetectionResult !== null} />
      </div>

      {/* Monitoring Panel */}
      <div className="space-y-6">
        <TypingAnalyzer typingEvents={typingEvents} isActive={sessionActive} profile={currentProfile} onSuspiciousActivity={activity => {
        setLiveDetectionFlags(prev => [...prev, activity]);
        toast({
          title: "Suspicious Activity",
          description: activity,
          variant: "destructive"
        });
      }} />
        
        <RealTimeMonitor isActive={sessionActive} tabSwitches={tabSwitches} onSuspiciousActivity={activity => {
        setLiveDetectionFlags(prev => [...prev, activity]);
      }} />
      </div>
    </div>;
};
export default CodingInterface;