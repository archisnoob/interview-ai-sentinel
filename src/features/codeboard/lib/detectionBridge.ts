// This module MUST NOT import existing detection code directly to avoid cycles.
// It looks up optional globals/singletons that your app already sets (e.g., window.__detection or context).
// If none exist, it no-ops — preserving behavior.

type KeystrokeCb = (e: KeyboardEvent) => void;
type PasteCb = (e: ClipboardEvent & { textLength?: number }) => void;

declare global {
  interface Window {
    __detection?: {
      onKeystroke?: KeystrokeCb;
      onPaste?: PasteCb;
      onCodeChange?: (value: string) => void;
    };
  }
}

export function forwardKeystroke(e: KeyboardEvent) {
  try { window.__detection?.onKeystroke?.(e); } catch {}
}
export function forwardPaste(e: ClipboardEvent & { textLength?: number }) {
  try { window.__detection?.onPaste?.(e); } catch {}
}
export function forwardCodeChange(value: string) {
  try { window.__detection?.onCodeChange?.(value); } catch {}
}