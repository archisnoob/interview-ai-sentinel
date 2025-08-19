import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { SubmissionResult } from '@/types/leetcode';

interface TestCaseResultsProps {
  results: SubmissionResult;
}

export const TestCaseResults: React.FC<TestCaseResultsProps> = ({ results }) => {
  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return `[${value.join(', ')}]`;
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return passed ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        Passed
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        Failed
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center space-x-2">
              {getStatusIcon(results.allPassed)}
              <span>
                {results.allPassed ? 'All Tests Passed!' : 'Some Tests Failed'}
              </span>
            </h3>
            <Badge variant={results.allPassed ? 'default' : 'destructive'}>
              {results.passedCount}/{results.totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Total Time</div>
                <div className="text-muted-foreground">
                  {results.totalExecutionTime.toFixed(2)}ms
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Avg Time</div>
                <div className="text-muted-foreground">
                  {results.averageExecutionTime.toFixed(2)}ms
                </div>
              </div>
            </div>
            {results.timeComplexity && (
              <div>
                <div className="font-medium">Time Complexity</div>
                <div className="text-muted-foreground">
                  {results.timeComplexity}
                </div>
              </div>
            )}
            {results.spaceComplexity && (
              <div>
                <div className="font-medium">Space Complexity</div>
                <div className="text-muted-foreground">
                  {results.spaceComplexity}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Test Cases */}
      <div className="space-y-3">
        {results.results.map((testResult, index) => (
          <Card key={index} className={`border ${testResult.passed ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(testResult.passed)}
                  <span className="font-medium">Test Case {index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(testResult.passed)}
                  <span className="text-sm text-muted-foreground">
                    {testResult.executionTime.toFixed(2)}ms
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {/* Input */}
                <div>
                  <span className="font-medium text-muted-foreground">Input: </span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {Object.entries(testResult.input).map(([key, value]) => 
                      `${key} = ${formatValue(value)}`
                    ).join(', ')}
                  </code>
                </div>

                {/* Expected Output */}
                <div>
                  <span className="font-medium text-muted-foreground">Expected: </span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {formatValue(testResult.expectedOutput)}
                  </code>
                </div>

                {/* Actual Output */}
                <div>
                  <span className="font-medium text-muted-foreground">Output: </span>
                  <code className={`px-2 py-1 rounded text-xs ${
                    testResult.passed 
                      ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {testResult.error ? `Error: ${testResult.error}` : formatValue(testResult.actualOutput)}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};