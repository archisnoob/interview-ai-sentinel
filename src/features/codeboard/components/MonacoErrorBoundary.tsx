"use client";
import React from "react";

export class MonacoErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(p: any) { super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: any, info: any) {
    // Keep logging in your existing pipeline if globally available
    try {
      (window as any).__logComponentError?.("MonacoEditor", err, info);
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <textarea
          className="w-full h-64 p-2 border rounded bg-background text-foreground"
          onChange={(e) => this.props.onCodeChange?.(e.target.value)}
          placeholder="Editor failed—type here"
        />
      );
    }
    return this.props.children;
  }
}
