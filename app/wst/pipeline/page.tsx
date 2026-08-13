"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { Profile } from "@/lib/types";

// WST — ikkinchi tashkilot (Faza 2). Company Switcher UI hali qurilmagani
// uchun bu sahifa hozircha WST org/pipeline ID'siga qattiq bog'langan.
// Kelajakda umumiy /crm/[orgSlug]/pipeline'ga aylantirilishi mumkin.
const WST_ORG_ID = "18bc3231-4887-453b-b98f-8c82954d6135";
const WST_PIPELINE_ID = "478b2249-ee32-4a99-a8fd-121d2ac3e163";

type Stage = {
  id: string;
  name: string;
  position: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
};

type Deal = {
  id: string;
  stage_id: string;
  title: string;
  value: number | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  score: number | null;
  owner_id: string | null;
  owner_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_telegram: string | null;
  contact_instagram: string | null;
  created_at: string;
  updated_at: string;
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-400 border border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  LOW: "bg-white/[0.06] text-ink-300 border border-white/10",
};
const PRIORITY_LABELS_UZ: Record<string, string> = { HIGH: "Yuqori", MEDIUM: "O'rta", LOW: "Past" };

function PipelineInner() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [addingStage, setAddingStage] = useState<string | null>(null);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealContact, setNewDealContact] = useState("");
  const [newDealPhone, setNewDealPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("crm_kanban_data", { p_pipeline: WST_PIPELINE_ID });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const result = data as { stages: Stage[]; deals: Deal[] };
    setStages((result?.stages || []).slice().sort((a, b) => a.position - b.position));
    setDeals(result?.deals || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveDeal(dealId: string, stageId: string) {
    const prev = deals;
    setDeals((cur) => cur.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d)));
    const { error } = await supabase.rpc("crm_move_deal_stage", { p_deal: dealId, p_stage: stageId });
    if (error) {
      setDeals(prev);
      setError(error.message);
    }
  }

  async function createDeal(stageId: string) {
    if (!newDealTitle.trim()) return;
    setSaving(true);
    const { error } = await supabase.rpc("crm_create_deal", {
      p_org: WST_ORG_ID,
      p_pipeline: WST_PIPELINE_ID,
      p_stage: stageId,
      p_title: newDealTitle.trim(),
      p_contact_name: newDealContact.trim() || null,
      p_contact_phone: newDealPhone.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewDealTitle("");
    setNewDealContact("");
    setNewDealPhone("");
    setAddingStage(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">WST — Sotuv pipeline</h1>
        <p className="text-sm text-ink-400">
          Lead → Contacted → Qualified → Meeting → Quotation → Negotiation → Won → Installation → Service. Kartani sudrab bosqichni
          o'zgartiring.
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
            return (
              <div
                key={stage.id}
                className="w-64 shrink-0 rounded-xl border border-white/10 bg-ink-800/60"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveDeal(dragId, stage.id);
                  setDragId(null);
                }}
              >
                <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>
                    {stage.name}
                  </span>
                  <span className="text-xs text-ink-500">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 p-2">
                  {stageDeals.map((d) => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      className="cursor-grab rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-sm hover:border-brand-300"
                    >
                      <div className="font-medium text-white">{d.title}</div>
                      <div className="mt-0.5 text-xs text-ink-400">{d.contact_name || d.contact_phone || "-"}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className={`pill ${PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.MEDIUM}`}>
                          {PRIORITY_LABELS_UZ[d.priority] || d.priority}
                        </span>
                        {d.value != null && <span className="text-xs font-medium text-brand-300">{d.value.toLocaleString()}</span>}
                      </div>
                      {d.owner_name && <div className="mt-1 truncate text-[11px] text-ink-500">{d.owner_name}</div>}
                    </div>
                  ))}
                  {stageDeals.length === 0 && <div className="px-1 py-3 text-center text-xs text-ink-600">Bo'sh</div>}

                  {addingStage === stage.id ? (
                    <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                      <input
                        autoFocus
                        value={newDealTitle}
                        onChange={(e) => setNewDealTitle(e.target.value)}
                        placeholder="Deal nomi"
                        className="w-full rounded border border-white/10 bg-ink-900 px-2 py-1 text-xs text-white outline-none"
                      />
                      <input
                        value={newDealContact}
                        onChange={(e) => setNewDealContact(e.target.value)}
                        placeholder="Kontakt ismi (ixtiyoriy)"
                        className="w-full rounded border border-white/10 bg-ink-900 px-2 py-1 text-xs text-white outline-none"
                      />
                      <input
                        value={newDealPhone}
                        onChange={(e) => setNewDealPhone(e.target.value)}
                        placeholder="Telefon (ixtiyoriy)"
                        className="w-full rounded border border-white/10 bg-ink-900 px-2 py-1 text-xs text-white outline-none"
                      />
                      <div className="flex gap-1.5">
                        <button
                          disabled={saving || !newDealTitle.trim()}
                          onClick={() => createDeal(stage.id)}
                          className="flex-1 rounded bg-brand-gradient px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                          Qo'shish
                        </button>
                        <button
                          onClick={() => setAddingStage(null)}
                          className="rounded border border-white/10 px-2 py-1 text-xs text-ink-400"
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingStage(stage.id)}
                      className="w-full rounded-lg border border-dashed border-white/10 px-2 py-1.5 text-xs text-ink-500 hover:border-brand-300 hover:text-brand-300"
                    >
                      + deal qo'shish
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WstPipelinePage() {
  return (
    <AuthGate>
      {(profile: Profile) => {
        const canView = !!profile.is_platform_owner || (profile.org_ids || []).includes(WST_ORG_ID);
        return (
          <Shell profile={profile}>
            {canView ? (
              <PipelineInner />
            ) : (
              <div className="rounded-lg border border-white/10 bg-ink-800/60 px-4 py-3 text-sm text-ink-400">
                Bu sahifaga faqat WST jamoasi yoki platforma egasi kira oladi.
              </div>
            )}
          </Shell>
        );
      }}
    </AuthGate>
  );
}
