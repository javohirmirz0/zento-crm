const LEVEL_STYLES: Record<string, string> = {
  good: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
};
const LEVEL_LABELS_UZ: Record<string, string> = {
  good: "Yaxshi",
  warning: "Diqqat",
  critical: "Kritik",
};

export function HealthBadge({ level, score }: { level: string; score: number }) {
  return (
    <span className={`pill ${LEVEL_STYLES[level] || LEVEL_STYLES.warning}`}>
      {LEVEL_LABELS_UZ[level] || level} · {Math.round(score)}
    </span>
  );
}
