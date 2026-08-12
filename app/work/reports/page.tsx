"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

const INCOMPLETE_REASON_OPTIONS = [
  "Seller javob bermadi",
  "Mijoz band edi",
  "Ma'lumot yetishmadi",
  "Boshqa vazifa ustuvor bo'ldi",
  "Texnik/tizim muammosi",
];

interface EodReportRow {
  id: string;
  report_date: string;
  tasks_completed: number | null;
  incomplete_reasons: string[] | null;
  summary: string | null;
  tomorrow_followups: string | null;
  submitted_at: string;
}

function ReportsInner({ profile }: { profile: Profile }) {
  const today = new Date().toISOString().slice(0, 10);
  const [existing, setExisting] = useState<EodReportRow | null>(null);
  const [history, setHistory] = useState<EodReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState("0");
  const [reasons, setReasons] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: e }, { data: hist }] = await Promise.all([
      supabase.rpc("get_my_eod_report", { p_report_date: today }),
      supabase
        .from("eod_reports")
        .select("id, report_date, tasks_completed, incomplete_reasons, summary, tomorrow_followups, submitted_at")
        .eq("employee_id", profile.id)
        .order("report_date", { ascending: false })
        .limit(14),
    ]);
    if (e) {
      setExisting(e as EodReportRow);
      setTasksCompleted(String((e as EodReportRow).tasks_completed ?? 0));
      setReasons((e as EodReportRow).incomplete_reasons || []);
      setSummary((e as EodReportRow).summary || "");
      setTomorrow((e as EodReportRow).tomorrow_followups || "");
    }
    setHistory((hist as EodReportRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [profile.id]);

  function toggleReason(r: string) {
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.rpc("submit_eod_report", {
      p_report_date: today,
      p_tasks_completed: Number(tasksCompleted) || 0,
      p_incomplete_reasons: reasons,
      p_summary: summary || null,
      p_tomorrow_followups: tomorrow || null,
    });
    setSaving(false);
    if (!error) {
      setSaved(true);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Hisobotlarim</h1>
        <p className="text-sm text-ink-400">Kunlik yakuniy (EOD) hisobot — faqat o'zingizniki ko'rinadi.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : (
        <>
          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Bugungi hisobot</h2>
              <span className="text-xs text-ink-400">{new Date().toLocaleDateString("uz-UZ")}</span>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="label">Bajarilgan vazifalar soni</label>
                <input className="input w-32" type="number" min={0} value={tasksCompleted} onChange={(e) => setTasksCompleted(e.target.value)} />
              </div>
              <div>
                <label className="label">Bajarilmagan bo'lsa, sabab (bir nechtasini tanlash mumkin)</label>
                <div className="flex flex-wrap gap-2">
                  {INCOMPLETE_REASON_OPTIONS.map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => toggleReason(r)}
                      className={`pill border ${reasons.includes(r) ? "border-brand-500/40 bg-brand-500/15 text-brand-300" : "border-white/10 bg-white/[0.03] text-ink-400"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Kun xulosasi</label>
                <textarea className="input min-h-[70px]" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Masalan: 7 seller bilan aloqa qilindi, 2 tasi qiziqdi" />
              </div>
              <div>
                <label className="label">Ertangi follow-uplar</label>
                <textarea className="input min-h-[50px]" value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Saqlanmoqda..." : existing ? "Yangilash" : "EOD hisobotni topshirish"}
                </button>
                {saved && <span className="text-xs text-emerald-400">Saqlandi</span>}
              </div>
            </form>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-white/[0.06] p-4">
              <h2 className="text-sm font-semibold text-white">Oxirgi hisobotlar</h2>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-sm text-ink-400">Hisobot tarixi yo'q.</div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {history.map((r) => (
                  <div key={r.id} className="p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{new Date(r.report_date).toLocaleDateString("uz-UZ")}</span>
                      <span className="text-xs text-ink-400">{r.tasks_completed ?? 0} ta vazifa bajarildi</span>
                    </div>
                    {r.summary && <p className="mt-1 text-ink-400">{r.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkReportsPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <ReportsInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
