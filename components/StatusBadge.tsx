import { LEAD_STATUS_LABELS_UZ, LeadStatus, PRIORITY_LABELS_UZ, Priority } from "@/lib/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-white/[0.06] text-ink-300 border border-white/10",
  CONTACTED: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  INTERESTED: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  APPLICATION: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  REGISTERED: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  VERIFIED: "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20",
  PRODUCTS_UPLOADED: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  FIRST_ORDER: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  INACTIVE: "bg-white/[0.06] text-ink-400 border border-white/10",
  LOST: "bg-red-500/10 text-red-400 border border-red-500/20",
  REJECTED: "bg-red-500/15 text-red-300 border border-red-500/30",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`pill ${STATUS_COLORS[status] || "bg-white/[0.06] text-ink-300 border border-white/10"}`}>
      {LEAD_STATUS_LABELS_UZ[status] || status}
    </span>
  );
}

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "bg-red-500/10 text-red-400 border border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LOW: "bg-white/[0.06] text-ink-300 border border-white/10",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`pill ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM}`}>
      {PRIORITY_LABELS_UZ[priority] || priority}
    </span>
  );
}
