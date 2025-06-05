
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
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
      case 'likely_bot':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-700';
      case 'ai_assisted':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
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
    <Card className="mt-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
          <Shield className="h-5 w-5" />
          <span>Detection Analysis Result</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={`${getVerdictColor(detectionResult.verdict)} flex items-center space-x-2 px-3 py-2 transition-colors`}>
              {getVerdictIcon(detectionResult.verdict)}
              <span className="font-semibold">{getVerdictLabel(detectionResult.verdict)}</span>
            </Badge>
            <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors">
              Confidence: <span className="font-medium">{detectionResult.confidence}</span>
            </div>
          </div>
        </div>

        {detectionResult.suspiciousActivities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Suspicious Activities Detected:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {detectionResult.suspiciousActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  • {activity}
                </div>
              ))}
            </div>
          </div>
        )}

        {detectionResult.suspiciousActivities.length === 0 && (
          <div className="text-sm text-green-600 dark:text-green-400 transition-colors">
            No suspicious activities detected - appears to be normal human behavior.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskVerdictDisplay;
