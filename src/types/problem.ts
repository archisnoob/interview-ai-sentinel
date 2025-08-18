export interface ProblemExample { input: string; output: string; }

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface Problem {
  id: string;
  slug?: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  description: string;
  constraints: string[];
  examples: ProblemExample[];
  testCases: ProblemTestCase[];
  codeTemplates?: Record<string, string>; // key: language key (e.g., "python", "cpp", "javascript", "java", "csharp")
}