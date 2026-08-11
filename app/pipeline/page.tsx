"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { DealDetailModal } from "@/components/DealDetailModal";
import { Profile } from "@/lib/types";

const PIPELINE_ID = "181e5e46-c75c-4979-b1a3-6f0076b9d0d8";

function PipelineInner({ profile }: { profile: Profile }) {
  const [stages, setStages] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("crm_kanban_data", { p_pipeline: PIPELINE_ID });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setStages(data?.stages || []);
    setDeals(data?.deals || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moveDeal(dealId: string, stageId: string) {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId } : d)));
    const { error } = await supabase.rpc("crm_move_deal_stage", { p_deal: dealId, p_stage: stageId, p_position: Date.now() });
    if (error) {
      setError(error.message);
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-500">CRM deal'lar bo'yicha umumiy voronka (kanban)</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-sm text-slate-500">Yuklanmoqda...</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
            return (
              <div
                key={stage.id}
                className="w-64 shrink-0 rounded-xl border border-slate-200 bg-white"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveDeal(dragId, stage.id);
                  setDragId(null);
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>
                    {stage.name}
                  </span>
                  <span className="text-xs text-slate-400">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 p-2">
                  {stageDeals.map((d) => (
                    <div
                      key={d.id}
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      onClick={() => setActiveDeal(d.id)}
                      className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm hover:border-brand-300"
                    >
                      <div className="font-medium text-slate-800">{d.title}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{d.contact_name || "-"}</div>
                      {d.value != null && <div className="mt-1 text-xs font-medium text-brand-600">{d.value}</div>}
                    </div>
                  ))}
                  {stageDeals.length === 0 && <div className="px-1 py-3 text-center text-xs text-slate-300">Bo'sh</div>}
                </div>
              </div>
            );
          })}
          {stages.length === 0 && <div className="text-sm text-slate-400">Pipeline bosqichlari topilmadi</div>}
        </div>
      )}

      {activeDeal && (
        <DealDetailModal
          dealId={activeDeal}
          onClose={() => setActiveDeal(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

export default function PipelinePage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><PipelineInner profile={profile} /></Shell>}</AuthGate>;
}
