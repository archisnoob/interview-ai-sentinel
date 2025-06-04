
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, AlertTriangle, CheckCircle, Clock, Download, Filter } from 'lucide-react';

interface CandidateSession {
  id: string;
  name: string;
  startTime: string;
  duration: number;
  riskLevel: 'low' | 'medium' | 'high';
  verdict: 'human' | 'likely_bot' | 'ai_assisted';
  typingMetrics: {
    avgWPM: number;
    maxWPM: number;
    backspaceRatio: number;
    pasteCount: number;
  };
  suspiciousActivities: string[];
}

const AdminDashboard = () => {
  const [sessions, setSessions] = useState<CandidateSession[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');

  // Mock data - in real app, this would come from your backend
  useEffect(() => {
    const mockSessions: CandidateSession[] = [
      {
        id: '1',
        name: 'John Doe',
        startTime: '2024-06-04 10:30:00',
        duration: 3600000, // 1 hour in milliseconds
        riskLevel: 'high',
        verdict: 'ai_assisted',
        typingMetrics: {
          avgWPM: 145,
          maxWPM: 180,
          backspaceRatio: 0.01,
          pasteCount: 5
        },
        suspiciousActivities: ['Extremely fast typing', 'Multiple paste operations', 'ChatGPT detected']
      },
      {
        id: '2',
        name: 'Jane Smith',
        startTime: '2024-06-04 11:00:00',
        duration: 2700000, // 45 minutes
        riskLevel: 'low',
        verdict: 'human',
        typingMetrics: {
          avgWPM: 65,
          maxWPM: 85,
          backspaceRatio: 0.15,
          pasteCount: 1
        },
        suspiciousActivities: []
      },
      {
        id: '3',
        name: 'Bob Wilson',
        startTime: '2024-06-04 14:15:00',
        duration: 4200000, // 70 minutes
        riskLevel: 'medium',
        verdict: 'likely_bot',
        typingMetrics: {
          avgWPM: 95,
          maxWPM: 120,
          backspaceRatio: 0.05,
          pasteCount: 3
        },
        suspiciousActivities: ['Robotic typing pattern', 'High CPU usage']
      }
    ];
    setSessions(mockSessions);
  }, []);

  const filteredSessions = sessions.filter(session => {
    const riskMatch = filterRisk === 'all' || session.riskLevel === filterRisk;
    const verdictMatch = filterVerdict === 'all' || session.verdict === filterVerdict;
    return riskMatch && verdictMatch;
  });

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

  const exportData = () => {
    const dataStr = JSON.stringify(filteredSessions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cheating_detection_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const totalSessions = sessions.length;
  const highRiskCount = sessions.filter(s => s.riskLevel === 'high').length;
  const aiAssistedCount = sessions.filter(s => s.verdict === 'ai_assisted').length;

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
                <p className="text-2xl font-bold">{totalSessions > 0 ? Math.round((aiAssistedCount / totalSessions) * 100) : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Session Analysis</span>
            </CardTitle>
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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

          {/* Sessions Table */}
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="border-l-4 border-l-gray-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{session.name}</h3>
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
                        Started: {session.startTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {Math.round(session.duration / 60000)} minutes
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

                    {/* Suspicious Activities */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Suspicious Activities</h4>
                      {session.suspiciousActivities.length === 0 ? (
                        <p className="text-sm text-green-600">No suspicious activities detected</p>
                      ) : (
                        <div className="space-y-1">
                          {session.suspiciousActivities.map((activity, index) => (
                            <Badge key={index} variant="destructive" className="text-xs mr-1 mb-1">
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

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sessions match the current filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
