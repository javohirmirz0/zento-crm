import { LEAD_STATUS_LABELS_UZ, LeadStatus, PRIORITY_LABELS_UZ, Priority } from "@/lib/types";

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  INTERESTED: "bg-indigo-100 text-indigo-700",
  APPLICATION: "bg-violet-100 text-violet-700",
  REGISTERED: "bg-purple-100 text-purple-700",
  VERIFIED: "bg-fuchsia-100 text-fuchsia-700",
  PRODUCTS_UPLOADED: "bg-pink-100 text-pink-700",
  ACTIVE: "bg-green-100 text-green-700",
  FIRST_ORDER: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-gray-200 text-gray-600",
  LOST: "bg-red-100 text-red-700",
  REJECTED: "bg-red-200 text-red-800",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status] || "bg-slate-100 text-slate-700"}`}>
      {LEAD_STATUS_LABELS_UZ[status] || status}
    </span>
  );
}

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "bg-red-50 text-red-700 border border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
  LOW: "bg-slate-50 text-slate-600 border border-slate-200",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.MEDIUM}`}>
      {PRIORITY_LABELS_UZ[priority] || priority}
    </span>
  );
}
