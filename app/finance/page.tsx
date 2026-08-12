"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { IconWallet, IconSparkles } from "@/components/icons";
import { Profile, FinanceOverview } from "@/lib/types";

function fmt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(n)) + " so'm";
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function FinanceInner({ profile }: { profile: Profile }) {
  const canView = ["admin", "founder", "finance_manager"].includes(profile.role);
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  const [to, setTo] = useState(toDateInput(new Date()));
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("finance_contribution_overview", { p_from: from, p_to: to });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setData(data as FinanceOverview);
    setError(null);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return <div className="card p-6 text-sm text-ink-400">Bu sahifa faqat admin/founder/moliya menejeri uchun.</div>;
  }

  const marginPct = data && data.gmv > 0 ? Math.round((data.estimated_contribution / data.gmv) * 1000) / 10 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Moliya — Contribution Overview</h1>
          <p className="text-sm text-ink-400">GMV, komissiya, yetkazish xarajati va taxminiy ZENTO contribution</p>
        </div>
        <div className="flex items-center gap-2">
          <input className="input w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-ink-500">—</span>
          <input className="input w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading || !data ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="GMV" value={fmt(data.gmv)} icon={<IconSparkles width={15} height={15} />} tone="brand" />
            <StatCard label="Sotuvchi komissiyasi" value={fmt(data.seller_commission)} tone="good" />
            <StatCard label="Yetkazish xarajati" value={fmt(data.delivery_cost)} />
            <StatCard label="Qaytarish ta'siri" value={fmt(data.return_impact)} tone={data.return_impact > 0 ? "critical" : "default"} />
            <StatCard
              label="Taxminiy ZENTO contribution"
              value={fmt(data.estimated_contribution)}
              icon={<IconWallet width={15} height={15} />}
              tone="good"
              sub={marginPct !== null ? `GMV'ning ${marginPct}%` : undefined}
            />
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs text-ink-300">
            <strong className="text-amber-400">Eslatma:</strong> {data.note}. Hisobga olinmagan: {data.not_tracked.join(", ")}.
          </div>
        </>
      )}
    </div>
  );
}

export default function FinancePage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <FinanceInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
