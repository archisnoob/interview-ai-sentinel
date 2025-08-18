// Mock API endpoint for Vite/React app
import problems from "@/data/problems.json";
import type { Problem } from "@/types/problem";

// This would be handled by a real backend in production
export async function GET() {
  try {
    const list = problems as Problem[];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Problem bank is empty");
    }
    const idx = Math.floor(Math.random() * list.length);
    return { json: () => Promise.resolve(list[idx]) };
  } catch (e: any) {
    return { json: () => Promise.resolve({ error: "Failed to load problem bank" }), status: 500 };
  }
}