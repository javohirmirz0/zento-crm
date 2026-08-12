"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconHistory, IconRefresh } from "@/components/icons";
import { Profile, ActivityLogRow, ACTIVITY_SOURCE_LABELS_UZ } from "@/lib/types";

const SOURCES = ["audit", "crm_lead", "crm_deal", "task"] as const;

function ActivityInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [items, setItems] = useState<ActivityLogRow[]>([]);
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_unified_activity_log", {
      p_source: source || null,
      p_actor_id: null,
      p_limit: 100,
      p_before: null,
    });
    setItems((data as ActivityLogRow[]) || []);
    setLoading(false);
  }, [source]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    if (items.length === 0) return;
    setLoadingMore(true);
    const before = items[items.length - 1].created_at;
    const { data } = await supabase.rpc("get_unified_activity_log", {
      p_source: source || null,
      p_actor_id: null,
      p_limit: 100,
      p_before: before,
    });
    setItems((prev) => [...prev, ...((data as ActivityLogRow[]) || [])]);
    setLoadingMore(false);
  }

  if (!isAdmin) {
    return <div className="card p-6 text-sm text-ink-400">Bu sahifa faqat admin/founder uchun.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Faoliyat jurnali</h1>
          <p className="text-sm text-ink-400">Barcha modullar bo'ylab birlashtirilgan WHO → WHAT → WHEN log</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Barcha manbalar</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {ACTIVITY_SOURCE_LABELS_UZ[s] || s}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={load}>
            <IconRefresh width={13} height={13} />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-ink-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-500">
            <IconHistory width={22} height={22} className="mx-auto mb-2 text-ink-600" />
            Faoliyat topilmadi.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs text-ink-400">
              <tr>
                <th className="px-4 py-2.5">Manba</th>
                <th className="px-4 py-2.5">Kim</th>
                <th className="px-4 py-2.5">Nima</th>
                <th className="px-4 py-2.5">Tafsilot</th>
                <th className="px-4 py-2.5">Vaqt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-t border-white/[0.06] align-top">
                  <td className="px-4 py-2.5">
                    <span className="pill border border-white/10 bg-white/[0.04] text-ink-300">
                      {ACTIVITY_SOURCE_LABELS_UZ[row.source] || row.source}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-300">{row.actor_name || "—"}</td>
                  <td className="px-4 py-2.5 text-ink-300">{row.action}</td>
                  <td className="max-w-md truncate px-4 py-2.5 text-ink-500 font-mono text-xs" title={row.details || ""}>
                    {row.details || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-ink-500">{new Date(row.created_at).toLocaleString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {items.length >= 100 && (
        <div className="text-center">
          <button className="btn-secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Yuklanmoqda..." : "Ko'proq yuklash"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <ActivityInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
