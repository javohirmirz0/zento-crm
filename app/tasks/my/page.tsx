"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Task, TASK_PRIORITY_LABELS_UZ, TASK_PRIORITY_COLORS } from "@/lib/types";

const INCOMPLETE_REASON_OPTIONS = [
  "Seller javob bermadi",
  "Mijoz band edi",
  "Ma'lumot yetishmadi",
  "Boshqa vazifa ustuvor bo'ldi",
  "Texnik/tizim muammosi",
];

function EodReportWidget({ profile }: { profile: Profile }) {
  const today = new Date().toISOString().slice(0, 10);
  const [plan, setPlan] = useState<any>(null);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasksCompleted, setTasksCompleted] = useState("0");
  const [reasons, setReasons] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    const [p, e] = await Promise.all([
      supabase.rpc("get_my_daily_plan", { p_date: today }),
      supabase.rpc("get_my_eod_report", { p_report_date: today }),
    ]);
    setPlan(p.data || null);
    if (e.data) {
      setExisting(e.data);
      setTasksCompleted(String(e.data.tasks_completed ?? 0));
      setReasons(e.data.incomplete_reasons || []);
      setSummary(e.data.summary || "");
      setTomorrow(e.data.tomorrow_followups || "");
    }
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

  const planned = plan?.tasks?.length || 0;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Kunlik reja va EOD hisobot</h2>
        <span className="text-xs text-ink-400">{new Date().toLocaleDateString("uz-UZ")}</span>
      </div>
      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="mb-3 text-xs text-ink-400">Bugunga rejalashtirilgan: {planned} ta vazifa (muddat bo'yicha)</div>
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
        </>
      )}
    </div>
  );
}

function MyTasksBody({ profile }: { profile: Profile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("*, status:task_statuses(name,is_terminal,requires_verification)")
      .eq("owner_id", profile.id)
      .order("deadline_at", { ascending: true, nullsFirst: false });
    setTasks((data as unknown as Task[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [profile.id]);

  async function complete(taskId: string) {
    const { error } = await supabase.rpc("complete_task", { p_task_id: taskId });
    if (!error) load();
  }

  const open = tasks.filter((t) => !t.status?.is_terminal);
  const done = open.length ? Math.round(((tasks.length - open.length) / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Bugungi vazifalarim</h1>
        <p className="text-sm text-ink-400">
          Progress: {done}% ({tasks.length - open.length}/{tasks.length})
        </p>
        <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-brand-gradient" style={{ width: `${done}%` }} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-ink-400">Sizga biriktirilgan vazifa yo'q.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const overdue = t.deadline_at && !t.status?.is_terminal && new Date(t.deadline_at) < new Date();
            return (
              <div key={t.id} className="card flex items-center justify-between gap-3 p-4">
                <Link href={`/tasks/${t.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`pill ${TASK_PRIORITY_COLORS[t.priority]}`}>{TASK_PRIORITY_LABELS_UZ[t.priority]}</span>
                    <span className="truncate text-sm font-medium text-ink-50">{t.title}</span>
                  </div>
                  <div className={`mt-1 text-xs ${overdue ? "text-red-400" : "text-ink-400"}`}>
                    {t.status?.name}
                    {t.deadline_at && ` · ${new Date(t.deadline_at).toLocaleString("uz-UZ")}`}
                    {overdue && " · OVERDUE"}
                  </div>
                </Link>
                {!t.status?.is_terminal && !t.status?.requires_verification && (
                  <button onClick={() => complete(t.id)} className="btn-secondary shrink-0">
                    Bajardim
                  </button>
                )}
                {t.status?.requires_verification && (
                  <span className="pill bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
                    Tekshiruv kutilmoqda
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EodReportWidget profile={profile} />
    </div>
  );
}

export default function MyTasksPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <MyTasksBody profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
