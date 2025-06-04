import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Save, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TypingAnalyzer from '@/components/TypingAnalyzer';
import RealTimeMonitor from '@/components/RealTimeMonitor';
import { apiService, TypingEvent } from '@/services/api';
import { DetectionEngine } from '@/services/detectionEngine';
import { CANDIDATE_PROFILES, ProfileBasedDetection, CandidateProfile } from '@/services/profiles';

const CodingInterface = () => {
  const [code, setCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(CANDIDATE_PROFILES.intern);
  const [sessionActive, setSessionActive] = useState(false);
  const [typingEvents, setTypingEvents] = useState<TypingEvent[]>([]);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [realTimeDetection, setRealTimeDetection] = useState({
    verdict: 'human' as 'human' | 'suspicious' | 'likely_bot' | 'ai_assisted',
    confidence: 0,
    suspiciousActivities: [] as string[],
    triggeredRules: [] as string[]
  });
  const [liveAlerts, setLiveAlerts] = useState<Array<{
    id: string;
    message: string;
    type: 'warning' | 'danger';
    timestamp: number;
  }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Enhanced real-time analysis with profile-based detection
  useEffect(() => {
    if (sessionActive && typingEvents.length > 5 && sessionStartTime) {
      const profileAnalysis = ProfileBasedDetection.analyzeSession(
        candidateProfile,
        typingEvents,
        code,
        sessionStartTime
      );
      
      // Update risk level based on profile analysis
      const newRiskLevel = profileAnalysis.confidence >= 60 ? 'high' : 
                          profileAnalysis.confidence >= 30 ? 'medium' : 'low';
      setRiskLevel(newRiskLevel);
      
      setRealTimeDetection({
        verdict: profileAnalysis.verdict,
        confidence: profileAnalysis.confidence,
        suspiciousActivities: profileAnalysis.behavioralMetrics.suspiciousActivities.map(a => a.details),
        triggeredRules: profileAnalysis.triggeredRules
      });

      // Generate live alerts for new triggered rules
      profileAnalysis.behavioralMetrics.suspiciousActivities.forEach(activity => {
        const alertId = `${activity.type}-${activity.timestamp}`;
        
        if (!liveAlerts.some(alert => alert.id === alertId)) {
          const newAlert = {
            id: alertId,
            message: activity.details,
            type: activity.type === 'code_after_inactivity' || activity.type === 'high_speed_typing' ? 'danger' as const : 'warning' as const,
            timestamp: activity.timestamp
          };
          
          setLiveAlerts(prev => [...prev.slice(-4), newAlert]); // Keep last 5 alerts
          
          toast({
            title: "Behavioral Alert",
            description: `${candidateProfile.name}: ${activity.details}`,
            variant: newAlert.type === 'danger' ? 'destructive' : 'default'
          });
        }
      });
    }
  }, [typingEvents, code, sessionActive, sessionStartTime, candidateProfile, liveAlerts, toast]);

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
    
    // Profile-aware paste analysis
    if (pastedText.length > 50) {
      const alert = {
        id: `paste-${Date.now()}`,
        message: `Large paste detected: ${pastedText.length} characters`,
        type: 'danger' as const,
        timestamp: Date.now()
      };
      setLiveAlerts(prev => [...prev.slice(-4), alert]);
      setRiskLevel('high');
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
    setLiveAlerts([]);
    setRealTimeDetection({
      verdict: 'human',
      confidence: 0,
      suspiciousActivities: [],
      triggeredRules: []
    });
    
    toast({
      title: "Session Started",
      description: `Monitoring ${candidateProfile.name} profile`,
    });
  };

  const endSession = async () => {
    if (!sessionStartTime) return;

    // Perform final profile-based analysis
    const finalAnalysis = ProfileBasedDetection.analyzeSession(
      candidateProfile,
      typingEvents,
      code,
      sessionStartTime
    );

    // Enhanced session data with profile analysis
    try {
      await apiService.saveSession({
        candidateName,
        code,
        typingEvents,
        duration: Date.now() - sessionStartTime,
        riskLevel: finalAnalysis.confidence >= 60 ? 'high' : finalAnalysis.confidence >= 30 ? 'medium' : 'low',
        verdict: finalAnalysis.verdict,
        suspiciousActivities: finalAnalysis.triggeredRules,
        typingMetrics: {
          avgWPM: 0, // Will be calculated by existing logic
          maxWPM: Math.max(...finalAnalysis.behavioralMetrics.typingBursts.map(b => b.wpm), 0),
          backspaceRatio: 0, // Will be calculated by existing logic  
          pasteCount: typingEvents.filter(e => e.type === 'paste').length
        }
      });

      setSessionActive(false);
      
      toast({
        title: "Session Completed",
        description: `Verdict: ${finalAnalysis.verdict} (${finalAnalysis.confidence}% confidence, ${finalAnalysis.triggeredRules.length} rules triggered)`,
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
              <CardTitle>Coding Interview - Profile-Based Detection</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Candidate Name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sessionActive}
              />
              
              <Select 
                value={candidateProfile.id} 
                onValueChange={(value) => setCandidateProfile(CANDIDATE_PROFILES[value])}
                disabled={sessionActive}
              >
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intern">Freshman Intern</SelectItem>
                  <SelectItem value="professional">Professional/Competitive</SelectItem>
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
              </div>
            </div>

            {/* Profile Information */}
            {!sessionActive && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Selected Profile: {candidateProfile.name}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                  <div>
                    <strong>Pause Threshold:</strong> {candidateProfile.thresholds.suspiciousPause}s
                  </div>
                  <div>
                    <strong>Edit Delay:</strong> {candidateProfile.thresholds.suspiciousEditDelay}s
                  </div>
                  <div>
                    <strong>Initial Delay:</strong> {candidateProfile.thresholds.suspiciousInitialDelay}s
                  </div>
                </div>
              </div>
            )}
            
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

            {/* Live Detection Alerts */}
            {sessionActive && liveAlerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-800">Live Detection Alerts:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {liveAlerts.slice(-3).map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-2 rounded-md text-xs ${
                        alert.type === 'danger' 
                          ? 'bg-red-100 border border-red-300 text-red-800' 
                          : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span>{alert.message}</span>
                        <span className="text-xs opacity-75 ml-2">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Triggered Rules Display */}
            {sessionActive && realTimeDetection.triggeredRules.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Triggered Detection Rules ({realTimeDetection.triggeredRules.length}):
                </h4>
                <div className="space-y-1">
                  {realTimeDetection.triggeredRules.slice(-3).map((rule, index) => (
                    <div key={index} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                      {rule}
                    </div>
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
            const alert = {
              id: `monitor-${Date.now()}`,
              message: activity,
              type: 'warning' as const,
              timestamp: Date.now()
            };
            setLiveAlerts(prev => [...prev.slice(-4), alert]);
            setRiskLevel('high');
          }}
        />
      </div>
    </div>
  );
};

export default CodingInterface;
