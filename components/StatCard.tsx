import React from "react";

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "good" | "warning" | "critical" | "brand";
}) {
  const toneClasses: Record<string, string> = {
    default: "",
    good: "text-emerald-400",
    warning: "text-amber-400",
    critical: "text-red-400",
    brand: "text-brand-300",
  };
  const iconTone: Record<string, string> = {
    default: "bg-white/[0.06] text-ink-300",
    good: "bg-emerald-500/10 text-emerald-400",
    warning: "bg-amber-500/10 text-amber-400",
    critical: "bg-red-500/10 text-red-400",
    brand: "bg-brand-500/10 text-brand-300",
  };
  return (
    <div className="card p-4">
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</span>
        {icon && <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconTone[tone]}`}>{icon}</span>}
      </div>
      <div className={`relative mt-2 text-2xl font-semibold ${toneClasses[tone] || "text-white"}`}>{value}</div>
      {sub && <div className="relative mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}
