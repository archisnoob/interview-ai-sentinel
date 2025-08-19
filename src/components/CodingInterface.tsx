
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { SessionControls } from '@/components/coding-interface/SessionControls';
import { FlagSummary } from '@/components/coding-interface/FlagSummary';
import { CodeEditor } from '@/components/coding-interface/CodeEditor';
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

// Simple feature flag for now - comment out imports that might be causing issues
// import EditorWithDetection from '@/features/codeboard/components/EditorWithDetection';
// import LanguageSelector from '@/features/codeboard/components/LanguageSelector';
// import ProblemPanel from '@/features/codeboard/components/ProblemPanel';
// import OutputPanel from '@/features/codeboard/components/OutputPanel';
// import TestCasesPanel from '@/features/codeboard/components/TestCasesPanel';
// import { LANGUAGE_CATALOG, DEFAULT_STARTERS, LanguageKey } from '@/features/codeboard/lib/languages';
// import { problemService } from '@/services/problemService';
// import { judgeService } from '@/services/judgeService';
// import type { Problem } from '@/types/problem';
// import { forwardCodeChange, forwardKeystroke, forwardPaste } from '@/features/codeboard/lib/detectionBridge';

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

  // Simple feature flag for testing
  const [featureCodeBoard, setFeatureCodeBoard] = useState(false);

  // Simple test for the feature flag
  useEffect(() => {
    console.log('CodingInterface component mounted');
    console.log('Checking feature flag...');
    const enabled = typeof window !== "undefined" && 
      window.localStorage?.getItem('FEATURE_CODEBOARD') === 'true';
    console.log('Feature enabled:', enabled);
    setFeatureCodeBoard(enabled);
  }, []);
  
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
    if (featureCodeBoard) {
      toast({
        title: "LeetCode Mode",
        description: "Feature is enabled! (Full implementation coming soon)"
      });
    } else {
      toast({
        title: "Code Execution",
        description: "In a real environment, this would execute the code safely"
      });
    }
  };


  // Check for AI-related flags
  const hasAIDetection = aiPasteEvents.some(event => 
    event.looksGPTPattern || (event.pauseBeforePaste && event.pasteLength >= 200)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Coding Area */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="space-y-4 p-6">
            <SessionControls
              candidateName={candidateName}
              setCandidateName={setCandidateName}
              candidateType={candidateType}
              setCandidateType={setCandidateType}
              sessionActive={sessionActive}
              startSession={startSession}
              endSession={endSession}
              resetSession={resetSession}
              liveDetectionFlags={liveDetectionFlags}
              hasAIDetection={hasAIDetection}
            />
            
            {featureCodeBoard ? (
              <div className="p-4 border-2 border-dashed border-primary rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-2">🚀 LeetCode Mode Enabled!</h3>
                <p className="text-muted-foreground">
                  The feature flag is working! Full implementation will be added next.
                </p>
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  sessionActive={sessionActive}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  textareaRef={textareaRef}
                  runCode={runCode}
                />
              </div>
            ) : (
              <CodeEditor
                code={code}
                setCode={setCode}
                sessionActive={sessionActive}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                textareaRef={textareaRef}
                runCode={runCode}
              />
            )}

            <FlagSummary
              sessionActive={sessionActive}
              liveDetectionFlags={liveDetectionFlags}
            />
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
