import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { Problem } from '@/types/leetcode';
import { LEETCODE_PROBLEMS } from '@/data/problems';
import { ProblemDescription } from './ProblemDescription';
import { LeetCodeEditor } from './LeetCodeEditor';
import { ProblemSelector } from './ProblemSelector';

interface LeetCodeInterfaceProps {
  sessionActive: boolean;
  onKeyDown?: (e: any) => void;
  onPaste?: (e: any) => void;
  onCodeChange?: (code: string) => void;
}

export const LeetCodeInterface: React.FC<LeetCodeInterfaceProps> = ({
  sessionActive,
  onKeyDown,
  onPaste,
  onCodeChange
}) => {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showProblemSelector, setShowProblemSelector] = useState(true);

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setShowProblemSelector(false);
  };

  const handleBackToProblems = () => {
    setShowProblemSelector(true);
    setSelectedProblem(null);
  };

  if (showProblemSelector) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <ProblemSelector
            selectedProblem={selectedProblem}
            onSelectProblem={handleSelectProblem}
          />
        </div>
      </div>
    );
  }

  if (!selectedProblem) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Problem Selected</h3>
          <p className="text-muted-foreground mb-4">Please select a problem to start coding</p>
          <Button onClick={() => setShowProblemSelector(true)}>
            Select Problem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToProblems}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Problems
          </Button>
          <div>
            <h2 className="font-semibold">{selectedProblem.title}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedProblem.difficulty} • {selectedProblem.testCases.length} test cases
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!sessionActive && (
            <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
              Start session to enable coding
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Problem Description Panel */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <div className="h-full p-4">
              <ProblemDescription problem={selectedProblem} />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-border hover:bg-border/80 transition-colors" />

          {/* Code Editor Panel */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <div className="h-full">
              <Card className="h-full rounded-none border-0 border-l">
                <LeetCodeEditor
                  problem={selectedProblem}
                  sessionActive={sessionActive}
                  onKeyDown={onKeyDown}
                  onPaste={onPaste}
                  onCodeChange={onCodeChange}
                />
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};