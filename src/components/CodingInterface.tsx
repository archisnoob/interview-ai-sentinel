
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

// LeetCode-style interface components
import EditorWithDetection from '@/features/codeboard/components/EditorWithDetection';
import LanguageSelector from '@/features/codeboard/components/LanguageSelector';
import ProblemPanel from '@/features/codeboard/components/ProblemPanel';
import OutputPanel from '@/features/codeboard/components/OutputPanel';
import TestCasesPanel from '@/features/codeboard/components/TestCasesPanel';
import { LANGUAGE_CATALOG, DEFAULT_STARTERS, LanguageKey } from '@/features/codeboard/lib/languages';
import { problemService } from '@/services/problemService';
import { judgeService } from '@/services/judgeService';
import type { Problem } from '@/types/problem';
import { forwardCodeChange, forwardKeystroke, forwardPaste } from '@/features/codeboard/lib/detectionBridge';

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

  // LeetCode-style interface state
  const [featureCodeBoard, setFeatureCodeBoard] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [langKey, setLangKey] = useState<LanguageKey>("python");
  const [tab, setTab] = useState<"problem" | "code" | "tests" | "output">("code");
  const [customInput, setCustomInput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [singleOutput, setSingleOutput] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);

  // Check feature flag on mount
  useEffect(() => {
    const enabled = typeof window !== "undefined" && 
      (window.localStorage?.getItem('FEATURE_CODEBOARD') === 'true' || 
       import.meta.env.VITE_FEATURE_CODEBOARD === 'true');
    setFeatureCodeBoard(enabled);
    
    if (enabled) {
      // Load a random problem when feature is enabled
      problemService.getRandomProblem()
        .then(setProblem)
        .catch(() => setProblem(null));
    }
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

  const runCode = async () => {
    if (!featureCodeBoard) {
      toast({
        title: "Code Execution",
        description: "In a real environment, this would execute the code safely"
      });
      return;
    }

    if (!code) return;
    setRunning(true);
    setTab("output");
    setBatch(null);
    setSingleOutput(null);
    
    try {
      const result = await judgeService.runCode({
        sourceCode: code,
        languageId: LANGUAGE_CATALOG.find(l => l.key === langKey)!.id,
        stdin: customInput || (problem?.examples?.[0]?.input ?? ""),
      });
      setSingleOutput(result as any);
    } catch (e: any) {
      setSingleOutput({ status: "Client Error", stdout: "", stderr: String(e), compile_output: "" });
    } finally {
      setRunning(false);
    }
  };

  const runAllTests = async () => {
    if (!code || !problem) return;
    setRunning(true);
    setTab("tests");
    setSingleOutput(null);
    setBatch(null);
    
    try {
      const result = await judgeService.runCode({
        sourceCode: code,
        languageId: LANGUAGE_CATALOG.find(l => l.key === langKey)!.id,
        testCases: problem.testCases || [],
      });
      setBatch(result as any);
    } catch (e) {
      setBatch({ results: [], summary: { total: 0, passed: 0, failed: 0 } } as any);
    } finally {
      setRunning(false);
    }
  };

  // Set up detection bridge for Monaco editor events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__detection = {
        onKeystroke: (e: KeyboardEvent) => {
          if (!sessionActive || !aiPasteDetector) return;
          aiPasteDetector.recordKeystroke();
          
          if (shouldLogKey(e.key)) {
            const event: TypingEvent = {
              timestamp: Date.now(),
              type: 'keydown',
              key: e.key,
              textLength: code.length,
              position: 0
            };
            setTypingEvents(prev => [...prev, event]);
          }
        },
        onPaste: (e: ClipboardEvent & { textLength?: number }) => {
          if (!sessionActive || !aiPasteDetector) return;
          
          const pastedLength = e.textLength || 0;
          const event: TypingEvent = {
            timestamp: Date.now(),
            type: 'paste',
            textLength: pastedLength,
            position: 0
          };
          setTypingEvents(prev => [...prev, event]);

          // Simulate paste detection for large pastes
          if (pastedLength >= 160) {
            const newFlag = `Large paste content detected (≥${pastedLength} chars)`;
            addLiveFlag(newFlag);
          }
        },
        onCodeChange: (value: string) => {
          setCode(value);
        }
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.__detection = undefined;
      }
    };
  }, [sessionActive, aiPasteDetector, code]);

  // Reset code when language or problem changes
  useEffect(() => {
    if (!problem || !featureCodeBoard) return;
    const tmpl = problem.codeTemplates?.[langKey] ?? DEFAULT_STARTERS[langKey];
    setCode(tmpl || "");
    setSingleOutput(null);
    setBatch(null);
  }, [langKey, problem, featureCodeBoard]);


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
              // LeetCode-style interface
              <div className="space-y-4">
                {/* Language selector and action buttons */}
                <div className="flex items-center justify-between gap-3">
                  <LanguageSelector selected={langKey} onChange={setLangKey} />
                  <div className="flex gap-2">
                    <button
                      onClick={runCode}
                      disabled={running}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {running ? "Running..." : "Run Code"}
                    </button>
                    <button
                      onClick={runAllTests}
                      disabled={running || !problem}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {running ? "Testing..." : "Submit"}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 border-b border-border mb-3 text-sm">
                  {[
                    { key: "problem", label: "Problem" },
                    { key: "code", label: "Code" },
                    { key: "tests", label: "Test Cases" },
                    { key: "output", label: "Output" },
                  ].map(t => (
                    <button
                      key={t.key}
                      className={`px-3 py-2 border-b-2 transition-colors ${
                        tab === (t.key as any) 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setTab(t.key as any)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {tab === "problem" && <ProblemPanel problem={problem} />}

                {tab === "code" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border overflow-hidden">
                      <EditorWithDetection
                        language={LANGUAGE_CATALOG.find(l => l.key === langKey)?.monaco ?? "plaintext"}
                        value={code}
                        onChange={setCode}
                        theme="dark"
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Custom Input</h3>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        rows={14}
                        className="w-full rounded-lg border border-border bg-background text-foreground p-3 text-sm"
                        placeholder="Provide custom input for stdin..."
                      />
                      <p className="text-xs text-muted-foreground">If empty, the first sample input is used.</p>
                    </div>
                  </div>
                )}

                {tab === "tests" && (
                  <TestCasesPanel summary={batch?.summary ?? null} results={batch?.results ?? null} />
                )}

                {tab === "output" && <OutputPanel result={singleOutput} />}
              </div>
            ) : (
              // Original code editor
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
