"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconRefresh, IconChevronRight } from "@/components/icons";
import { Profile, EmployeeListRow, TEAM_ROLE_LABELS_UZ, TeamRole } from "@/lib/types";

function EmployeesInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [rows, setRows] = useState<EmployeeListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [computedMsg, setComputedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_employees");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows((data as EmployeeListRow[]) || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function recompute() {
    setComputing(true);
    setComputedMsg(null);
    const { data, error } = await supabase.rpc("compute_kpi_actuals", { p_period: null });
    setComputing(false);
    if (error) {
      setError(error.message);
      return;
    }
    setComputedMsg(`${data?.period || ""} uchun KPI qayta hisoblandi`);
  }

  if (!isAdmin) {
    return (
      <div className="card p-6 text-sm text-ink-400">
        Bu sahifa faqat admin/founder uchun.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Xodimlar & KPI</h1>
          <p className="text-sm text-ink-400">Ichki jamoa a'zolari, rollari va KPI holati</p>
        </div>
        <div className="flex items-center gap-2">
          {computedMsg && <span className="text-xs text-emerald-400">{computedMsg}</span>}
          <button className="btn-secondary" disabled={computing} onClick={recompute}>
            <IconRefresh width={14} height={14} />
            {computing ? "Hisoblanmoqda..." : "KPI'ni qayta hisoblash (shu oy)"}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">Ichki xodim topilmadi.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs text-ink-400">
              <tr>
                <th className="px-4 py-2.5">Ism</th>
                <th className="px-4 py-2.5">Rol</th>
                <th className="px-4 py-2.5">Lavozim</th>
                <th className="px-4 py-2.5">Bo'lim</th>
                <th className="px-4 py-2.5">Menejer</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/[0.06] hover:bg-white/[0.05]">
                  <td className="px-4 py-2.5">
                    <Link href={`/employees/${r.id}`} className="font-medium text-white hover:text-brand-300">
                      {r.full_name || "Nomsiz"}
                    </Link>
                    {!r.has_profile && (
                      <span className="ml-2 pill border border-amber-500/20 bg-amber-500/10 text-amber-400">Profil to'ldirilmagan</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-300">{TEAM_ROLE_LABELS_UZ[r.role as TeamRole] || r.role}</td>
                  <td className="px-4 py-2.5 text-ink-300">{r.role_title || "-"}</td>
                  <td className="px-4 py-2.5 text-ink-300">{r.department || "-"}</td>
                  <td className="px-4 py-2.5 text-ink-300">{r.manager_name || "-"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/employees/${r.id}`}>
                      <IconChevronRight width={16} height={16} className="inline text-ink-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <EmployeesInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
