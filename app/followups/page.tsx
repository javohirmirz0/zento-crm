"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconAlert, IconFollowup, IconChevronRight } from "@/components/icons";
import { Profile } from "@/lib/types";

const TASK_TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  overdue_followup: { label: "Follow-up", color: "bg-red-500/10 text-red-400 border-red-500/20", icon: IconFollowup },
  red_signal: { label: "Qizil signal", color: "bg-orange-500/10 text-orange-400 border-orange-500/20", icon: IconAlert },
  escalation: { label: "Founder", color: "bg-brand-500/10 text-brand-300 border-brand-500/20", icon: IconAlert },
};

function FollowupsInner({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<any[]>([]);
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [fu, cc] = await Promise.all([
      supabase.rpc("seller_lead_followups_due", { p_manager: null }),
      supabase.rpc("seller_command_center_today", { p_manager: null }),
    ]);
    if (fu.error) {
      setError(fu.error.message);
      setLoading(false);
      return;
    }
    setRows(fu.data || []);
    setCenter(cc.data || null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function complete(id: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("complete_seller_lead_followup", { p_followup_id: id, p_note: null });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  const overdue = rows.filter((r) => r.overdue);
  const today = rows.filter((r) => !r.overdue);
  const redSignals = center?.red_signals || [];
  const topTasks = center?.top_tasks || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Follow-up va Management Center</h1>
        <p className="text-sm text-ink-400">Bugungi vazifalar, muddati o'tgan follow-uplar va qizil signal sellerlar</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {!loading && topTasks.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Bugun qilishingiz kerak bo'lgan {topTasks.length} ta ish
          </h2>
          <div className="space-y-2">
            {topTasks.map((t: any, i: number) => {
              const meta = TASK_TYPE_META[t.task_type] || TASK_TYPE_META.overdue_followup;
              const Icon = meta.icon;
              return (
                <Link
                  key={`${t.task_type}-${t.lead_id}-${i}`}
                  href={`/leads/${t.lead_id}`}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.05]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-ink-300">
                    {i + 1}
                  </span>
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${meta.color}`}>
                    <Icon width={14} height={14} />
                  </span>
                  <span className="flex-1 text-sm text-ink-100">{t.title}</span>
                  <span className={`pill border ${meta.color}`}>{meta.label}</span>
                  <IconChevronRight width={14} height={14} className="text-ink-500" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <>
          {redSignals.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-400">
                <IconAlert width={16} height={16} /> Qizil signal — 7+ kun aloqa yo'q ({redSignals.length})
              </h2>
              <div className="space-y-2">
                {redSignals.map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/leads/${r.id}`}
                    className="flex items-center justify-between rounded-lg border border-orange-500/10 bg-orange-500/[0.04] px-3 py-2 text-sm hover:bg-orange-500/[0.08]"
                  >
                    <span className="font-medium text-white">{r.company_name}</span>
                    <span className="pill border border-orange-500/20 bg-orange-500/10 text-orange-400">{r.days_since_contact} kun</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-red-400">Muddati o'tgan ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/[0.04] px-3 py-2 text-sm">
                    <Link href={`/leads/${f.lead_id}`} className="font-medium text-white hover:text-brand-300">
                      {f.company_name}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-red-400">{new Date(f.due_at).toLocaleString("uz-UZ")}</span>
                      <button className="btn-secondary" disabled={busyId === f.id} onClick={() => complete(f.id)}>
                        Bajarildi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">Bugun / yaqin kunlarda ({today.length})</h2>
            <div className="space-y-2">
              {today.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <Link href={`/leads/${f.lead_id}`} className="font-medium text-white hover:text-brand-300">
                    {f.company_name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-ink-400">{new Date(f.due_at).toLocaleString("uz-UZ")}</span>
                    {f.note && <span className="text-ink-500">{f.note}</span>}
                    <button className="btn-secondary" disabled={busyId === f.id} onClick={() => complete(f.id)}>
                      Bajarildi
                    </button>
                  </div>
                </div>
              ))}
              {today.length === 0 && <div className="text-sm text-ink-500">Yo'q</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FollowupsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><FollowupsInner profile={profile} /></Shell>}</AuthGate>;
}
