export interface TestCase {
  input: any;
  expectedOutput: any;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  testCases: TestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
  functionName: string;
  timeLimit: number; // in milliseconds
  memoryLimit: number; // in MB
}

export interface TestResult {
  passed: boolean;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  executionTime: number;
  error?: string;
}

export interface SubmissionResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: TestResult[];
  totalExecutionTime: number;
  averageExecutionTime: number;
  timeComplexity?: string;
  spaceComplexity?: string;
}