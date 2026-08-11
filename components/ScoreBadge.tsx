export function ScoreBadge({ score }: { score: number }) {
  let cls = "bg-white/[0.06] text-ink-300 border border-white/10";
  if (score >= 70) cls = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  else if (score >= 40) cls = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  else cls = "bg-red-500/10 text-red-400 border border-red-500/20";
  return <span className={`pill font-semibold ${cls}`}>{score}</span>;
}
