import OpenAI from "openai";

import { getServerEnv } from "@/lib/env";
import { openAiOutputJsonSchema, runResultSchema } from "@/lib/schemas";
import type { RunResult } from "@/lib/types";

export async function executeStructuredReview(prompt: string, timeoutMs = 15_000): Promise<RunResult> {
  const env = getServerEnv();
  const client = new OpenAI({ apiKey: env.openAiApiKey });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await client.responses.create(
      {
        model: "gpt-5.1-codex-mini",
        input: [
          {
            role: "user",
            content: prompt
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "workflow_review",
            schema: openAiOutputJsonSchema,
            strict: true
          }
        }
      },
      {
        signal: controller.signal
      }
    );

    const text = response.output_text;
    if (!text) {
      throw new Error("OpenAI response did not include output_text");
    }

    const parsed = JSON.parse(text);
    const validated = runResultSchema.safeParse(parsed);

    if (!validated.success) {
      throw new Error(`OpenAI response failed schema validation: ${validated.error.message}`);
    }

    return validated.data;
  } finally {
    clearTimeout(timeoutId);
  }
}
