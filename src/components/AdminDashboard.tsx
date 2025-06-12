import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Users, AlertTriangle, CheckCircle, Clock, Download, Filter, RefreshCw, Search, Pin, Flag } from 'lucide-react';
import { apiService, SessionData } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [filterCandidateType, setFilterCandidateType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedSessions, setPinnedSessions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filterVerdict, filterCandidateType, searchTerm]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionData = await apiService.getSessions();
      const validSessionData = Array.isArray(sessionData) ? sessionData : [];
      setSessions(validSessionData);
      toast({
        title: "Data Loaded",
        description: `Found ${validSessionData.length} sessions`
      });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
      toast({
        title: "Error",
        description: "Failed to load session data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    let filtered = sessionsArray;
    
    if (filterVerdict !== 'all') {
      filtered = filtered.filter(session => session.verdict === filterVerdict);
    }
    if (filterCandidateType !== 'all') {
      filtered = filtered.filter(session => session.candidateType === filterCandidateType);
    }
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    filtered = filtered.sort((a, b) => {
      const aIsPinned = pinnedSessions.has(a.id);
      const bIsPinned = pinnedSessions.has(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });
    
    setFilteredSessions(filtered);
  };

  const togglePin = (sessionId: string) => {
    setPinnedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const exportData = () => {
    try {
      const sessionsToExport = Array.isArray(filteredSessions) ? filteredSessions : [];
      apiService.exportSessions(sessionsToExport);
      toast({
        title: "Export Complete",
        description: `Exported ${sessionsToExport.length} sessions`
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Could not export session data",
        variant: "destructive"
      });
    }
  };

  const getVerdictVariant = (verdict: string) => {
    switch (verdict) {
      case 'Human':
        return 'default';
      case 'Likely Bot':
        return 'secondary';
      case 'AI Assisted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'Human':
        return <CheckCircle className="h-4 w-4" />;
      case 'Likely Bot':
        return <Clock className="h-4 w-4" />;
      case 'AI Assisted':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const filteredSessionsArray = Array.isArray(filteredSessions) ? filteredSessions : [];
  
  const totalSessions = sessionsArray.length;
  const humanCount = sessionsArray.filter(s => s.verdict === 'Human').length;
  const botCount = sessionsArray.filter(s => s.verdict === 'Likely Bot').length;
  const aiAssistedCount = sessionsArray.filter(s => s.verdict === 'AI Assisted').length;

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6">
      {/* Stats Grid - TypingGuard Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold text-card-foreground">{totalSessions}</p>
              </div>
              <div className="p-3 bg-primary rounded-xl">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Clean</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{humanCount}</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Suspicious</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{botCount}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plagiarised</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{aiAssistedCount}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Management - TypingGuard Style */}
      <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">Session Management Dashboard</CardTitle>
            <div className="flex gap-3">
              <Button 
                onClick={loadSessions} 
                variant="outline" 
                disabled={isLoading}
                className="gap-2 rounded-xl border-border"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={exportData} 
                variant="outline" 
                disabled={filteredSessionsArray.length === 0}
                className="gap-2 rounded-xl border-border"
              >
                <Download className="h-4 w-4" />
                Export ({filteredSessionsArray.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Filters - TypingGuard Style */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-input bg-background"
              />
            </div>

            <Select value={filterVerdict} onValueChange={setFilterVerdict}>
              <SelectTrigger className="rounded-xl border-input bg-background">
                <SelectValue placeholder="Filter by Verdict" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="Human">Clean</SelectItem>
                <SelectItem value="Likely Bot">Suspicious</SelectItem>
                <SelectItem value="AI Assisted">Plagiarised</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCandidateType} onValueChange={setFilterCandidateType}>
              <SelectTrigger className="rounded-xl border-input bg-background">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-popover">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Freshman Intern">Freshman Intern</SelectItem>
                <SelectItem value="Pro/Competitive Coder">Pro/Competitive Coder</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Filter className="h-4 w-4" />
              {filteredSessionsArray.length} of {sessionsArray.length} sessions
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Sessions List - TypingGuard Style */}
          <div className="space-y-4">
            {filteredSessionsArray.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Alert className="rounded-xl border-border bg-card">
                  <AlertDescription className="text-card-foreground">
                    {sessionsArray.length === 0 ? 'No sessions recorded yet. Start an interview to see data here.' : 'No sessions match the current filters'}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {filteredSessionsArray.map((session) => {
              const detectionFlags = Array.isArray(session.detectionFlags) ? session.detectionFlags : [];
              const typingEvents = Array.isArray(session.typingEvents) ? session.typingEvents : [];
              const code = session.code || '';
              const isPinned = pinnedSessions.has(session.id);
              
              return (
                <Card key={session.id} className={`typing-guard-shadow transition-all duration-300 hover:typing-guard-shadow-lg border border-border rounded-2xl bg-card ${isPinned ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      {/* Session Info - TypingGuard Style */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-card-foreground">{session.candidateName}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePin(session.id)}
                                className={`p-1 h-7 w-7 rounded-lg ${isPinned ? 'text-primary' : 'text-muted-foreground'}`}
                              >
                                <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                            <Badge variant="secondary" className="text-xs rounded-lg bg-muted text-muted-foreground">
                              {session.candidateType}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant={getVerdictVariant(session.verdict)} className="gap-1 rounded-lg">
                          {getVerdictIcon(session.verdict)}
                          <span>{session.verdict}</span>
                        </Badge>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Started: {new Date(session.timestamp).toLocaleString()}</p>
                          <p>Duration: {formatDuration(session.duration)}</p>
                        </div>
                      </div>

                      {/* Typing Stats - TypingGuard Style */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-card-foreground">Typing Analysis</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">WPM</span>
                            <span className="font-semibold text-card-foreground">{session.typingStats?.totalWPM || 'N/A'}</span>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">Time</span>
                            <span className="font-semibold text-card-foreground">{session.typingStats?.totalTime || 'N/A'}m</span>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">Lines</span>
                            <span className="font-semibold text-card-foreground">{session.typingStats?.linesOfCode || 'N/A'}</span>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">Bursts</span>
                            <span className="font-semibold text-card-foreground">{session.typingStats?.typingBursts || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Code Analysis - TypingGuard Style */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-card-foreground">Code Analysis</h4>
                        <div className="text-sm space-y-2">
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">Characters</span>
                            <span className="font-semibold text-card-foreground">{code.length}</span>
                          </div>
                          <div className="bg-muted rounded-xl p-3">
                            <span className="text-muted-foreground block text-xs">Events</span>
                            <span className="font-semibold text-card-foreground">{typingEvents.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detection Flags - TypingGuard Style */}
                      <div className="lg:col-span-2 space-y-3">
                        <h4 className="font-medium text-card-foreground">Detection Results ({detectionFlags.length})</h4>
                        {detectionFlags.length === 0 ? (
                          <Alert className="rounded-xl border-border bg-card">
                            <CheckCircle className="h-5 w-5" />
                            <AlertDescription className="font-medium text-card-foreground">
                              No suspicious activities detected
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                            {detectionFlags.map((flag, index) => (
                              <Alert key={index} variant="destructive" className="rounded-xl">
                                <Flag className="h-4 w-4" />
                                <AlertDescription className="font-medium">
                                  {flag}
                                </AlertDescription>
                              </Alert>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
