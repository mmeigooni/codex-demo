import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800"
};

export function Badge({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", variantClasses[variant])}>
      {children}
    </span>
  );
}
