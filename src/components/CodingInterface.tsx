
import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const getVerdictColor = () => {
    if (liveDetectionFlags.length === 0) return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    if (liveDetectionFlags.length >= 2) return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
  };
  
  const getVerdictIcon = () => {
    if (liveDetectionFlags.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (liveDetectionFlags.length >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Coding Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card dark:bg-card border border-border shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-t-2xl border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center space-x-3">
                <div className="p-2 bg-indigo-600 rounded-xl">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Interview Platform</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={`${getVerdictColor()} px-3 py-1.5 rounded-xl border transition-all duration-200`}>
                  {getVerdictIcon()}
                  <span className="ml-2 font-medium">
                    {liveDetectionFlags.length === 0 ? 'Safe' : liveDetectionFlags.length >= 2 ? 'High Risk' : 'Warning'}
                  </span>
                </Badge>
                {sessionActive && liveDetectionFlags.length > 0 && (
                  <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 rounded-xl">
                    {liveDetectionFlags.length} flags
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Candidate Name" 
                value={candidateName} 
                onChange={e => setCandidateName(e.target.value)} 
                className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-foreground placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                disabled={sessionActive} 
              />
              
              <Select value={candidateType} onValueChange={(value: 'Freshman Intern' | 'Pro/Competitive Coder') => setCandidateType(value)} disabled={sessionActive}>
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Candidate Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                  <SelectItem value="Freshman Intern">Freshman Intern</SelectItem>
                  <SelectItem value="Pro/Competitive Coder">Pro/Competitive Coder</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                {!sessionActive ? (
                  <Button onClick={startSession} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium">
                    <Shield className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <Button onClick={endSession} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium">
                    End Session
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            {!sessionActive && (
              <div className="p-4 border border-indigo-200 dark:border-indigo-800 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                <h4 className="text-sm font-semibold mb-3 text-indigo-700 dark:text-indigo-300">
                  Selected Profile: {candidateType}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs text-indigo-600 dark:text-indigo-400">
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                    <strong>Initial Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '75' : '45'}s
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                    <strong>Idle Pause:</strong> &lt;{candidateType === 'Freshman Intern' ? '40' : '25'}s
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                    <strong>Edit Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '60' : '30'}s
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">
                Problem: Implement a function to reverse a string efficiently
              </label>
              <Textarea 
                ref={textareaRef}
                placeholder="Write your code here..." 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                onKeyDown={handleKeyDown} 
                onPaste={handlePaste} 
                className="min-h-96 font-mono text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground placeholder-slate-500 dark:placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200" 
                disabled={!sessionActive} 
              />
            </div>

            {/* Live Detection Flags */}
            {sessionActive && liveDetectionFlags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Live Detection Flags:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {liveDetectionFlags.slice(-5).map((flag, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm font-medium text-red-700 dark:text-red-300">{flag}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <Button onClick={runCode} disabled={!sessionActive} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all duration-200 font-medium">
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </Button>
              <Button onClick={() => console.log('Saving...', code)} variant="outline" disabled={!sessionActive} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl transition-all duration-200 font-medium">
                <Save className="h-4 w-4 mr-2" />
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
  );
};

export default CodingInterface;
