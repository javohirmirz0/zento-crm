"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { IconSparkles } from "@/components/icons";
import { Profile } from "@/lib/types";

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return "-";
  return new Intl.NumberFormat("uz-UZ").format(Math.round(n));
}

function EconomicsInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [rows, setRows] = useState<any[]>([]);
  const [cac, setCac] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costDrafts, setCostDrafts] = useState<Record<string, string>>({});
  const [savingSource, setSavingSource] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const calls: PromiseLike<any>[] = [supabase.rpc("seller_economics_overview", { p_lead_id: null })];
    if (isAdmin) calls.push(supabase.rpc("seller_acquisition_cac"));
    const results = await Promise.all(calls);
    const [eco, cacRes] = results;
    if (eco?.error) setError(eco.error.message);
    else setError(null);
    setRows(eco?.data || []);
    if (isAdmin && cacRes) {
      setCac(cacRes.data || null);
      const drafts: Record<string, string> = {};
      (cacRes.data?.by_source || []).forEach((s: any) => {
        drafts[s.source_id] = String(s.monthly_cost_estimate ?? 0);
      });
      setCostDrafts(drafts);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCost(sourceId: string) {
    setSavingSource(sourceId);
    const val = Number(costDrafts[sourceId] || 0);
    const { error } = await supabase.rpc("set_seller_lead_source_cost", { p_source_id: sourceId, p_monthly_cost: val });
    setSavingSource(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  const totalGmv = rows.reduce((s, r) => s + (r.gmv_90d || 0), 0);
  const totalCommission = rows.reduce((s, r) => s + (r.commission_90d || 0), 0);
  const avgLtv = rows.length ? rows.reduce((s, r) => s + (r.ltv_annualized_estimate || 0), 0) / rows.length : 0;
  const ltvCacRatio = cac?.blended?.blended_cac ? avgLtv / cac.blended.blended_cac : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Seller iqtisodiyoti</h1>
        <p className="text-sm text-ink-400">GMV, komissiya, LTV va CAC — konvertatsiya qilingan sellerlar bo'yicha (90 kunlik oyna)</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="GMV (90 kun)" value={`${fmt(totalGmv)} so'm`} icon={<IconSparkles width={15} height={15} />} tone="brand" />
        <StatCard label="Komissiya (90 kun)" value={`${fmt(totalCommission)} so'm`} tone="good" />
        <StatCard label="O'rtacha yillik LTV" value={`${fmt(avgLtv)} so'm`} />
        {isAdmin && <StatCard label="Blended CAC (30 kun)" value={cac?.blended?.blended_cac != null ? `${fmt(cac.blended.blended_cac)} so'm` : "-"} tone={ltvCacRatio && ltvCacRatio < 3 ? "warning" : "good"} sub={ltvCacRatio ? `LTV:CAC = ${ltvCacRatio.toFixed(1)}x` : undefined} />}
      </div>

      {isAdmin && cac?.by_source && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Manba bo'yicha CAC (oylik xarajat siz kiritasiz)</h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-ink-500">
                <th className="pb-2">Manba</th>
                <th className="pb-2 text-right">30 kunda yangi seller</th>
                <th className="pb-2 text-right">Oylik xarajat (so'm)</th>
                <th className="pb-2 text-right">CAC</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {cac.by_source.map((s: any) => (
                <tr key={s.source_id} className="border-t border-white/[0.06]">
                  <td className="py-2 text-ink-100">{s.source_name}</td>
                  <td className="py-2 text-right text-ink-300">{s.new_sellers_30d}</td>
                  <td className="py-2 text-right">
                    <input
                      className="input w-32 text-right"
                      type="number"
                      min={0}
                      value={costDrafts[s.source_id] ?? "0"}
                      onChange={(e) => setCostDrafts((prev) => ({ ...prev, [s.source_id]: e.target.value }))}
                    />
                  </td>
                  <td className="py-2 text-right font-medium text-white">{s.cac != null ? fmt(s.cac) : "-"}</td>
                  <td className="py-2 text-right">
                    <button className="btn-secondary" disabled={savingSource === s.source_id} onClick={() => saveCost(s.source_id)}>
                      Saqlash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 pb-0">
          <h2 className="text-sm font-semibold text-white">Seller bo'yicha iqtisodiyot</h2>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-ink-400">Yuklanmoqda...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs text-ink-400">
              <tr>
                <th className="px-4 py-2.5">Seller</th>
                <th className="px-4 py-2.5 text-right">Aktiv SKU</th>
                <th className="px-4 py-2.5 text-right">Buyurtma (90k)</th>
                <th className="px-4 py-2.5 text-right">GMV (90k)</th>
                <th className="px-4 py-2.5 text-right">Komissiya (90k)</th>
                <th className="px-4 py-2.5 text-right">AOV</th>
                <th className="px-4 py-2.5 text-right">Bekor %</th>
                <th className="px-4 py-2.5 text-right">Qaytarish %</th>
                <th className="px-4 py-2.5 text-right">Yillik LTV (taxminiy)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-ink-500">
                    Konvertatsiya qilingan seller topilmadi
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.lead_id} className="border-t border-white/[0.06] hover:bg-white/[0.05]">
                  <td className="px-4 py-2.5">
                    <Link href={`/leads/${r.lead_id}`} className="font-medium text-white hover:text-brand-300">
                      {r.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-ink-300">{r.active_sku_count}</td>
                  <td className="px-4 py-2.5 text-right text-ink-300">{r.orders_90d}</td>
                  <td className="px-4 py-2.5 text-right text-ink-100">{fmt(r.gmv_90d)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400">{fmt(r.commission_90d)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-300">{fmt(r.aov_90d)}</td>
                  <td className="px-4 py-2.5 text-right text-ink-300">{r.cancel_pct}%</td>
                  <td className="px-4 py-2.5 text-right text-ink-300">{r.return_pct}%</td>
                  <td className="px-4 py-2.5 text-right font-medium text-white">{fmt(r.ltv_annualized_estimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function EconomicsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><EconomicsInner profile={profile} /></Shell>}</AuthGate>;
}
