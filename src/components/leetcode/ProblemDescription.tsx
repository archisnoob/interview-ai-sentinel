import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Problem } from '@/types/leetcode';

interface ProblemDescriptionProps {
  problem: Problem;
}

export const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ problem }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{problem.title}</h2>
          <Badge className={getDifficultyColor(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Problem Description */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {problem.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <Separator />

        {/* Examples */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3">Examples</h3>
          <div className="space-y-4">
            {problem.examples.map((example, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Input: </span>
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      {example.input}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium text-sm">Output: </span>
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      {example.output}
                    </code>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="font-medium text-sm">Explanation: </span>
                      <span className="text-sm text-muted-foreground">
                        {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Constraints */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-3">Constraints</h3>
          <ul className="space-y-1">
            {problem.constraints.map((constraint, index) => (
              <li key={index} className="text-sm flex items-start">
                <span className="text-muted-foreground mr-2">•</span>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                  {constraint}
                </code>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Time Limit: </span>
            <span>{problem.timeLimit}ms</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Memory Limit: </span>
            <span>{problem.memoryLimit}MB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};