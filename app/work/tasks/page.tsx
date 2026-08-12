"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Task, TASK_PRIORITY_LABELS_UZ, TASK_PRIORITY_COLORS } from "@/lib/types";

function WorkTasksInner({ profile }: { profile: Profile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "all">("open");

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

  const visible = filter === "open" ? tasks.filter((t) => !t.status?.is_terminal) : tasks;
  const openCount = tasks.filter((t) => !t.status?.is_terminal).length;
  const doneCount = tasks.length - openCount;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Vazifalarim</h1>
        <p className="text-sm text-ink-400">
          Progress: {progress}% ({doneCount}/{tasks.length})
        </p>
        <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/5">
          <div className="h-full bg-brand-gradient" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter("open")}
          className={`pill border ${filter === "open" ? "border-brand-500/40 bg-brand-500/15 text-brand-300" : "border-white/10 bg-white/[0.03] text-ink-400"}`}
        >
          Faol
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`pill border ${filter === "all" ? "border-brand-500/40 bg-brand-500/15 text-brand-300" : "border-white/10 bg-white/[0.03] text-ink-400"}`}
        >
          Barchasi
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink-400">Vazifa yo'q.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
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
                  <span className="pill bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">Tekshiruv kutilmoqda</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WorkTasksPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <WorkTasksInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
