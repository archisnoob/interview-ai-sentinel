
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface DetectionResult {
  riskLevel: 'low' | 'medium' | 'high';
  verdict: 'human' | 'likely_bot' | 'ai_assisted';
  suspiciousActivities: string[];
  confidence: number;
}

interface RiskVerdictDisplayProps {
  detectionResult: DetectionResult | null;
  isVisible: boolean;
}

const RiskVerdictDisplay: React.FC<RiskVerdictDisplayProps> = ({ 
  detectionResult, 
  isVisible 
}) => {
  if (!isVisible || !detectionResult) return null;

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'human':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'likely_bot':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'ai_assisted':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'human':
        return <CheckCircle className="h-5 w-5" />;
      case 'likely_bot':
        return <AlertTriangle className="h-5 w-5" />;
      case 'ai_assisted':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'human':
        return 'Human';
      case 'likely_bot':
        return 'Likely Bot';
      case 'ai_assisted':
        return 'AI Assisted';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="bg-card dark:bg-card border border-border shadow-lg rounded-2xl transition-all duration-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-t-2xl border-b border-border">
        <CardTitle className="flex items-center space-x-3 text-foreground">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold">Detection Analysis Result</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge className={`${getVerdictColor(detectionResult.verdict)} flex items-center space-x-2 px-4 py-2 rounded-xl border font-semibold transition-all duration-200`}>
              {getVerdictIcon(detectionResult.verdict)}
              <span>{getVerdictLabel(detectionResult.verdict)}</span>
            </Badge>
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Confidence: </span>
              <span className="font-semibold text-foreground">{detectionResult.confidence}</span>
            </div>
          </div>
        </div>

        {detectionResult.suspiciousActivities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Suspicious Activities Detected:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {detectionResult.suspiciousActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3"
                >
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">• {activity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {detectionResult.suspiciousActivities.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                No suspicious activities detected - appears to be normal human behavior.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskVerdictDisplay;
