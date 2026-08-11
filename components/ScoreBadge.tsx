export function ScoreBadge({ score }: { score: number }) {
  let cls = "bg-slate-100 text-slate-600";
  if (score >= 70) cls = "bg-green-100 text-green-700";
  else if (score >= 40) cls = "bg-amber-100 text-amber-700";
  else cls = "bg-red-100 text-red-700";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{score}</span>;
}
