
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
import { AIPasteDetector, AIPasteEvent } from '@/services/aiPasteDetector';
import { sessionManager } from '@/services/sessionManager';
import { setDetectionSessionActive } from '@/utils/ai-overlay-detector';
import TypingSpeedMonitor from '@/components/TypingSpeedMonitor';

const CodingInterface = () => {
  // Initialize with clean state from session manager
  const cleanState = sessionManager.initializeCleanSession();
  
  const [code, setCode] = useState(cleanState.code || '');
  const [candidateName, setCandidateName] = useState(cleanState.candidateName || '');
  const [candidateType, setCandidateType] = useState<'Freshman Intern' | 'Pro/Competitive Coder'>(cleanState.candidateType || 'Freshman Intern');
  const [sessionActive, setSessionActive] = useState(false);
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>(cleanState.typingEvents || []);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(cleanState.sessionStartTime || null);
  const [liveDetectionFlags, setLiveDetectionFlags] = useState<string[]>(cleanState.liveDetectionFlags || []);
  const [tabSwitches, setTabSwitches] = useState(cleanState.tabSwitches || 0);
  const [finalDetectionResult, setFinalDetectionResult] = useState<any>(cleanState.finalDetectionResult || null);
  const [aiPasteEvents, setAiPasteEvents] = useState<AIPasteEvent[]>(cleanState.aiPasteEvents || []);
  const [aiPasteDetector, setAiPasteDetector] = useState<AIPasteDetector | null>(cleanState.aiPasteDetector || null);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
  const currentProfile = candidateType === 'Freshman Intern' ? CANDIDATE_PROFILES.intern : CANDIDATE_PROFILES.professional;

  const addLiveFlag = (newFlag: string) => {
    const MAX_TOTAL_FLAGS = 30;
    const MAX_FLAGS_PER_TYPE = 5;

    // Expanded list of prefixes to better identify flag types
    const flagTypePrefixes = [
      'Excessive idle pauses detected',
      'Large paste detected',
      'AI-generated content detected in paste',
      'Suspicious paste after',
      'Large paste content detected',
      'Excessive tab switching detected',
      'Rapid typing',
      'Unnatural typing rhythm'
    ];

    // Extracts the base category from a detailed flag message to enable per-type counting.
    // e.g., "Rapid typing: 150 WPM" becomes "Rapid typing".
    const getBaseMessage = (flag: string): string => {
      const foundPrefix = flagTypePrefixes.find(prefix => flag.startsWith(prefix));
      if (foundPrefix) {
        return foundPrefix;
      }
      // Fallback for flags with details after a colon, e.g. "Large paste detected: 200 characters"
      return flag.split(':')[0].trim();
    };
    
    const baseMessage = getBaseMessage(newFlag);

    setLiveDetectionFlags(prev => {
        // First, count how many flags of this specific type already exist.
        const countForType = prev.filter(f => getBaseMessage(f) === baseMessage).length;

        // If the limit for this specific flag type is reached, ignore the new flag and don't update state.
        if (countForType >= MAX_FLAGS_PER_TYPE) {
            return prev;
        }

        // Next, check if the total flag limit has been reached.
        if (prev.length >= MAX_TOTAL_FLAGS) {
            return prev;
        }
        
        // If no limits are hit, add the new flag.
        return [...prev, newFlag];
    });
  };

  // Reset session to clean state
  const resetSession = () => {
    const cleanState = sessionManager.initializeCleanSession();
    
    setCode(cleanState.code || '');
    setCandidateName(cleanState.candidateName || '');
    setCandidateType(cleanState.candidateType || 'Freshman Intern');
    setSessionActive(false);
    setTypingEvents(cleanState.typingEvents || []);
    setSessionStartTime(cleanState.sessionStartTime || null);
    setLiveDetectionFlags(cleanState.liveDetectionFlags || []);
    setTabSwitches(cleanState.tabSwitches || 0);
    setFinalDetectionResult(cleanState.finalDetectionResult || null);
    setAiPasteEvents(cleanState.aiPasteEvents || []);
    setAiPasteDetector(cleanState.aiPasteDetector || null);
    
    console.log('Session reset to clean state');
  };

  // Helper function to filter out modifier keys
  const shouldLogKey = (key: string): boolean => {
    const modifierKeys = ['Shift', 'Control', 'Alt', 'CapsLock', 'Tab', 'Meta'];
    return !modifierKeys.includes(key);
  };

  // Track typing behavior with improved filtering and AI detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sessionActive || !aiPasteDetector) return;

    // Record keystroke for AI detection
    aiPasteDetector.recordKeystroke();

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
    if (!sessionActive || !aiPasteDetector) return;
    
    const pastedText = e.clipboardData.getData('text');
    const event: TypingEvent = {
      timestamp: Date.now(),
      type: 'paste',
      textLength: pastedText.length,
      position: textareaRef.current?.selectionStart || 0
    };
    setTypingEvents(prev => [...prev, event]);

    // AI Paste Detection
    const aiPasteEvent = aiPasteDetector.analyzePaste(pastedText);
    setAiPasteEvents(prev => [...prev, aiPasteEvent]);

    // Check for suspicious AI patterns
    if (aiPasteEvent.looksGPTPattern) {
      const newFlag = `AI-generated content detected in paste (${pastedText.length} chars)`;
      addLiveFlag(newFlag);
      toast({
        title: "AI Content Detected",
        description: newFlag,
        variant: "destructive"
      });
    } else if (aiPasteEvent.pauseBeforePaste && pastedText.length >= 200) {
      const newFlag = `Suspicious paste after ${Math.round(aiPasteEvent.timeSinceLastKey / 1000)}s pause (${pastedText.length} chars)`;
      addLiveFlag(newFlag);
      toast({
        title: "Suspicious Paste Pattern",
        description: newFlag,
        variant: "destructive"
      });
    }

    // Original large paste detection
    if (pastedText.length >= 160) {
      const newFlag = `Large paste content detected (≥${pastedText.length} chars)`;
      addLiveFlag(newFlag);
      toast({
        title: "AI Assistance Detected",
        description: newFlag,
        variant: "destructive"
      });
    } else if (pastedText.length > currentProfile.thresholds.largePasteChars) {
      const newFlag = `Large paste detected: ${pastedText.length} characters`;
      addLiveFlag(newFlag);
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
        addLiveFlag(flag);
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

  // Calculate typing speed
  React.useEffect(() => {
    if (sessionActive && sessionStartTime) {
      const interval = setInterval(() => {
        const keydownEvents = typingEvents.filter(e => e.type === 'keydown' && shouldLogKey(e.key || ''));
        const sessionDurationSeconds = (Date.now() - sessionStartTime) / 1000;
        const speed = sessionDurationSeconds > 1 ? keydownEvents.length / sessionDurationSeconds : 0;
        setTypingSpeed(speed);
      }, 1000); // update every second

      return () => clearInterval(interval);
    } else {
      setTypingSpeed(0);
    }
  }, [sessionActive, sessionStartTime, typingEvents]);

  const startSession = () => {
    if (!candidateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter candidate name",
        variant: "destructive"
      });
      return;
    }
    
    // Reset to clean state before starting new session
    resetSession();
    
    const sessionId = `${candidateName}_${Date.now()}`;
    const detector = new AIPasteDetector(sessionId);
    setAiPasteDetector(detector);
    
    setSessionActive(true);
    setSessionStartTime(Date.now());
    setTypingEvents([]);
    setLiveDetectionFlags([]);
    setTabSwitches(0);
    setFinalDetectionResult(null);
    setAiPasteEvents([]);
    
    // Activate AI overlay detection for this session
    setDetectionSessionActive(true);
    
    toast({
      title: "Session Started",
      description: `Monitoring ${candidateType} behavior with AI detection`
    });
  };

  const endSession = async () => {
    if (!sessionStartTime) return;

    // Deactivate AI overlay detection
    setDetectionSessionActive(false);

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
        },
        aiPasteEvents // Add AI paste events to session data
      });
      
      // Handle session end cleanup
      sessionManager.handleSessionEnd();
      
      setSessionActive(false);
      setAiPasteDetector(null);
      
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
    if (liveDetectionFlags.length === 0) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (liveDetectionFlags.length >= 2) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const getVerdictIcon = () => {
    if (liveDetectionFlags.length === 0) return <CheckCircle className="h-4 w-4" />;
    if (liveDetectionFlags.length >= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Check for AI-related flags
  const hasAIDetection = aiPasteEvents.some(event => 
    event.looksGPTPattern || (event.pauseBeforePaste && event.pasteLength >= 200)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Coding Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="bg-gray-900">
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-gray-100">Interview Platform</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getVerdictColor()}>
                  {getVerdictIcon()}
                  <span className="ml-1">
                    {liveDetectionFlags.length === 0 ? 'Normal' : liveDetectionFlags.length >= 2 ? 'High Risk' : 'Suspicious'}
                  </span>
                </Badge>
                {sessionActive && liveDetectionFlags.length > 0 && (
                  <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                    {liveDetectionFlags.length} flags
                  </Badge>
                )}
                {hasAIDetection && (
                  <Badge variant="destructive" className="text-xs">
                    ⚠ AI Content
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 bg-gray-900">
            {/* Form inputs and session controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Candidate Name" 
                value={candidateName} 
                onChange={e => setCandidateName(e.target.value)} 
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                disabled={sessionActive} 
              />
              
              <Select 
                value={candidateType} 
                onValueChange={(value: 'Freshman Intern' | 'Pro/Competitive Coder') => setCandidateType(value)} 
                disabled={sessionActive}
              >
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Candidate Type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  <SelectItem value="Freshman Intern" className="text-gray-900 dark:text-gray-100">Freshman Intern</SelectItem>
                  <SelectItem value="Pro/Competitive Coder" className="text-gray-900 dark:text-gray-100">Pro/Competitive Coder</SelectItem>
                </SelectContent>
              </Select>
              
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
                {!sessionActive && (
                  <Button onClick={resetSession} variant="outline" className="px-3">
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            {!sessionActive && (
              <div className="p-3 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20">
                <h4 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">
                  Selected Profile: {candidateType}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs text-blue-700 dark:text-blue-300">
                  <div>
                    <strong>Initial Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '75' : '45'}s
                  </div>
                  <div>
                    <strong>Idle Pause:</strong> &lt;{candidateType === 'Freshman Intern' ? '40' : '25'}s
                  </div>
                  <div>
                    <strong>Edit Delay:</strong> &lt;{candidateType === 'Freshman Intern' ? '60' : '30'}s
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Problem: Implement a function to reverse a string efficiently
              </label>
              <Textarea 
                ref={textareaRef} 
                placeholder="Write your code here..." 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                onKeyDown={handleKeyDown} 
                onPaste={handlePaste} 
                className="min-h-96 font-mono text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
                disabled={!sessionActive} 
              />
            </div>

            {/* Live Detection Flags */}
            {sessionActive && liveDetectionFlags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-400">Live Detection Flags:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {liveDetectionFlags.slice(-5).map((flag, index) => (
                    <Badge key={index} variant="destructive" className="text-xs block w-full">
                      {flag}
                    </Badge>
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
            addLiveFlag(activity);
            toast({
              title: "Suspicious Activity",
              description: activity,
              variant: "destructive"
            });
          }}
          aiPasteEvents={aiPasteEvents}
        />
        
        <TypingSpeedMonitor speed={typingSpeed} isActive={sessionActive} />
        
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
