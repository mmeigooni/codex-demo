import * as React from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  default: "bg-[var(--accent)] text-white hover:brightness-95 focus-visible:ring-[var(--accent-soft)]",
  secondary:
    "bg-[var(--surface-muted)] text-[var(--text-strong)] border border-[var(--border-subtle)] hover:bg-[#f2f4f7] focus-visible:ring-[var(--accent-soft)]",
  ghost: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--accent-soft)]",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-100"
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-input)] px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
});
