import { readFile } from "node:fs/promises";
import path from "node:path";

import { runResultSchema } from "@/lib/schemas";
import type { RunResult } from "@/lib/types";

export async function loadFallbackFixture(memoryVersion: number): Promise<RunResult> {
  const fixtureFile = memoryVersion <= 1 ? "run1-memory-v1.json" : "run2-memory-v2.json";
  const fixturePath = path.join(process.cwd(), "fixtures", fixtureFile);
  const content = await readFile(fixturePath, "utf8");
  const parsed = JSON.parse(content);
  return runResultSchema.parse(parsed);
}
