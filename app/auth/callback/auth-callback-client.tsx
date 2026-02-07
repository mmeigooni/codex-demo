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

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        router.replace(`/?auth_error=${encodeURIComponent(error.message)}`);
        return;
      }

      const providerToken = data.session?.provider_token;
      if (providerToken) {
        const relayResponse = await fetch("/api/auth/github-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ providerToken })
        });

        if (!relayResponse.ok) {
          let details = "Failed to persist GitHub token";
          try {
            const payload = (await relayResponse.json()) as { error?: string };
            details = payload.error ?? details;
          } catch {
            // Ignore JSON parse failure and use default details message.
          }
          router.replace(`/?auth_error=${encodeURIComponent(details)}`);
          return;
        }
      }

      router.replace("/");
    };

    void completeAuth();
  }, [router, searchParams]);

  return <p className="text-sm text-slate-700">Completing GitHub sign-in...</p>;
}
