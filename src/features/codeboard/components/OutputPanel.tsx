"use client";
type RunResult = {
  status: { id: number; description: string } | string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
};

export default function OutputPanel({ result }: { result: RunResult | null }) {
  if (!result) return <p className="text-muted-foreground">Run "Run Code" to see output.</p>;
  const statusText = typeof result.status === "string" ? result.status : result.status.description;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="mb-2 text-foreground">
        Status: <span className="font-medium">{statusText}</span>
      </div>
      {result.stdout && (
        <>
          <div className="text-xs text-muted-foreground">Stdout</div>
          <pre className="whitespace-pre-wrap text-foreground">{result.stdout}</pre>
        </>
      )}
      {result.compile_output && (
        <>
          <div className="text-xs text-muted-foreground mt-2">Compile Output</div>
          <pre className="whitespace-pre-wrap text-amber-600">{result.compile_output}</pre>
        </>
      )}
      {result.stderr && (
        <>
          <div className="text-xs text-muted-foreground mt-2">Stderr</div>
          <pre className="whitespace-pre-wrap text-rose-600">{result.stderr}</pre>
        </>
      )}
    </div>
  );
}