import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Workflow Packs MVP",
  description: "Codex workflow governance demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
