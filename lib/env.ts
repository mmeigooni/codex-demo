function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

export function getServerEnv(): {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  openAiApiKey: string;
  demoRepo: string;
} {
  return {
    supabaseUrl: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    openAiApiKey: requireEnv("OPENAI_API_KEY"),
    demoRepo: process.env.DEMO_REPO ?? "mo-demo/ecommerce-checkout"
  };
}

export function getPublicEnv(): {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
} {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null
  };
}
