
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'likely_bot':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ai_assisted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Detection Analysis Result</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge className={`${getVerdictColor(detectionResult.verdict)} flex items-center space-x-2 px-3 py-2`}>
              {getVerdictIcon(detectionResult.verdict)}
              <span className="font-semibold">{getVerdictLabel(detectionResult.verdict)}</span>
            </Badge>
            <div className="text-sm text-gray-600">
              Confidence: <span className="font-medium">{detectionResult.confidence}</span>
            </div>
          </div>
        </div>

        {detectionResult.suspiciousActivities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Suspicious Activities Detected:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {detectionResult.suspiciousActivities.map((activity, index) => (
                <div 
                  key={index} 
                  className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1"
                >
                  • {activity}
                </div>
              ))}
            </div>
          </div>
        )}

        {detectionResult.suspiciousActivities.length === 0 && (
          <div className="text-sm text-green-600">
            No suspicious activities detected - appears to be normal human behavior.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskVerdictDisplay;
