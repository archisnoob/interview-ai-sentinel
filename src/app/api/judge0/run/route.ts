// Mock API endpoint for Vite/React app - replace with real backend
type RunBody = {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  testCases?: { input: string; expectedOutput: string }[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RunBody;
    const { sourceCode, languageId, stdin, testCases } = body;
    
    if (!sourceCode || !languageId) {
      return { json: () => Promise.resolve({ error: "Missing sourceCode or languageId" }), status: 400 };
    }

    // Mock response for development - replace with actual Judge0 integration
    if (!testCases || testCases.length === 0) {
      // Single run
      return { 
        json: () => Promise.resolve({
          status: { id: 3, description: "Accepted" },
          stdout: "Mock output - Judge0 not configured",
          stderr: "",
          compile_output: "",
        })
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

    return { json: () => Promise.resolve({ results, summary }) };
  } catch (e: any) {
    return { json: () => Promise.resolve({ error: e.message ?? "Run failed" }), status: 500 };
  }
}