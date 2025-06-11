
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, AlertTriangle, CheckCircle, Clock, Download, Filter, RefreshCw } from 'lucide-react';
import { apiService, SessionData } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionData[]>([]);
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [filterCandidateType, setFilterCandidateType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filterVerdict, filterCandidateType]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionData = await apiService.getSessions();
      setSessions(sessionData);
      toast({
        title: "Data Loaded",
        description: `Found ${sessionData.length} sessions`
      });
    } catch (error) {
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
    let filtered = sessions;
    if (filterVerdict !== 'all') {
      filtered = filtered.filter(session => session.verdict === filterVerdict);
    }
    if (filterCandidateType !== 'all') {
      filtered = filtered.filter(session => session.candidateType === filterCandidateType);
    }
    
    // Sort sessions by timestamp in descending order (latest first)
    filtered = filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFilteredSessions(filtered);
  };

  const exportData = () => {
    try {
      apiService.exportSessions(filteredSessions);
      toast({
        title: "Export Complete",
        description: `Exported ${filteredSessions.length} sessions`
      });
    } catch (error) {
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
        return 'bg-success-light text-success border-success/20';
      case 'Likely Bot':
        return 'bg-warning-light text-warning border-warning/20';
      case 'AI Assisted':
        return 'bg-error-light text-error border-error/20';
      default:
        return 'bg-secondary text-secondary border-border';
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

  const totalSessions = sessions.length;
  const humanCount = sessions.filter(s => s.verdict === 'Human').length;
  const botCount = sessions.filter(s => s.verdict === 'Likely Bot').length;
  const aiAssistedCount = sessions.filter(s => s.verdict === 'AI Assisted').length;

  return (
    <div className="min-h-screen space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-professional modern-shadow-lg animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent rounded-xl modern-shadow">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-primary">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional modern-shadow-lg animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-success rounded-xl modern-shadow">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Human</p>
                <p className="text-3xl font-bold text-primary">{humanCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional modern-shadow-lg animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-warning rounded-xl modern-shadow">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Likely Bot</p>
                <p className="text-3xl font-bold text-primary">{botCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional modern-shadow-lg animate-fade-in-up">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-error rounded-xl modern-shadow">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">AI Assisted</p>
                <p className="text-3xl font-bold text-primary">{aiAssistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card className="card-professional modern-shadow-lg">
        <CardHeader className="gradient-primary">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Filter className="h-5 w-5" />
              <span>Admin Dashboard</span>
            </CardTitle>
            <div className="flex space-x-2">
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
                disabled={filteredSessions.length === 0}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({filteredSessions.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <Select value={filterVerdict} onValueChange={setFilterVerdict}>
              <SelectTrigger className="w-48 input-professional">
                <SelectValue placeholder="Filter by Verdict" />
              </SelectTrigger>
              <SelectContent className="bg-card border-default">
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="Human">Human</SelectItem>
                <SelectItem value="Likely Bot">Likely Bot</SelectItem>
                <SelectItem value="AI Assisted">AI Assisted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCandidateType} onValueChange={setFilterCandidateType}>
              <SelectTrigger className="w-48 input-professional">
                <SelectValue placeholder="Filter by Candidate Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-default">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Freshman Intern">Freshman Intern</SelectItem>
                <SelectItem value="Pro/Competitive Coder">Pro/Competitive Coder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="card-professional p-8">
                  <p className="text-muted">
                    {sessions.length === 0 ? 'No sessions recorded yet. Start an interview to see data here.' : 'No sessions match the current filters'}
                  </p>
                </div>
              </div>
            )}

            {filteredSessions.map((session) => (
              <Card key={session.id} className="card-professional modern-shadow animate-fade-in-up">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-primary">{session.candidateName}</h3>
                        <Badge className="text-xs bg-accent/10 text-accent border-accent/20">
                          {session.candidateType}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getVerdictColor(session.verdict)}>
                          {getVerdictIcon(session.verdict)}
                          <span className="ml-1">{session.verdict}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">
                        Started: {new Date(session.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted">
                        Duration: {formatDuration(session.duration)}
                      </p>
                    </div>

                    {/* Typing Stats */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-card">Typing Stats</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Total WPM:</span>
                          <span className="font-semibold text-card">{session.typingStats?.totalWPM || 'N/A'}</span>
                        </div>
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Total Time:</span>
                          <span className="font-semibold text-card">{session.typingStats?.totalTime || 'N/A'}m</span>
                        </div>
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Lines of Code:</span>
                          <span className="font-semibold text-card">{session.typingStats?.linesOfCode || 'N/A'}</span>
                        </div>
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Typing Bursts:</span>
                          <span className="font-semibold text-card">{session.typingStats?.typingBursts || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Code Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-card">Code Analysis</h4>
                      <div className="text-sm space-y-2">
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Characters:</span>
                          <span className="font-semibold text-card">{session.code.length}</span>
                        </div>
                        <div className="bg-secondary/50 rounded-md p-2">
                          <span className="text-muted block text-xs">Typing Events:</span>
                          <span className="font-semibold text-card">{session.typingEvents.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detection Flags */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-card">Detection Flags ({session.detectionFlags.length})</h4>
                      {session.detectionFlags.length === 0 ? (
                        <div className="bg-success-light rounded-md p-3">
                          <p className="text-sm text-success">No suspicious activities detected</p>
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {session.detectionFlags.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-xs mr-1 mb-1 block w-full bg-error-light text-error">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
