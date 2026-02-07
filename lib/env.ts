import { DEFAULT_DEMO_REPO } from "@/lib/constants";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

export function getServerEnv(): {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseSecretKey: string;
  openAiApiKey: string;
  demoRepo: string;
  githubTokenCookieSecret: string;
} {
  const supabaseSecretKey = requireEnv("SUPABASE_SECRET_KEY");

  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    supabaseSecretKey,
    openAiApiKey: requireEnv("OPENAI_API_KEY"),
    demoRepo: process.env.DEMO_REPO ?? DEFAULT_DEMO_REPO,
    githubTokenCookieSecret: process.env.GITHUB_TOKEN_COOKIE_SECRET ?? supabaseSecretKey
  };
}

export function getPublicEnv(): {
  supabaseUrl: string | null;
  supabasePublishableKey: string | null;
} {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null
  };
}
