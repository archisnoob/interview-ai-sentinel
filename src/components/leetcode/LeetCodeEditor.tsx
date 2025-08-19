import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Send, RotateCcw, Settings } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Problem, SubmissionResult } from '@/types/leetcode';
import { CodeExecutor } from '@/services/codeExecutor';
import { TestCaseResults } from './TestCaseResults';
import { useToast } from '@/hooks/use-toast';

interface LeetCodeEditorProps {
  problem: Problem;
  sessionActive: boolean;
  onKeyDown?: (e: any) => void;
  onPaste?: (e: any) => void;
  onCodeChange?: (code: string) => void;
}

type Language = 'javascript' | 'python' | 'java' | 'cpp';

export const LeetCodeEditor: React.FC<LeetCodeEditorProps> = ({
  problem,
  sessionActive,
  onKeyDown,
  onPaste,
  onCodeChange
}) => {
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState(problem.starterCode.javascript);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<SubmissionResult | null>(null);
  const [activeTab, setActiveTab] = useState('testcases');
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setCode(problem.starterCode[newLanguage]);
    setTestResults(null);
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Add event listeners for monitoring
    editor.onDidChangeModelContent((e: any) => {
      // Simulate keyboard events for the existing detection system
      if (sessionActive && onKeyDown) {
        onKeyDown({
          key: 'typing',
          preventDefault: () => {},
          target: { value: editor.getValue() }
        });
      }
    });

    editor.onDidPaste((e: any) => {
      if (sessionActive && onPaste) {
        onPaste({
          clipboardData: { getData: () => e.range.toString() },
          preventDefault: () => {}
        });
      }
    });
  };

  const runCode = async () => {
    if (!sessionActive) {
      toast({
        title: "Session Required",
        description: "Please start a session to run code",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    setActiveTab('testcases');
    
    try {
      // Run only first few test cases for quick feedback
      const sampleTestCases = problem.testCases.slice(0, 3);
      const result = await CodeExecutor.executeCode(code, problem.functionName, sampleTestCases, language);
      setTestResults(result);
      
      toast({
        title: result.allPassed ? "Tests Passed!" : "Some Tests Failed",
        description: `${result.passedCount}/${result.totalCount} test cases passed`,
        variant: result.allPassed ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Execution Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!sessionActive) {
      toast({
        title: "Session Required",
        description: "Please start a session to submit code",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setActiveTab('testcases');
    
    try {
      // Run all test cases for submission
      const result = await CodeExecutor.executeCode(code, problem.functionName, problem.testCases, language);
      setTestResults(result);
      
      if (result.allPassed) {
        toast({
          title: "🎉 Accepted!",
          description: `All ${result.totalCount} test cases passed! Average time: ${result.averageExecutionTime.toFixed(2)}ms`,
          variant: "default"
        });
      } else {
        toast({
          title: "Wrong Answer",
          description: `${result.passedCount}/${result.totalCount} test cases passed`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCode = () => {
    setCode(problem.starterCode[language]);
    setTestResults(null);
    toast({
      title: "Code Reset",
      description: "Code has been reset to starter template"
    });
  };

  const getLanguageDisplayName = (lang: Language) => {
    const names = {
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++'
    };
    return names[lang];
  };

  const getMonacoLanguage = (lang: Language) => {
    const monacoLangs = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp'
    };
    return monacoLangs[lang];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetCode}
            disabled={!sessionActive}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={runCode}
            disabled={!sessionActive || isRunning || isSubmitting}
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button
            onClick={submitCode}
            disabled={!sessionActive || isRunning || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly: !sessionActive
          }}
        />
      </div>

      {/* Results Panel */}
      <div className="border-t">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="testcases">Test Cases</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
          </TabsList>
          <TabsContent value="testcases" className="p-4 max-h-64 overflow-y-auto">
            {testResults ? (
              <TestCaseResults results={testResults} />
            ) : (
              <div className="text-muted-foreground text-sm text-center py-8">
                Run your code to see test results
              </div>
            )}
          </TabsContent>
          <TabsContent value="console" className="p-4 max-h-64 overflow-y-auto">
            <div className="text-muted-foreground text-sm">
              Console output will appear here
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};