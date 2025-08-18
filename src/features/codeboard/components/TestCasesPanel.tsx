"use client";
type CaseResult = {
  index: number;
  status: { id: number; description: string };
  stdout: string;
  stderr: string | null;
  compile_output: string | null;
  expected: string;
  passed: boolean;
};

export default function TestCasesPanel({ summary, results }: {
  summary: { total: number; passed: number; failed: number } | null;
  results: CaseResult[] | null;
}) {
  if (!summary || !results) return <p className="text-muted-foreground">Run "Run All Tests" to evaluate.</p>;
  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground">Summary: {summary.passed}/{summary.total} passed</div>
      <div className="space-y-3">
        {results.map(r => (
          <div key={r.index} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold text-foreground">Test #{r.index + 1}</div>
              <div className={`text-xs ${r.passed ? "text-emerald-600" : "text-rose-600"}`}>
                {r.passed ? "Passed" : "Failed"} — {r.status.description}
              </div>
            </div>
            {!r.passed && (
              <div className="grid md:grid-cols-2 gap-3 mt-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Expected</div>
                  <pre className="whitespace-pre-wrap text-foreground">{r.expected}</pre>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Your Output</div>
                  <pre className="whitespace-pre-wrap text-foreground">{r.stdout}</pre>
                </div>
              </div>
            )}
            {r.compile_output && <pre className="mt-2 text-xs text-amber-600">{r.compile_output}</pre>}
            {r.stderr && <pre className="mt-2 text-xs text-rose-600">{r.stderr}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}