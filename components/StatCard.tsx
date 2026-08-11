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
  tone?: "default" | "good" | "warning" | "critical";
}) {
  const toneClasses: Record<string, string> = {
    default: "border-slate-200",
    good: "border-green-200 bg-green-50/40",
    warning: "border-amber-200 bg-amber-50/40",
    critical: "border-red-200 bg-red-50/40",
  };
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
