"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      router.replace("/?auth_error=Missing%20Supabase%20public%20env");
      return;
    }

    const completeAuth = async () => {
      const code = searchParams.get("code");
      if (!code) {
        router.replace("/");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        router.replace(`/?auth_error=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace("/");
    };

    void completeAuth();
  }, [router, searchParams]);

  return <p className="text-sm text-slate-700">Completing GitHub sign-in...</p>;
}
