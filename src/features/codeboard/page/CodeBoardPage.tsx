"use client";

import { useEffect, useMemo, useState } from "react";
import EditorWithDetection from "../components/EditorWithDetection";
import LanguageSelector from "../components/LanguageSelector";
import ProblemPanel from "../components/ProblemPanel";
import OutputPanel from "../components/OutputPanel";
import TestCasesPanel from "../components/TestCasesPanel";
import { LANGUAGE_CATALOG, DEFAULT_STARTERS, LanguageKey } from "../lib/languages";
import { problemService } from "@/services/problemService";
import { judgeService } from "@/services/judgeService";
import type { Problem } from "@/types/problem";

type RunResult = {
  status: { id: number; description: string } | string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
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

export default function CodeBoardPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [langKey, setLangKey] = useState<LanguageKey>("python");
  const [code, setCode] = useState<string>("");
  const [tab, setTab] = useState<"problem" | "code" | "tests" | "output">("problem");
  const [customInput, setCustomInput] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [singleOutput, setSingleOutput] = useState<RunResult | null>(null);
  const [batch, setBatch] = useState<BatchResult | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Feature flag safety — do not render if off
  const featureOn = typeof window !== "undefined"
    ? Boolean(window.localStorage?.getItem('FEATURE_CODEBOARD') === 'true')
    : true;

  useEffect(() => {
    if (!featureOn) return;
    (async () => {
      try {
        const problem = await problemService.getRandomProblem();
        setProblem(problem);
      } catch (error) {
        console.error("Failed to load problem:", error);
        setProblem(null);
      }
    })();
  }, [featureOn]);

  // Reset code on language or problem change
  useEffect(() => {
    if (!problem) return;
    const tmpl = problem.codeTemplates?.[langKey] ?? DEFAULT_STARTERS[langKey];
    setCode(tmpl || "");
    setSingleOutput(null);
    setBatch(null);
  }, [langKey, problem]);

  const monacoLanguage = useMemo(() => {
    return LANGUAGE_CATALOG.find(l => l.key === langKey)?.monaco ?? "plaintext";
  }, [langKey]);

  async function runCustom() {
    if (!code) return;
    setRunning(true);
    setTab("output");
    setBatch(null);
    setSingleOutput(null);
    try {
      const result = await judgeService.runCode({
        sourceCode: code,
        languageId: LANGUAGE_CATALOG.find(l => l.key === langKey)!.id,
        stdin: customInput || (problem?.examples?.[0]?.input ?? ""),
      });
      setSingleOutput(result as RunResult);
    } catch (e: any) {
      setSingleOutput({ status: "Client Error", stdout: "", stderr: String(e), compile_output: "" });
    } finally {
      setRunning(false);
    }
  }

  async function runAllTests() {
    if (!code || !problem) return;
    setRunning(true);
    setTab("tests");
    setSingleOutput(null);
    setBatch(null);
    try {
      const result = await judgeService.runCode({
        sourceCode: code,
        languageId: LANGUAGE_CATALOG.find(l => l.key === langKey)!.id,
        testCases: problem.testCases || [],
      });
      setBatch(result as BatchResult);
    } catch (e) {
      setBatch({ results: [], summary: { total: 0, passed: 0, failed: 0 } } as any);
    } finally {
      setRunning(false);
    }
  }

  if (!featureOn) return null;

  return (
    <div className={`min-h-screen bg-background text-foreground`}>
      <header className="border-b border-border sticky top-0 z-10 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <h1 className="text-xl font-semibold">Coding Round</h1>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSelector selected={langKey} onChange={setLangKey} />
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm hover:bg-accent"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              onClick={runCustom}
              disabled={running}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-sm disabled:opacity-50"
            >
              {running ? "Running..." : "Run Code"}
            </button>
            <button
              onClick={runAllTests}
              disabled={running || !problem}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 text-sm disabled:opacity-50"
            >
              {running ? "Testing..." : "Run All Tests"}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-3 border-b border-border mb-3 text-sm">
          {[
            { key: "problem", label: "Problem" },
            { key: "code", label: "Code" },
            { key: "tests", label: "Test Cases" },
            { key: "output", label: "Output" },
          ].map(t => (
            <button
              key={t.key}
              className={`px-3 py-2 border-b-2 ${tab === (t.key as any) ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              onClick={() => setTab(t.key as any)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "problem" && <ProblemPanel problem={problem} />}

        {tab === "code" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <EditorWithDetection
                language={monacoLanguage}
                value={code}
                onChange={setCode}
                theme={theme}
              />
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Custom Input</h3>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-border bg-background text-foreground p-3 text-sm"
                placeholder="Provide custom input for stdin..."
              />
              <p className="text-xs text-muted-foreground">If empty, the first sample input is used.</p>
            </div>
          </div>
        )}

        {tab === "tests" && (
          <TestCasesPanel summary={batch?.summary ?? null} results={batch?.results ?? null} />
        )}

        {tab === "output" && <OutputPanel result={singleOutput} />}
      </div>
    </div>
  );
}