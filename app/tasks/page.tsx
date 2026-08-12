"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import {
  Profile,
  Task,
  TaskBoard,
  TaskStatus,
  TaskPriority,
  TASK_PRIORITY_LABELS_UZ,
  TASK_PRIORITY_COLORS,
} from "@/lib/types";
import { IconPlus, IconClose } from "@/components/icons";

function NewTaskModal({
  boardId,
  onClose,
  onCreated,
}: {
  boardId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [expectedResult, setExpectedResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase.rpc("create_task", {
      p_board_id: boardId,
      p_title: title,
      p_description: description || null,
      p_priority: priority,
      p_category: category || null,
      p_deadline_at: deadline ? new Date(deadline).toISOString() : null,
      p_expected_result: expectedResult || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Yangi vazifa</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <IconClose width={18} height={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Sarlavha</label>
            <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Tavsif</label>
            <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {(["critical", "high", "normal", "low"] as TaskPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS_UZ[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Kategoriya</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Seller Acquisition" />
            </div>
          </div>
          <div>
            <label className="label">Deadline</label>
            <input className="input" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="label">Kutilayotgan natija</label>
            <input className="input" value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} />
          </div>
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Saqlanmoqda..." : "Yaratish"}
          </button>
        </form>
      </div>
    </div>
  );
}

function BoardBody({ profile }: { profile: Profile }) {
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    const { data: boards } = await supabase.from("task_boards").select("*").order("created_at", { ascending: true }).limit(1);
    const b = (boards?.[0] as TaskBoard) || null;
    setBoard(b);
    if (!b) {
      setLoading(false);
      return;
    }
    const [{ data: statusRows }, { data: taskRows }] = await Promise.all([
      supabase.from("task_statuses").select("*").eq("board_id", b.id).order("position", { ascending: true }),
      supabase
        .from("tasks")
        .select("*, owner:profiles!tasks_owner_id_fkey(full_name), status:task_statuses(name,is_terminal,requires_verification)")
        .eq("board_id", b.id)
        .order("created_at", { ascending: false }),
    ]);
    setStatuses((statusRows as TaskStatus[]) || []);
    setTasks((taskRows as unknown as Task[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function moveTask(taskId: string, statusId: string) {
    const { error } = await supabase.rpc("update_task_status", { p_task_id: taskId, p_status_id: statusId });
    if (!error) load();
  }

  if (loading) {
    return <p className="text-sm text-ink-400">Yuklanmoqda...</p>;
  }
  if (!board) {
    return <p className="text-sm text-ink-400">Board topilmadi.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Vazifalar — {board.name}</h1>
          <p className="text-sm text-ink-400">{tasks.length} ta vazifa</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <IconPlus width={16} height={16} />
          Yangi vazifa
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.status_id === status.id);
          return (
            <div key={status.id} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-300">{status.name}</h3>
                <span className="text-xs text-ink-500">{columnTasks.length}</span>
              </div>
              <div className="space-y-2">
                {columnTasks.map((task) => (
                  <div key={task.id} className="card p-3">
                    <Link href={`/tasks/${task.id}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-ink-50">{task.title}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`pill ${TASK_PRIORITY_COLORS[task.priority]}`}>
                          {TASK_PRIORITY_LABELS_UZ[task.priority]}
                        </span>
                        {task.category && <span className="pill bg-white/5 text-ink-300">{task.category}</span>}
                      </div>
                      {task.deadline_at && (
                        <div className="mt-2 text-[11px] text-ink-400">
                          {new Date(task.deadline_at).toLocaleString("uz-UZ")}
                        </div>
                      )}
                      {task.owner?.full_name && (
                        <div className="mt-1 text-[11px] text-ink-500">{task.owner.full_name}</div>
                      )}
                    </Link>
                    <select
                      className="input mt-2 !py-1 !text-xs"
                      value={task.status_id}
                      onChange={(e) => moveTask(task.id, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/[0.08] px-3 py-6 text-center text-xs text-ink-500">
                    Bo'sh
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showNew && board && (
        <NewTaskModal boardId={board.id} onClose={() => setShowNew(false)} onCreated={load} />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <BoardBody profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
