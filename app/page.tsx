"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { AskAiBox } from "@/components/AskAiBox";
import { HealthBadge } from "@/components/HealthBadge";
import { IconLeads, IconSparkles, IconAlert, IconPipeline } from "@/components/icons";
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

// Faza 1, Qadam 1.3: Employee Portal ajratildi — Command Center (bu sahifa) endi faqat
// admin/founder uchun. Boshqa rollar (employee-tier) avtomatik /work'ga yo'naltiriladi.
const EMPLOYEE_PORTAL_ROLES = ["seller_manager", "ops_manager", "logistics_manager", "finance_manager", "ai_developer", "employee"];

function DashboardInner({ profile }: { profile: Profile }) {
  const router = useRouter();
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const shouldRedirectToWork = EMPLOYEE_PORTAL_ROLES.includes(profile.role);
  const [growth, setGrowth] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [objections, setObjections] = useState<any>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [health, setHealth] = useState<SellerHealth[]>([]);
  const [center, setCenter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shouldRedirectToWork) router.replace("/work");
  }, [shouldRedirectToWork, router]);

  useEffect(() => {
    if (shouldRedirectToWork) return;
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
        supabase.rpc("seller_command_center_today", { p_manager: null }),
      ];
      if (isAdmin) calls.push(supabase.rpc("manager_leaderboard"));
      const results = await Promise.all(calls);
      if (!active) return;
      const [g, f, fu, ob, esc, src, hea, cc, lead] = results;
      if (g?.error) setError(g.error.message || "Xatolik");
      setGrowth(g?.data ?? null);
      setFunnel(f?.data ?? null);
      setFollowups(fu?.data ?? []);
      setObjections(ob?.data ?? null);
      setEscalations(esc?.data ?? []);
      setSources(src?.data ?? []);
      setHealth(hea?.data ?? []);
      setCenter(cc?.data ?? null);
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

  if (loading) return <div className="text-sm text-ink-400">Yuklanmoqda...</div>;

  const totalPipeline = FUNNEL_STATUSES.reduce((sum, s) => sum + (stagesByStatus[s]?.count ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="card relative overflow-hidden p-6">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-brand-300">Sales Operating System</div>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Salom, {profile.full_name?.split(" ")[0] || "Foundator"} 👋
            </h1>
            <p className="mt-1 text-sm text-ink-400">Seller acquisition va o'sish ko'rsatkichlari — real vaqtda</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-right">
              <div className="text-xs text-ink-400">Voronkada jami</div>
              <div className="text-2xl font-semibold text-white">{totalPipeline}</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-right">
              <div className="text-xs text-emerald-400/80">Aktiv sellerlar</div>
              <div className="text-2xl font-semibold text-emerald-400">{growth?.active_sellers ?? "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {center?.top_tasks?.length > 0 && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Bugun qilishingiz kerak bo'lgan {center.top_tasks.length} ta ish
            </h2>
            <Link href="/followups" className="text-xs font-medium text-brand-300 hover:underline">
              Management Center →
            </Link>
          </div>
          <div className="space-y-2">
            {center.top_tasks.slice(0, 5).map((t: any, i: number) => (
              <Link
                key={`${t.task_type}-${t.lead_id}-${i}`}
                href={`/leads/${t.lead_id}`}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm transition hover:bg-white/[0.05]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-ink-300">
                  {i + 1}
                </span>
                <span className="flex-1 text-ink-100">{t.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jami sellerlar" value={growth?.total_sellers ?? "-"} icon={<IconLeads width={15} height={15} />} tone="brand" />
        <StatCard label="Aktiv sellerlar" value={growth?.active_sellers ?? "-"} icon={<IconSparkles width={15} height={15} />} tone="good" />
        <StatCard label="30 kunda yangi" value={growth?.new_sellers_30d ?? "-"} icon={<IconPipeline width={15} height={15} />} />
        <StatCard label="Yo'qotilgan leadlar" value={growth?.lost_leads ?? "-"} icon={<IconAlert width={15} height={15} />} tone="critical" />
      </div>

      {growth?.sku_tracker && (
        <div className="card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-white">SKU maqsad</span>
            <span className="text-ink-400">
              {growth.sku_tracker.current} / {growth.sku_tracker.target} ({growth.sku_tracker.progress_pct}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-2 rounded-full bg-brand-gradient" style={{ width: `${Math.min(100, growth.sku_tracker.progress_pct)}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Voronka (9 bosqich)</h2>
            <Link href="/leads" className="text-xs font-medium text-brand-300 hover:underline">
              Barcha leadlar →
            </Link>
          </div>
          <div className="space-y-2">
            {FUNNEL_STATUSES.map((status) => {
              const s = stagesByStatus[status];
              const pct = s?.pct_of_total ?? 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 text-xs text-ink-300">{LEAD_STATUS_LABELS_UZ[status]}</div>
                  <div className="h-5 flex-1 overflow-hidden rounded bg-white/[0.06]">
                    <div className="h-5 rounded bg-brand-gradient" style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <div className="w-16 shrink-0 text-right text-xs font-medium text-ink-100">{s?.count ?? 0}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-ink-400 sm:grid-cols-6">
            {CONVERSION_PAIRS.map(([a, b]) => {
              const rate = convRate(a, b);
              return (
                <div key={a + b} className="rounded-lg bg-white/[0.04] p-2 text-center">
                  <div className="font-semibold text-white">{rate === null ? "-" : `${rate}%`}</div>
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
          <h2 className="mb-3 text-sm font-semibold text-white">E'tirozlar taqsimoti</h2>
          {(objections?.breakdown || []).length === 0 && <div className="text-sm text-ink-500">Ma'lumot yo'q</div>}
          <div className="space-y-2">
            {(objections?.breakdown || []).map((o: any) => (
              <div key={o.objection_type} className="flex items-center justify-between text-sm">
                <span className="text-ink-300">{OBJECTION_LABELS_UZ[o.objection_type as keyof typeof OBJECTION_LABELS_UZ] || o.objection_type}</span>
                <span className="font-medium text-white">
                  {o.count} ({o.pct_of_total}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Manba samaradorligi</h2>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-ink-500">
                  <th className="pb-2">Manba</th>
                  <th className="pb-2 text-right">Jami</th>
                  <th className="pb-2 text-right">Aktiv</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s: any) => (
                  <tr key={s.source_id || s.source_name} className="border-t border-white/[0.06]">
                    <td className="py-1.5 text-ink-100">{s.source_name}</td>
                    <td className="py-1.5 text-right text-ink-300">{s.total_leads}</td>
                    <td className="py-1.5 text-right text-ink-300">{s.active_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAdmin && leaderboard.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Menejerlar reytingi</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-500">
                <th className="pb-2">Menejer</th>
                <th className="pb-2 text-right">Biriktirilgan</th>
                <th className="pb-2 text-right">Qiziqqan</th>
                <th className="pb-2 text-right">Aktiv</th>
                <th className="pb-2 text-right">1-buyurtma</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((m: any) => (
                <tr key={m.manager_id} className="border-t border-white/[0.06]">
                  <td className="py-1.5 font-medium text-white">{m.full_name}</td>
                  <td className="py-1.5 text-right text-ink-300">{m.assigned_count}</td>
                  <td className="py-1.5 text-right text-ink-300">{m.interested_count}</td>
                  <td className="py-1.5 text-right text-ink-300">{m.active_count}</td>
                  <td className="py-1.5 text-right text-ink-300">{m.first_order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Bugungi follow-uplar</h2>
            <Link href="/followups" className="text-xs font-medium text-brand-300 hover:underline">
              Barchasi →
            </Link>
          </div>
          {followups.length === 0 && <div className="text-sm text-ink-500">Muddati kelgan follow-up yo'q</div>}
          <div className="space-y-2">
            {followups.slice(0, 6).map((f: any) => (
              <Link key={f.id} href={`/leads/${f.lead_id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]">
                <span className="text-ink-100">{f.company_name}</span>
                <span className={f.overdue ? "text-red-400" : "text-ink-400"}>{new Date(f.due_at).toLocaleDateString("uz-UZ")}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Founderga o'tkazilganlar</h2>
          {escalations.length === 0 && <div className="text-sm text-ink-500">Yo'q</div>}
          <div className="space-y-2">
            {escalations.slice(0, 6).map((e: any) => (
              <Link key={e.id} href={`/leads/${e.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]">
                <span className="text-ink-100">{e.company_name}</span>
                <span className="text-xs text-ink-500">{e.escalate_reason}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {health.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Seller salomatligi (converted)</h2>
          <div className="space-y-2">
            {health.slice(0, 8).map((h) => (
              <Link key={h.lead_id} href={`/leads/${h.lead_id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/[0.05]">
                <span className="text-ink-100">{h.company_name}</span>
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
