export type Judge0Submission = {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  redirect_stderr_to_stdout?: boolean;
  base64_encoded?: boolean;
  wait?: boolean;
};

export type Judge0Status = { id: number; description: string };

export type Judge0Result = {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: Judge0Status;
  time?: string | null;
  memory?: number | null;
  message?: string | null;
};

export const POLL_MS = Number(process.env.JUDGE0_POLL_INTERVAL_MS ?? 750);
export const TIMEOUT_MS = Number(process.env.JUDGE0_POLL_TIMEOUT_MS ?? 30000);

export const BASE = process.env.JUDGE0_BASE_URL!;
export function judge0Headers(): Record<string, string> {
  const key = process.env.JUDGE0_RAPIDAPI_KEY;
  const host = process.env.JUDGE0_RAPIDAPI_HOST;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (key && host) { h["X-RapidAPI-Key"] = key; h["X-RapidAPI-Host"] = host; }
  return h;
}

export const decode = (s: string | null) => (s ? Buffer.from(s, "base64").toString("utf8") : "");
export const normalize = (s: string | null) => (s ?? "").replace(/\r\n/g, "\n").trimEnd();
export const isProcessing = (id: number) => id === 1 || id === 2;