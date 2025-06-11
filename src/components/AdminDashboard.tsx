import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    
    // Sort sessions by timestamp in descending order (latest first)
    filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Pinned sessions first
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Human':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'Likely Bot':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'AI Assisted':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
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

  // Ensure arrays are defined before accessing length
  const sessionsArray = Array.isArray(sessions) ? sessions : [];
  const filteredSessionsArray = Array.isArray(filteredSessions) ? filteredSessions : [];
  
  const totalSessions = sessionsArray.length;
  const humanCount = sessionsArray.filter(s => s.verdict === 'Human').length;
  const botCount = sessionsArray.filter(s => s.verdict === 'Likely Bot').length;
  const aiAssistedCount = sessionsArray.filter(s => s.verdict === 'AI Assisted').length;

  return (
    <div className="min-h-screen space-y-8">
      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border border-border shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
              </div>
              <div className="p-3 bg-[#6C63FF] rounded-xl shadow-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Clean</p>
                <p className="text-3xl font-bold text-green-600">{humanCount}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Suspicious</p>
                <p className="text-3xl font-bold text-yellow-600">{botCount}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl shadow-sm">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plagiarised</p>
                <p className="text-3xl font-bold text-red-600">{aiAssistedCount}</p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl shadow-sm">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Control Panel */}
      <Card className="bg-card border border-border shadow-lg rounded-xl">
        <CardHeader className="bg-gradient-to-r from-[#6C63FF] to-[#5A52E8] rounded-t-xl">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white font-semibold">
              Session Management Dashboard
            </CardTitle>
            <div className="flex space-x-3">
              <Button 
                onClick={loadSessions} 
                variant="outline" 
                disabled={isLoading}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={exportData} 
                variant="outline" 
                disabled={filteredSessionsArray.length === 0}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({filteredSessionsArray.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Enhanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border rounded-lg"
              />
            </div>

            <Select value={filterVerdict} onValueChange={setFilterVerdict}>
              <SelectTrigger className="bg-background border-border rounded-lg">
                <SelectValue placeholder="Filter by Verdict" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg">
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="Human">Clean</SelectItem>
                <SelectItem value="Likely Bot">Suspicious</SelectItem>
                <SelectItem value="AI Assisted">Plagiarised</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCandidateType} onValueChange={setFilterCandidateType}>
              <SelectTrigger className="bg-background border-border rounded-lg">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-lg">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Freshman Intern">Freshman Intern</SelectItem>
                <SelectItem value="Pro/Competitive Coder">Pro/Competitive Coder</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground">
              <Filter className="h-4 w-4 mr-2" />
              {filteredSessionsArray.length} of {sessionsArray.length} sessions
            </div>
          </div>

          {/* Enhanced Sessions List */}
          <div className="space-y-4">
            {filteredSessionsArray.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Card className="bg-background border border-border rounded-xl p-8">
                  <p className="text-muted-foreground">
                    {sessionsArray.length === 0 ? 'No sessions recorded yet. Start an interview to see data here.' : 'No sessions match the current filters'}
                  </p>
                </Card>
              </div>
            )}

            {filteredSessionsArray.map((session) => {
              const detectionFlags = Array.isArray(session.detectionFlags) ? session.detectionFlags : [];
              const typingEvents = Array.isArray(session.typingEvents) ? session.typingEvents : [];
              const code = session.code || '';
              const isPinned = pinnedSessions.has(session.id);
              
              return (
                <Card 
                  key={session.id} 
                  className={`bg-card border border-border shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:border-[#6C63FF]/30 ${isPinned ? 'ring-2 ring-[#6C63FF]/50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      {/* Session Info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-foreground">{session.candidateName}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePin(session.id)}
                                className={`p-1 h-7 w-7 ${isPinned ? 'text-[#6C63FF]' : 'text-muted-foreground'}`}
                              >
                                <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                              </Button>
                            </div>
                            <Badge className="text-xs bg-[#6C63FF]/10 text-[#6C63FF] border-[#6C63FF]/20 rounded-lg">
                              {session.candidateType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getVerdictColor(session.verdict)} rounded-lg font-medium`}>
                            {getVerdictIcon(session.verdict)}
                            <span className="ml-1">{session.verdict}</span>
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Started: {new Date(session.timestamp).toLocaleString()}</p>
                          <p>Duration: {formatDuration(session.duration)}</p>
                        </div>
                      </div>

                      {/* Typing Stats */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Typing Analysis</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">WPM</span>
                            <span className="font-semibold text-foreground">{session.typingStats?.totalWPM || 'N/A'}</span>
                          </div>
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">Time</span>
                            <span className="font-semibold text-foreground">{session.typingStats?.totalTime || 'N/A'}m</span>
                          </div>
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">Lines</span>
                            <span className="font-semibold text-foreground">{session.typingStats?.linesOfCode || 'N/A'}</span>
                          </div>
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">Bursts</span>
                            <span className="font-semibold text-foreground">{session.typingStats?.typingBursts || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Code Analysis */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Code Analysis</h4>
                        <div className="text-sm space-y-2">
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">Characters</span>
                            <span className="font-semibold text-foreground">{code.length}</span>
                          </div>
                          <div className="bg-background rounded-lg p-3 border border-border">
                            <span className="text-muted-foreground block text-xs">Events</span>
                            <span className="font-semibold text-foreground">{typingEvents.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detection Flags */}
                      <div className="lg:col-span-2 space-y-3">
                        <h4 className="font-medium text-foreground">Detection Results ({detectionFlags.length})</h4>
                        {detectionFlags.length === 0 ? (
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <p className="text-sm font-medium text-green-800 dark:text-green-300">No suspicious activities detected</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {detectionFlags.map((flag, index) => (
                              <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                                <div className="flex items-center space-x-2">
                                  <Flag className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-800 dark:text-red-300">{flag}</span>
                                </div>
                              </div>
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
