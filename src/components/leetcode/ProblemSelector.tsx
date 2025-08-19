import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Code2 } from 'lucide-react';
import { Problem } from '@/types/leetcode';
import { LEETCODE_PROBLEMS } from '@/data/problems';

interface ProblemSelectorProps {
  selectedProblem: Problem | null;
  onSelectProblem: (problem: Problem) => void;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({
  selectedProblem,
  onSelectProblem
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Code2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Select Problem</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a coding problem to solve
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {LEETCODE_PROBLEMS.map((problem) => (
            <div
              key={problem.id}
              className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                selectedProblem?.id === problem.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border'
              }`}
              onClick={() => onSelectProblem(problem)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{problem.title}</h4>
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {problem.description.split('\n')[0].substring(0, 100)}...
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                    <span>{problem.testCases.length} test cases</span>
                    <span>{problem.timeLimit}ms limit</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};