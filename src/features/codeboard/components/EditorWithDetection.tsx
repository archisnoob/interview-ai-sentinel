"use client";
import { useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { MonacoErrorBoundary } from "./MonacoErrorBoundary";
import { forwardCodeChange, forwardKeystroke, forwardPaste } from "../lib/detectionBridge";

type Props = {
  language: string; // monaco language id
  value: string;
  onChange: (v: string) => void;
  theme: "light" | "vs-dark" | "dark";
};

export default function EditorWithDetection({ language, value, onChange, theme }: Props) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try { editorRef.current?.dispose?.(); } catch {}
      try { monacoRef.current?.editor.getModels().forEach((m: any) => m.dispose()); } catch {}
    };
  }, []);

  const handleMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Keystrokes
    editor.onKeyDown((e: any) => {
      const ke = new KeyboardEvent("keydown", { key: e.code, code: e.code });
      forwardKeystroke(ke);
    });

    // Paste events — include text length to support your copy/paste heuristics
    editor.onDidPaste((e: any) => {
      const text = editor.getModel()?.getValueInRange(e.range) || ""; // pasted segment
      const pe = new ClipboardEvent("paste");
      (pe as any).textLength = text.length; // helps classify 160–190 chars as AI if enabled in your detectors
      forwardPaste(pe as any);
    });
  };

  const handleChange = useCallback((v?: string) => {
    const next = v ?? "";
    onChange(next);
    forwardCodeChange(next);
  }, [onChange]);

  return (
    <MonacoErrorBoundary onCodeChange={onChange}>
      <Editor
        height="60vh"
        language={language}
        value={value}
        theme={theme === "light" ? "light" : "vs-dark"}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          smoothScrolling: true,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </MonacoErrorBoundary>
  );
}