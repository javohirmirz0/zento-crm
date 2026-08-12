"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatCard } from "@/components/StatCard";
import { IconAlert, IconCheck } from "@/components/icons";
import {
  Profile,
  EmployeeDetail,
  EmployeeListRow,
  TEAM_ROLE_LABELS_UZ,
  TeamRole,
  kpiUnitFormat,
} from "@/lib/types";

const LEVEL_LABELS_UZ: Record<number, string> = {
  1: "Level 1 — Faoliyat",
  2: "Level 2 — Natija",
  3: "Level 3 — Biznes natija",
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function EmployeeDetailInner({ profile, employeeId }: { profile: Profile; employeeId: string }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const isSelf = profile.id === employeeId;
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [managers, setManagers] = useState<EmployeeListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [roleTitle, setRoleTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [hiredAt, setHiredAt] = useState("");
  const [managerId, setManagerId] = useState("");

  const [targetKpiKey, setTargetKpiKey] = useState("new_leads");
  const [targetPeriod, setTargetPeriod] = useState(currentPeriod());
  const [targetValue, setTargetValue] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const calls: PromiseLike<any>[] = [supabase.rpc("get_employee_detail", { p_employee_id: employeeId })];
    if (isAdmin) calls.push(supabase.rpc("list_employees"));
    const results = await Promise.all(calls);
    const [d, mgrs] = results;
    if (d.error) {
      setError(d.error.message);
      setLoading(false);
      return;
    }
    const detailData = d.data as EmployeeDetail;
    setDetail(detailData);
    setRoleTitle(detailData.employee_profile?.role_title || "");
    setDepartment(detailData.employee_profile?.department || "");
    setHiredAt(detailData.employee_profile?.hired_at || "");
    setManagerId(detailData.employee_profile?.manager_id || "");
    if (isAdmin && mgrs) setManagers((mgrs.data as EmployeeListRow[]) || []);
    setError(null);
    setLoading(false);
  }, [employeeId, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.rpc("upsert_employee_profile", {
      p_employee_id: employeeId,
      p_role_title: roleTitle || null,
      p_department: department || null,
      p_hired_at: hiredAt || null,
      p_manager_id: managerId || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  async function saveTarget(e: React.FormEvent) {
    e.preventDefault();
    if (!targetValue) return;
    setSavingTarget(true);
    const { error } = await supabase.rpc("set_kpi_target", {
      p_employee_id: employeeId,
      p_kpi_key: targetKpiKey,
      p_period: targetPeriod,
      p_target_value: Number(targetValue),
    });
    setSavingTarget(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTargetValue("");
    load();
  }

  if (!isAdmin && !isSelf) {
    return <div className="card p-6 text-sm text-ink-400">Bu profilni ko'rish huquqingiz yo'q.</div>;
  }

  if (loading) return <div className="text-sm text-ink-400">Yuklanmoqda...</div>;
  if (error || !detail) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error || "Xatolik"}</div>;

  const currentPeriodActuals = detail.kpi_actuals.filter((a) => a.period === currentPeriod());
  const targetByKey: Record<string, number> = {};
  detail.kpi_targets.filter((t) => t.period === currentPeriod()).forEach((t) => (targetByKey[t.kpi_key] = t.target_value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">{detail.profile.full_name || "Nomsiz"}</h1>
        <p className="text-sm text-ink-400">
          {TEAM_ROLE_LABELS_UZ[detail.profile.role as TeamRole] || detail.profile.role}
          {detail.employee_profile?.role_title && ` · ${detail.employee_profile.role_title}`}
          {detail.employee_profile?.department && ` · ${detail.employee_profile.department}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Ochiq vazifalar" value={detail.task_stats.open} />
        <StatCard label="Muddati o'tgan" value={detail.task_stats.overdue} tone={detail.task_stats.overdue > 0 ? "critical" : "default"} icon={<IconAlert width={15} height={15} />} />
        <StatCard label="Tasdiqlangan (jami)" value={detail.task_stats.verified_total} tone="good" icon={<IconCheck width={15} height={15} />} />
      </div>

      {isAdmin && (
        <form onSubmit={saveProfile} className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold text-white">Profil ma'lumotlari</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Lavozim</label>
              <input className="input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Masalan: Seller Acquisition Manager" />
            </div>
            <div>
              <label className="label">Bo'lim</label>
              <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Masalan: Sales" />
            </div>
            <div>
              <label className="label">Ishga olingan sana</label>
              <input className="input" type="date" value={hiredAt || ""} onChange={(e) => setHiredAt(e.target.value)} />
            </div>
            <div>
              <label className="label">Menejer</label>
              <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
                <option value="">Yo'q</option>
                {managers.filter((m) => m.id !== employeeId).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">KPI — joriy oy ({currentPeriod()})</h2>
        {currentPeriodActuals.length === 0 ? (
          <div className="text-sm text-ink-500">
            Bu oy uchun hali hisoblanmagan.{isAdmin && " \"Xodimlar\" sahifasidagi \"KPI'ni qayta hisoblash\" tugmasini bosing."}
          </div>
        ) : (
          [1, 2, 3].map((level) => {
            const rows = currentPeriodActuals.filter((a) => a.level === level);
            if (rows.length === 0) return null;
            return (
              <div key={level} className="mb-4 last:mb-0">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">{LEVEL_LABELS_UZ[level]}</div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {rows.map((r) => {
                    const target = targetByKey[r.kpi_key];
                    return (
                      <div key={r.kpi_key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="text-xs text-ink-400">{r.label}</div>
                        <div className="mt-1 text-lg font-semibold text-white">{kpiUnitFormat(r.actual_value, r.unit)}</div>
                        {target != null && <div className="mt-0.5 text-xs text-ink-500">Maqsad: {kpiUnitFormat(target, r.unit)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isAdmin && (
        <form onSubmit={saveTarget} className="card flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label">KPI</label>
            <select className="input w-auto" value={targetKpiKey} onChange={(e) => setTargetKpiKey(e.target.value)}>
              <option value="calls_made">Qo'ng'iroqlar</option>
              <option value="tasks_completed">Bajarilgan vazifalar</option>
              <option value="task_completion_pct">Vazifa bajarish %</option>
              <option value="new_leads">Yangi leadlar</option>
              <option value="registered_sellers">Ro'yxatdan o'tgan sellerlar</option>
              <option value="active_sellers">Aktiv sellerlar</option>
              <option value="revenue_attributed">Jalb qilingan revenue</option>
            </select>
          </div>
          <div>
            <label className="label">Davr (YYYY-MM)</label>
            <input className="input w-32" value={targetPeriod} onChange={(e) => setTargetPeriod(e.target.value)} />
          </div>
          <div>
            <label className="label">Maqsad qiymati</label>
            <input className="input w-32" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
          </div>
          <button type="submit" disabled={savingTarget} className="btn-secondary">
            {savingTarget ? "Saqlanmoqda..." : "Maqsad qo'yish"}
          </button>
        </form>
      )}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">So'nggi EOD hisobotlar</h2>
        {detail.recent_eod_reports.length === 0 ? (
          <div className="text-sm text-ink-500">Hali EOD hisobot topshirilmagan.</div>
        ) : (
          <div className="space-y-2">
            {detail.recent_eod_reports.map((r) => (
              <div key={r.report_date} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{new Date(r.report_date).toLocaleDateString("uz-UZ")}</span>
                  <span className="text-ink-400">
                    {r.tasks_completed}/{r.tasks_planned} vazifa
                  </span>
                </div>
                {r.summary && <div className="mt-1 text-ink-300">{r.summary}</div>}
                {r.tomorrow_followups && <div className="mt-1 text-xs text-ink-500">Ertaga: {r.tomorrow_followups}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params?.id as string;
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <EmployeeDetailInner profile={profile} employeeId={employeeId} />
        </Shell>
      )}
    </AuthGate>
  );
}
