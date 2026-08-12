"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

const COMPONENT_LABELS_UZ: Record<string, string> = {
  tasks: "Vazifalar",
  performance: "Faollik",
  results: "Natijalar",
  reports: "Hisobotlar",
};

interface KpiComponent {
  component: string;
  weight_pct: number;
  score: number | null;
  has_data: boolean;
}

interface KpiBreakdown {
  period: string;
  role: string;
  overall_pct: number | null;
  components: KpiComponent[];
  note: string | null;
}

function periodLabel(period: string) {
  const [y, m] = period.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });
}

function KpiInner({ profile }: { profile: Profile }) {
  const [data, setData] = useState<KpiBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: res, error } = await supabase.rpc("my_kpi_breakdown");
      if (error) {
        setError(error.message);
      } else {
        setData(res as KpiBreakdown);
      }
      setLoading(false);
    })();
  }, [profile.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Mening KPI'im</h1>
        <p className="text-sm text-ink-400">Umumiy foiz qanday hisoblanganini shu yerda to'liq ko'rasiz — yashirin komponent yo'q.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : error ? (
        <p className="text-sm text-red-400">Xatolik: {error}</p>
      ) : !data ? (
        <p className="text-sm text-ink-400">Ma'lumot topilmadi.</p>
      ) : (
        <>
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="label">Umumiy natija — {periodLabel(data.period)}</div>
                <div className="mt-1 text-3xl font-semibold text-white">
                  {data.overall_pct === null ? "—" : `${data.overall_pct}%`}
                </div>
              </div>
            </div>
            {data.note && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-300">{data.note}</p>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-white/[0.06] p-4">
              <h2 className="text-sm font-semibold text-white">Komponentlar bo'yicha</h2>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {data.components.map((c) => (
                <div key={c.component} className="p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-100">
                      {COMPONENT_LABELS_UZ[c.component] || c.component}
                      <span className="ml-1.5 text-xs text-ink-500">({c.weight_pct}% og'irlik)</span>
                    </span>
                    <span className={c.has_data ? "text-white" : "text-ink-500"}>
                      {c.has_data ? `${c.score}%` : "ma'lumot yo'q"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full ${c.has_data ? "bg-brand-gradient" : "bg-white/10"}`}
                      style={{ width: `${c.has_data ? c.score : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-500">
            Maosh/bonus hisob-kitobi keyingi bosqichda (Qadam 1.6) shu KPI natijasiga ulanadi.
          </p>
        </>
      )}
    </div>
  );
}

export default function WorkKpiPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <KpiInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
