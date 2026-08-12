"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { PriorityBadge } from "@/components/StatusBadge";
import { LEAD_STATUSES, LEAD_STATUS_LABELS_UZ, LeadStatus, Profile } from "@/lib/types";

type PipelineLead = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  status: LeadStatus;
  priority: "HIGH" | "MEDIUM" | "LOW";
  assigned_manager: string | null;
  manager_name: string | null;
  lead_score: number | null;
  updated_at: string;
};

const STAGE_ACCENT: Record<LeadStatus, string> = {
  NEW: "text-ink-300",
  CONTACTED: "text-sky-400",
  INTERESTED: "text-indigo-400",
  APPLICATION: "text-violet-400",
  REGISTERED: "text-purple-400",
  VERIFIED: "text-fuchsia-400",
  PRODUCTS_UPLOADED: "text-pink-400",
  ACTIVE: "text-emerald-400",
  FIRST_ORDER: "text-teal-400",
  INACTIVE: "text-ink-500",
  LOST: "text-red-400",
  REJECTED: "text-red-300",
};

const STATUS_ERROR_MESSAGES: Record<string, string> = {
  use_convert_seller_lead_to_register:
    "Bu leadni \"Ro'yxatdan o'tdi\" holatiga o'tkazish uchun avval Lead sahifasida \"Founderga o'tkazish\" orqali sellerga aylantirish kerak.",
  not_authorized: "Sizda bu amalni bajarish huquqi yo'q",
  invalid_status: "Noto'g'ri status",
};

function PipelineInner({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("pipeline_board");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setLeads((data as PipelineLead[]) || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveLead(leadId: string, status: LeadStatus) {
    const prev = leads;
    setLeads((cur) => cur.map((l) => (l.id === leadId ? { ...l, status } : l)));
    const { error } = await supabase.rpc("set_seller_lead_status", { p_lead_id: leadId, p_new_status: status, p_note: null });
    if (error) {
      setLeads(prev);
      setError(STATUS_ERROR_MESSAGES[error.message] || error.message);
    } else {
      setError(null);
    }
  }

  const openColumns = LEAD_STATUSES.filter((s) => !["INACTIVE", "LOST", "REJECTED"].includes(s));
  const closedColumns = LEAD_STATUSES.filter((s) => ["INACTIVE", "LOST", "REJECTED"].includes(s));
  const visibleColumns = showClosed ? LEAD_STATUSES : openColumns;
  const closedCount = leads.filter((l) => closedColumns.includes(l.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Pipeline</h1>
          <p className="text-sm text-ink-400">
            Leadlar bo'limi bilan bir xil ma'lumot — kartani sudrab statusni o'zgartiring, bosib to'liq lead sahifasiga o'ting.
          </p>
        </div>
        <button
          onClick={() => setShowClosed((v) => !v)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ink-300 hover:bg-white/[0.05]"
        >
          {showClosed ? "Yopilganlarni yashirish" : `Yopilganlarni ko'rsatish (${closedCount})`}
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleColumns.map((status) => {
            const stageLeads = leads.filter((l) => l.status === status);
            return (
              <div
                key={status}
                className="w-64 shrink-0 rounded-xl border border-white/10 bg-ink-800/60"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveLead(dragId, status);
                  setDragId(null);
                }}
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                  <span className={`text-xs font-semibold ${STAGE_ACCENT[status]}`}>{LEAD_STATUS_LABELS_UZ[status]}</span>
                  <span className="text-xs text-ink-500">{stageLeads.length}</span>
                </div>
                <div className="space-y-2 p-2">
                  {stageLeads.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setDragId(l.id)}
                      onClick={() => router.push(`/leads/${l.id}`)}
                      className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-sm hover:border-brand-300"
                    >
                      <div className="font-medium text-white">{l.company_name}</div>
                      <div className="mt-0.5 text-xs text-ink-400">{l.contact_person || l.phone || "-"}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <PriorityBadge priority={l.priority} />
                        {l.lead_score != null && <span className="text-xs font-medium text-brand-300">{l.lead_score}</span>}
                      </div>
                      {l.manager_name && <div className="mt-1 truncate text-[11px] text-ink-500">{l.manager_name}</div>}
                    </div>
                  ))}
                  {stageLeads.length === 0 && <div className="px-1 py-3 text-center text-xs text-ink-600">Bo'sh</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><PipelineInner profile={profile} /></Shell>}</AuthGate>;
}
