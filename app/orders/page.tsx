"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { IconAlert, IconRefresh } from "@/components/icons";
import { Profile, OrderException, LogisticsDashboard, ORDER_EXCEPTION_SOURCE_LABELS_UZ } from "@/lib/types";

const STAGE_LABELS_UZ: Record<string, string> = {
  awaiting_dropoff: "Topshirish kutilmoqda",
  dropped_off: "Topshirildi (QC kutilmoqda)",
  received: "Qabul qilindi",
  qc_pass: "QC o'tdi",
  qc_fail: "QC o'tmadi",
  packed: "Qadoqlandi",
  courier_assigned: "Kuryer biriktirildi",
  picked_up: "Kuryer oldi",
  delivered: "Yetkazildi",
};

function OrdersInner({ profile }: { profile: Profile }) {
  const canView = ["admin", "founder", "ops_manager", "logistics_manager"].includes(profile.role);
  const [exceptions, setExceptions] = useState<OrderException[]>([]);
  const [logistics, setLogistics] = useState<LogisticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [exc, log] = await Promise.all([
      supabase.rpc("order_exception_center"),
      supabase.rpc("logistics_employee_dashboard"),
    ]);
    if (exc.error) {
      setError(exc.error.message);
      setLoading(false);
      return;
    }
    setExceptions((exc.data as OrderException[]) || []);
    setLogistics((log.data as LogisticsDashboard) || null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) {
    return <div className="card p-6 text-sm text-ink-400">Bu sahifa faqat admin/operatsion/logistika menejeri uchun.</div>;
  }

  const critical = exceptions.filter((e) => e.severity === "critical");
  const warning = exceptions.filter((e) => e.severity === "warning");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Buyurtmalar — Exception Center</h1>
          <p className="text-sm text-ink-400">Diqqat talab qiladigan buyurtmalar va logistika holati</p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <IconRefresh width={14} height={14} /> Yangilash
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Kritik" value={critical.length} tone={critical.length > 0 ? "critical" : "default"} icon={<IconAlert width={15} height={15} />} />
        <StatCard label="Ogohlantirish" value={warning.length} tone={warning.length > 0 ? "warning" : "default"} />
        {logistics &&
          Object.entries(logistics.stage_counts).map(([stage, count]) => (
            <StatCard key={stage} label={STAGE_LABELS_UZ[stage] || stage} value={count} />
          ))}
      </div>

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="p-4 pb-0">
              <h2 className="text-sm font-semibold text-white">🚨 Harakat talab qilinadi ({exceptions.length})</h2>
            </div>
            {exceptions.length === 0 ? (
              <div className="p-4 text-sm text-ink-500">Hozircha muammoli buyurtma yo'q.</div>
            ) : (
              <table className="mt-3 w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs text-ink-400">
                  <tr>
                    <th className="px-4 py-2.5">Turi</th>
                    <th className="px-4 py-2.5">Tafsilot</th>
                    <th className="px-4 py-2.5">Buyurtma</th>
                    <th className="px-4 py-2.5">Vaqt</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((e, i) => (
                    <tr key={i} className="border-t border-white/[0.06]">
                      <td className="px-4 py-2.5">
                        <span className={`pill border ${e.severity === "critical" ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-amber-500/20 bg-amber-500/10 text-amber-400"}`}>
                          {ORDER_EXCEPTION_SOURCE_LABELS_UZ[e.source] || e.source}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-300">{e.title}{e.detail && ` — ${e.detail}`}</td>
                      <td className="px-4 py-2.5 text-ink-500 font-mono text-xs">{e.order_id?.slice(0, 8)}</td>
                      <td className="px-4 py-2.5 text-ink-500">{e.since ? new Date(e.since).toLocaleString("uz-UZ") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {logistics && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[
                { title: "Qabul qiluvchilar (30 kun)", rows: logistics.by_receiver, key: "received_count" as const },
                { title: "QC (30 kun)", rows: logistics.by_qc, key: "qc_count" as const },
                { title: "Qadoqlovchilar (30 kun)", rows: logistics.by_packer, key: "packed_count" as const },
                { title: "Kuryerlar — yetkazilgan (30 kun)", rows: logistics.by_courier, key: "delivered_count" as const },
              ].map((section) => (
                <div key={section.title} className="card p-4">
                  <h3 className="mb-2 text-sm font-semibold text-white">{section.title}</h3>
                  {section.rows.length === 0 ? (
                    <div className="text-xs text-ink-500">Ma'lumot yo'q</div>
                  ) : (
                    <div className="space-y-1.5">
                      {section.rows.map((r) => (
                        <div key={r.employee_id} className="flex items-center justify-between text-sm">
                          <span className="text-ink-200">{r.full_name || "Nomsiz"}</span>
                          <span className="font-medium text-white">
                            {(r as any)[section.key]}
                            {section.key === "qc_count" && r.qc_fail_count ? <span className="ml-1 text-xs text-red-400">({r.qc_fail_count} fail)</span> : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <OrdersInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
