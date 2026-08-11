const LEVEL_STYLES: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};
const LEVEL_LABELS_UZ: Record<string, string> = {
  good: "Yaxshi",
  warning: "Diqqat",
  critical: "Kritik",
};

export function HealthBadge({ level, score }: { level: string; score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_STYLES[level] || LEVEL_STYLES.warning}`}>
      {LEVEL_LABELS_UZ[level] || level} · {Math.round(score)}
    </span>
  );
}
