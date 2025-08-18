import problems from "@/data/problems.json";
import type { Problem } from "@/types/problem";

export const problemService = {
  async getRandomProblem(): Promise<Problem> {
    const list = problems as Problem[];
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error("Problem bank is empty");
    }
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }
};