import { Suspense } from "react";

import { AuthCallbackClient } from "@/app/auth/callback/auth-callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <Suspense fallback={<p className="text-sm text-slate-700">Loading callback...</p>}>
        <AuthCallbackClient />
      </Suspense>
    </main>
  );
}
