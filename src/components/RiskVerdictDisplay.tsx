
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const getVerdictVariant = (verdict: string) => {
    switch (verdict) {
      case 'human':
        return 'default';
      case 'likely_bot':
        return 'secondary';
      case 'ai_assisted':
        return 'destructive';
      default:
        return 'outline';
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
    <Card className="typing-guard-shadow-lg border border-border rounded-2xl bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-card-foreground">Detection Analysis Result</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={getVerdictVariant(detectionResult.verdict)} className="gap-2 px-4 py-2 rounded-xl">
              {getVerdictIcon(detectionResult.verdict)}
              <span>{getVerdictLabel(detectionResult.verdict)}</span>
            </Badge>
            <Badge variant="outline" className="px-4 py-2 rounded-xl border-border">
              Confidence: {detectionResult.confidence}
            </Badge>
          </div>
        </div>

        {detectionResult.suspiciousActivities.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground">Suspicious Activities Detected:</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {detectionResult.suspiciousActivities.map((activity, index) => (
                <Alert key={index} variant="destructive" className="rounded-xl">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    • {activity}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        ) : (
          <Alert className="rounded-xl border-border bg-card">
            <CheckCircle className="h-5 w-5" />
            <AlertDescription className="font-medium text-card-foreground">
              No suspicious activities detected - appears to be normal human behavior.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskVerdictDisplay;
