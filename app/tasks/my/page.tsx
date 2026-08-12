"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Task, TASK_PRIORITY_LABELS_UZ, TASK_PRIORITY_COLORS } from "@/lib/types";

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
