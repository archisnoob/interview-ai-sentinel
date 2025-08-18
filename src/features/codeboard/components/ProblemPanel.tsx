"use client";
import { Problem } from "@/types/problem";

export default function ProblemPanel({ problem }: { problem: Problem | null }) {
  if (!problem) return <div className="text-muted-foreground">Loading problem…</div>;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">{problem.title}</h2>
        <span className={`text-xs font-semibold ${
          problem.difficulty === "Easy" ? "text-emerald-500" :
          problem.difficulty === "Medium" ? "text-amber-500" :
          "text-rose-500"
        }`}>{problem.difficulty}</span>
        <div className="flex gap-2 text-xs">
          {problem.tags.map(t => (
            <span key={t} className="rounded px-2 py-0.5 border border-border text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-6 text-foreground">{problem.description}</pre>
      <div>
        <h3 className="font-semibold text-foreground">Constraints</h3>
        <ul className="list-disc pl-6 text-sm text-muted-foreground">
          {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Samples</h3>
        {(problem.examples ?? []).map((s, i) => (
          <div key={i} className="rounded-lg border border-border p-3 bg-card">
            <div className="text-xs font-semibold text-muted-foreground">Input</div>
            <pre className="text-sm whitespace-pre-wrap text-foreground">{s.input}</pre>
            <div className="text-xs font-semibold text-muted-foreground mt-2">Output</div>
            <pre className="text-sm whitespace-pre-wrap text-foreground">{s.output}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}