import { TestCase, TestResult, SubmissionResult } from '@/types/leetcode';

export class CodeExecutor {
  private static timeoutDuration = 5000; // 5 seconds

  static async executeCode(
    code: string, 
    functionName: string, 
    testCases: TestCase[],
    language: string = 'javascript'
  ): Promise<SubmissionResult> {
    const results: TestResult[] = [];
    let passedCount = 0;
    let totalExecutionTime = 0;

    for (const testCase of testCases) {
      const startTime = performance.now();
      
      try {
        const result = await this.runSingleTest(code, functionName, testCase, language);
        const executionTime = performance.now() - startTime;
        
        const testResult: TestResult = {
          passed: this.compareResults(result, testCase.expectedOutput),
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result,
          executionTime
        };

        if (testResult.passed) {
          passedCount++;
        }

        results.push(testResult);
        totalExecutionTime += executionTime;
      } catch (error) {
        const executionTime = performance.now() - startTime;
        results.push({
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: null,
          executionTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        totalExecutionTime += executionTime;
      }
    }

    return {
      allPassed: passedCount === testCases.length,
      passedCount,
      totalCount: testCases.length,
      results,
      totalExecutionTime,
      averageExecutionTime: totalExecutionTime / testCases.length,
      timeComplexity: this.analyzeTimeComplexity(code),
      spaceComplexity: this.analyzeSpaceComplexity(code)
    };
  }

  private static async runSingleTest(
    code: string, 
    functionName: string, 
    testCase: TestCase,
    language: string
  ): Promise<any> {
    if (language !== 'javascript') {
      throw new Error(`Language ${language} not supported yet`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Time Limit Exceeded'));
      }, this.timeoutDuration);

      try {
        // Create a safe execution environment
        const safeCode = this.createSafeJavaScriptCode(code, functionName, testCase);
        const result = this.executeJavaScript(safeCode);
        
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private static createSafeJavaScriptCode(code: string, functionName: string, testCase: TestCase): string {
    // Remove any potentially dangerous code patterns
    const sanitizedCode = code
      .replace(/eval\s*\(/g, '/* eval blocked */(')
      .replace(/Function\s*\(/g, '/* Function blocked */(')
      .replace(/setTimeout\s*\(/g, '/* setTimeout blocked */(')
      .replace(/setInterval\s*\(/g, '/* setInterval blocked */(')
      .replace(/import\s+/g, '/* import blocked */')
      .replace(/require\s*\(/g, '/* require blocked */(');

    // Prepare the test input
    const inputParams = Object.values(testCase.input).map(val => JSON.stringify(val)).join(', ');
    
    return `
      ${sanitizedCode}
      
      // Execute the function with test input
      try {
        const result = ${functionName}(${inputParams});
        result;
      } catch (error) {
        throw new Error('Runtime Error: ' + error.message);
      }
    `;
  }

  private static executeJavaScript(code: string): any {
    // Use Function constructor for safer evaluation than eval
    const func = new Function('return (' + code + ')');
    return func();
  }

  private static compareResults(actual: any, expected: any): boolean {
    // Deep comparison for arrays and objects
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      for (let i = 0; i < actual.length; i++) {
        if (!this.compareResults(actual[i], expected[i])) return false;
      }
      return true;
    }
    
    if (typeof actual === 'object' && typeof expected === 'object' && actual !== null && expected !== null) {
      const actualKeys = Object.keys(actual).sort();
      const expectedKeys = Object.keys(expected).sort();
      
      if (actualKeys.length !== expectedKeys.length) return false;
      if (!actualKeys.every((key, i) => key === expectedKeys[i])) return false;
      
      for (const key of actualKeys) {
        if (!this.compareResults(actual[key], expected[key])) return false;
      }
      return true;
    }
    
    return actual === expected;
  }

  private static analyzeTimeComplexity(code: string): string {
    // Basic time complexity analysis based on code patterns
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('for') && lowerCode.split('for').length > 2) {
      return 'O(n²) or higher';
    } else if (lowerCode.includes('for') || lowerCode.includes('while')) {
      return 'O(n)';
    } else if (lowerCode.includes('sort')) {
      return 'O(n log n)';
    } else {
      return 'O(1)';
    }
  }

  private static analyzeSpaceComplexity(code: string): string {
    // Basic space complexity analysis
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('new array') || lowerCode.includes('[]') || lowerCode.includes('{}')) {
      return 'O(n)';
    } else {
      return 'O(1)';
    }
  }
}