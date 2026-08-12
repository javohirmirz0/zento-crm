"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

interface MySalary {
  has_structure: boolean;
  period?: string;
  is_official?: boolean;
  base_salary?: number;
  currency?: string;
  kpi_overall_pct?: number | null;
  kpi_bonus?: number;
  other_bonus?: number;
  deduction?: number;
  total?: number;
  note?: string | null;
}

function periodLabel(period?: string) {
  if (!period) return "";
  const [y, m] = period.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });
}

function fmt(n: number | undefined, currency = "UZS") {
  if (n === undefined || n === null) return "—";
  return `${new Intl.NumberFormat("uz-UZ").format(n)} ${currency}`;
}

function SalaryInner({ profile }: { profile: Profile }) {
  const [data, setData] = useState<MySalary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: res, error } = await supabase.rpc("my_salary");
      if (error) setError(error.message);
      else setData(res as MySalary);
      setLoading(false);
    })();
  }, [profile.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Maoshim</h1>
        <p className="text-sm text-ink-400">Asosiy maosh + KPI bonusi — qanday hisoblanganini to'liq ko'rasiz.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : error ? (
        <p className="text-sm text-red-400">Xatolik: {error}</p>
      ) : !data?.has_structure ? (
        <div className="card p-5">
          <p className="text-sm text-ink-400">{data?.note || "Sizga hali maosh strukturasi belgilanmagan."}</p>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="label">Jami — {periodLabel(data.period)}</div>
                <div className="mt-1 text-3xl font-semibold text-white">{fmt(data.total, data.currency)}</div>
              </div>
              <span
                className={`pill border ${
                  data.is_official
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}
              >
                {data.is_official ? "Rasmiy" : "Taxminiy"}
              </span>
            </div>
            {data.note && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-300">{data.note}</p>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-white/[0.06] p-4">
              <h2 className="text-sm font-semibold text-white">Hisob-kitob tafsiloti</h2>
            </div>
            <div className="divide-y divide-white/[0.06] text-sm">
              <div className="flex items-center justify-between p-4">
                <span className="text-ink-400">Asosiy maosh</span>
                <span className="text-white">{fmt(data.base_salary, data.currency)}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-ink-400">
                  KPI bonusi{data.kpi_overall_pct !== null && data.kpi_overall_pct !== undefined ? ` (KPI: ${data.kpi_overall_pct}%)` : ""}
                </span>
                <span className="text-white">{fmt(data.kpi_bonus, data.currency)}</span>
              </div>
              {!!data.other_bonus && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-ink-400">Qo'shimcha bonus</span>
                  <span className="text-white">{fmt(data.other_bonus, data.currency)}</span>
                </div>
              )}
              {!!data.deduction && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-ink-400">Ushlab qolingan</span>
                  <span className="text-red-400">-{fmt(data.deduction, data.currency)}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-500">
            KPI bonusi <a href="/work/kpi" className="text-brand-300 hover:text-brand-200">Mening KPI'im</a> sahifasidagi umumiy foizdan hisoblanadi.
          </p>
        </>
      )}
    </div>
  );
}

export default function WorkSalaryPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <SalaryInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
