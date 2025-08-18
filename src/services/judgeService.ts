// Mock Judge0 service - replace with real backend integration
type RunRequest = {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  testCases?: { input: string; expectedOutput: string }[];
};

type RunResult = {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compile_output: string;
};

type BatchResult = {
  results: {
    index: number;
    status: { id: number; description: string };
    stdout: string;
    stderr: string | null;
    compile_output: string | null;
    expected: string;
    passed: boolean;
  }[];
  summary: { total: number; passed: number; failed: number };
};

export const judgeService = {
  async runCode(request: RunRequest): Promise<RunResult | BatchResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { sourceCode, languageId, stdin, testCases } = request;
    
    if (!sourceCode || !languageId) {
      throw new Error("Missing sourceCode or languageId");
    }

    // Mock response - replace with actual Judge0 integration
    if (!testCases || testCases.length === 0) {
      // Single run
      return {
        status: { id: 3, description: "Accepted" },
        stdout: "Mock output - Judge0 not configured\nReplace this with actual backend integration",
        stderr: "",
        compile_output: "",
      };
    }

    // Batch run
    const results = testCases.map((tc, idx) => ({
      index: idx,
      status: { id: 3, description: "Accepted" },
      stdout: "Mock output",
      stderr: null,
      compile_output: null,
      expected: tc.expectedOutput,
      passed: true, // Mock all as passed
    }));

    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
    };

    return { results, summary };
  }
};