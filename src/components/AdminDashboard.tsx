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
      // NEW FEATURE 3: Sort sessions by timestamp in descending order (newest first)
      const sortedSessions = sessionData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSessions(sortedSessions);
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
    // Maintain chronological order after filtering
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
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Likely Bot':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'AI Assisted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Human</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{humanCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">Likely Bot</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{botCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">AI Assisted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aiAssistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <Filter className="h-5 w-5" />
              <span className="mx-[18px] my-0">Admin Dashboard</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={loadSessions} variant="outline" disabled={isLoading} className="border-gray-300 dark:border-gray-600">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" disabled={filteredSessions.length === 0} className="border-gray-300 dark:border-gray-600">
                <Download className="h-4 w-4 mr-2" />
                Export ({filteredSessions.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-gray-800">
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <Select value={filterVerdict} onValueChange={setFilterVerdict}>
              <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter by Verdict" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-gray-100">All Verdicts</SelectItem>
                <SelectItem value="Human" className="text-gray-900 dark:text-gray-100">Human</SelectItem>
                <SelectItem value="Likely Bot" className="text-gray-900 dark:text-gray-100">Likely Bot</SelectItem>
                <SelectItem value="AI Assisted" className="text-gray-900 dark:text-gray-100">AI Assisted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCandidateType} onValueChange={setFilterCandidateType}>
              <SelectTrigger className="w-48 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Filter by Candidate Type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-gray-100">All Types</SelectItem>
                <SelectItem value="Freshman Intern" className="text-gray-900 dark:text-gray-100">Freshman Intern</SelectItem>
                <SelectItem value="Pro/Competitive Coder" className="text-gray-900 dark:text-gray-100">Pro/Competitive Coder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {sessions.length === 0 ? 'No sessions recorded yet. Start an interview to see data here.' : 'No sessions match the current filters'}
              </div>
            )}

            {filteredSessions.map(session => (
              <Card key={session.id} className="border-l-4 border-l-gray-200 dark:border-l-gray-600 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{session.candidateName}</h3>
                        <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{session.candidateType}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getVerdictColor(session.verdict)}>
                          {getVerdictIcon(session.verdict)}
                          <span className="ml-1">{session.verdict}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Started: {new Date(session.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Duration: {formatDuration(session.duration)}
                      </p>
                    </div>

                    {/* Typing Stats */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Typing Stats</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total WPM:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.typingStats?.totalWPM || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.typingStats?.totalTime || 0}m</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Lines of Code:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.typingStats?.linesOfCode || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Typing Bursts:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.typingStats?.typingBursts || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Code Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Code Analysis</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.code?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Typing Events:</span>
                          <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">{session.typingEvents?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detection Flags */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">Detection Flags ({session.detectionFlags?.length || 0})</h4>
                      {!session.detectionFlags || session.detectionFlags.length === 0 ? (
                        <p className="text-sm text-green-600 dark:text-green-400">No suspicious activities detected</p>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {session.detectionFlags.map((flag, index) => (
                            <Badge key={index} variant="destructive" className="text-xs mr-1 mb-1 block w-full">
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
