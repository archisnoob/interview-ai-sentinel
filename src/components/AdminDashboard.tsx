
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
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load sessions on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Apply filters when sessions or filters change
  useEffect(() => {
    applyFilters();
  }, [sessions, filterRisk, filterVerdict]);

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
    
    if (filterRisk !== 'all') {
      filtered = filtered.filter(session => session.riskLevel === filterRisk);
    }
    
    if (filterVerdict !== 'all') {
      filtered = filtered.filter(session => session.verdict === filterVerdict);
    }
    
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'human': return 'bg-green-100 text-green-800';
      case 'likely_bot': return 'bg-yellow-100 text-yellow-800';
      case 'ai_assisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'human': return <CheckCircle className="h-4 w-4" />;
      case 'likely_bot': return <Clock className="h-4 w-4" />;
      case 'ai_assisted': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const totalSessions = sessions.length;
  const highRiskCount = sessions.filter(s => s.riskLevel === 'high').length;
  const aiAssistedCount = sessions.filter(s => s.verdict === 'ai_assisted').length;
  const detectionRate = totalSessions > 0 ? Math.round((aiAssistedCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-2xl font-bold">{highRiskCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Assisted</p>
                <p className="text-2xl font-bold">{aiAssistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Detection Rate</p>
                <p className="text-2xl font-bold">{detectionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Session Analysis Dashboard</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={loadSessions} variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportData} variant="outline" disabled={filteredSessions.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export ({filteredSessions.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterVerdict} onValueChange={setFilterVerdict}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Verdict" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verdicts</SelectItem>
                <SelectItem value="human">Human</SelectItem>
                <SelectItem value="likely_bot">Likely Bot</SelectItem>
                <SelectItem value="ai_assisted">AI Assisted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                {sessions.length === 0 ? 'No sessions recorded yet. Start an interview to see data here.' : 'No sessions match the current filters'}
              </div>
            )}

            {filteredSessions.map((session) => (
              <Card key={session.id} className="border-l-4 border-l-gray-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{session.candidateName}</h3>
                        <Badge className={getRiskColor(session.riskLevel)}>
                          {session.riskLevel} risk
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getVerdictColor(session.verdict)}>
                          {getVerdictIcon(session.verdict)}
                          <span className="ml-1 capitalize">{session.verdict.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Started: {new Date(session.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatDuration(session.duration)}
                      </p>
                    </div>

                    {/* Typing Metrics */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Typing Metrics</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Avg WPM:</span>
                          <span className="ml-2 font-semibold">{session.typingMetrics.avgWPM}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max WPM:</span>
                          <span className="ml-2 font-semibold">{session.typingMetrics.maxWPM}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Error Rate:</span>
                          <span className="ml-2 font-semibold">{(session.typingMetrics.backspaceRatio * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pastes:</span>
                          <span className="ml-2 font-semibold">{session.typingMetrics.pasteCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Code Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Code Analysis</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Lines of Code:</span>
                          <span className="ml-2 font-semibold">{session.code.split('\n').length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Characters:</span>
                          <span className="ml-2 font-semibold">{session.code.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Typing Events:</span>
                          <span className="ml-2 font-semibold">{session.typingEvents.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Suspicious Activities */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Detection Results</h4>
                      {session.suspiciousActivities.length === 0 ? (
                        <p className="text-sm text-green-600">No suspicious activities detected</p>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {session.suspiciousActivities.map((activity, index) => (
                            <Badge key={index} variant="destructive" className="text-xs mr-1 mb-1 block w-full">
                              {activity}
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
