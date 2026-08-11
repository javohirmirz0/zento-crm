"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { AskAiBox } from "@/components/AskAiBox";
import { HealthBadge } from "@/components/HealthBadge";
import {
  Profile,
  FUNNEL_STATUSES,
  LEAD_STATUS_LABELS_UZ,
  OBJECTION_LABELS_UZ,
  SellerHealth,
} from "@/lib/types";

const CONVERSION_PAIRS: [string, string][] = [
  ["NEW", "CONTACTED"],
  ["CONTACTED", "INTERESTED"],
  ["INTERESTED", "APPLICATION"],
  ["APPLICATION", "REGISTERED"],
  ["REGISTERED", "ACTIVE"],
  ["ACTIVE", "FIRST_ORDER"],
];

function DashboardInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [growth, setGrowth] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [objections, setObjections] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [health, setHealth] = useState<SellerHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const calls: PromiseLike<any>[] = [
        supabase.rpc("admin_seller_growth_dashboard"),
        supabase.rpc("seller_acquisition_funnel", { p_from: null, p_to: null }),
        supabase.rpc("seller_lead_followups_due", { p_manager: null }),
        supabase.rpc("seller_lead_objections_breakdown", { p_from: null, p_to: null, p_manager: null }),
        supabase.rpc("seller_leads_escalation_shortlist"),
        supabase.rpc("seller_lead_source_performance"),
        supabase.rpc("crm_seller_health_overview", { p_manager: null, p_lead_id: null }),
      ];
      if (isAdmin) calls.push(supabase.rpc("manager_leaderboard"));
      const results = await Promise.all(calls);
      if (!active) return;
      const [g, f, fu, ob, esc, src, hea, lead] = results;
      if (g?.error) setError(g.error.message || "Xatolik");
      setGrowth(g?.data ?? null);
      setFunnel(f?.data ?? null);
      setFollowups(fu?.data ?? []);
      setObjections(ob?.data ?? null);
      setEscalations(esc?.data ?? []);
      setSources(src?.data ?? []);
      setHealth(hea?.data ?? []);
      if (isAdmin) setLeaderboard(lead?.data ?? []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const stagesByStatus: Record<string, { count: number; pct_of_total: number }> = {};
  (funnel?.stages || []).forEach((s: any) => {
    stagesByStatus[s.status] = s;
  });

  function convRate(from: string, to: string) {
    const a = stagesByStatus[from]?.count ?? 0;
    const b = stagesByStatus[to]?.count ?? 0;
    if (!a) return null;
    return Math.round((b / a) * 1000) / 10;
  }

  if (loading) return <div className="text-sm text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Seller acquisition va o'sish ko'rsatkichlari</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jami sellerlar" value={growth?.total_sellers ?? "-"} />
        <StatCard label="Aktiv sellerlar" value={growth?.active_sellers ?? "-"} tone="good" />
        <StatCard label="30 kunda yangi" value={growth?.new_sellers_30d ?? "-"} />
        <StatCard label="Yo'qotilgan leadlar" value={growth?.lost_leads ?? "-"} tone="critical" />
      </div>

      {growth?.sku_tracker && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-800">SKU maqsad</span>
            <span className="text-slate-500">
              {growth.sku_tracker.current} / {growth.sku_tracker.target} ({growth.sku_tracker.progress_pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${Math.min(100, growth.sku_tracker.progress_pct)}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Voronka (9 bosqich)</h2>
            <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
              Barcha leadlar →
            </Link>
          </div>
          <div className="space-y-2">
            {FUNNEL_STATUSES.map((status) => {
              const s = stagesByStatus[status];
              const pct = s?.pct_of_total ?? 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-xs text-slate-600">{LEAD_STATUS_LABELS_UZ[status]}</div>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                    <div className="h-5 rounded bg-brand-500" style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <div className="w-16 shrink-0 text-right text-xs font-medium text-slate-700">{s?.count ?? 0}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500 sm:grid-cols-6">
            {CONVERSION_PAIRS.map(([a, b]) => {
              const rate = convRate(a, b);
              return (
                <div key={a + b} className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="font-semibold text-slate-800">{rate === null ? "-" : `${rate}%`}</div>
                  <div className="mt-0.5">
                    {LEAD_STATUS_LABELS_UZ[a as keyof typeof LEAD_STATUS_LABELS_UZ]} → {LEAD_STATUS_LABELS_UZ[b as keyof typeof LEAD_STATUS_LABELS_UZ]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AskAiBox />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">E'tirozlar taqsimoti</h2>
          {(objections?.breakdown || []).length === 0 && <div className="text-sm text-slate-400">Ma'lumot yo'q</div>}
          <div className="space-y-2">
            {(objections?.breakdown || []).map((o: any) => (
              <div key={o.objection_type} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{OBJECTION_LABELS_UZ[o.objection_type as keyof typeof OBJECTION_LABELS_UZ] || o.objection_type}</span>
                <span className="font-medium text-slate-800">
                  {o.count} ({o.pct_of_total}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Manba samaradorligi</h2>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="pb-2">Manba</th>
                  <th className="pb-2 text-right">Jami</th>
                  <th className="pb-2 text-right">Aktiv</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s: any) => (
                  <tr key={s.source_id || s.source_name} className="border-t border-slate-100">
                    <td className="py-1.5 text-slate-700">{s.source_name}</td>
                    <td className="py-1.5 text-right text-slate-600">{s.total_leads}</td>
                    <td className="py-1.5 text-right text-slate-600">{s.active_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAdmin && leaderboard.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Menejerlar reytingi</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="pb-2">Menejer</th>
                <th className="pb-2 text-right">Biriktirilgan</th>
                <th className="pb-2 text-right">Qiziqqan</th>
                <th className="pb-2 text-right">Aktiv</th>
                <th className="pb-2 text-right">1-buyurtma</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((m: any) => (
                <tr key={m.manager_id} className="border-t border-slate-100">
                  <td className="py-1.5 font-medium text-slate-800">{m.full_name}</td>
                  <td className="py-1.5 text-right text-slate-600">{m.assigned_count}</td>
                  <td className="py-1.5 text-right text-slate-600">{m.interested_count}</td>
                  <td className="py-1.5 text-right text-slate-600">{m.active_count}</td>
                  <td className="py-1.5 text-right text-slate-600">{m.first_order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Bugungi follow-uplar</h2>
            <Link href="/followups" className="text-xs font-medium text-brand-600 hover:underline">
              Barchasi →
            </Link>
          </div>
          {followups.length === 0 && <div className="text-sm text-slate-400">Muddati kelgan follow-up yo'q</div>}
          <div className="space-y-2">
            {followups.slice(0, 6).map((f: any) => (
              <Link key={f.id} href={`/leads/${f.lead_id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <span className="text-slate-700">{f.company_name}</span>
                <span className={f.overdue ? "text-red-600" : "text-slate-500"}>{new Date(f.due_at).toLocaleDateString("uz-UZ")}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Founderga o'tkazilganlar</h2>
          {escalations.length === 0 && <div className="text-sm text-slate-400">Yo'q</div>}
          <div className="space-y-2">
            {escalations.slice(0, 6).map((e: any) => (
              <Link key={e.id} href={`/leads/${e.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <span className="text-slate-700">{e.company_name}</span>
                <span className="text-xs text-slate-400">{e.escalate_reason}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {health.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Seller salomatligi (converted)</h2>
          <div className="space-y-2">
            {health.slice(0, 8).map((h) => (
              <Link key={h.lead_id} href={`/leads/${h.lead_id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                <span className="text-slate-700">{h.company_name}</span>
                <HealthBadge level={h.health_level} score={h.health_score} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><DashboardInner profile={profile} /></Shell>}</AuthGate>;
}
