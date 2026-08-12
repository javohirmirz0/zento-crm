"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import {
  Profile,
  Task,
  TaskChecklistItem,
  TaskComment,
  TaskActivity,
  TASK_PRIORITY_LABELS_UZ,
  TASK_PRIORITY_COLORS,
} from "@/lib/types";
import { IconCheck, IconPlus } from "@/components/icons";

function TaskDetailBody({ profile, taskId }: { profile: Profile; taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<(Task & { status?: any }) | null>(null);
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activity, setActivity] = useState<TaskActivity[]>([]);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: t }, { data: cl }, { data: cm }, { data: act }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, owner:profiles!tasks_owner_id_fkey(full_name), status:task_statuses(name,is_terminal,requires_verification)")
        .eq("id", taskId)
        .single(),
      supabase.from("task_checklist_items").select("*").eq("task_id", taskId).order("position", { ascending: true }),
      supabase
        .from("task_comments")
        .select("*, author:profiles!task_comments_author_id_fkey(full_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true }),
      supabase.from("task_activity").select("*").eq("task_id", taskId).order("created_at", { ascending: false }).limit(20),
    ]);
    setTask((t as any) || null);
    setChecklist((cl as TaskChecklistItem[]) || []);
    setComments((cm as unknown as TaskComment[]) || []);
    setActivity((act as TaskActivity[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [taskId]);

  async function toggleItem(itemId: string, isDone: boolean) {
    await supabase.rpc("toggle_task_checklist_item", { p_item_id: itemId, p_is_done: isDone });
    load();
  }

  async function addChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklistLabel.trim()) return;
    setBusy(true);
    await supabase.rpc("add_task_checklist_item", { p_task_id: taskId, p_label: newChecklistLabel });
    setNewChecklistLabel("");
    setBusy(false);
    load();
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setBusy(true);
    await supabase.rpc("add_task_comment", { p_task_id: taskId, p_body: newComment });
    setNewComment("");
    setBusy(false);
    load();
  }

  async function completeTask() {
    setBusy(true);
    await supabase.rpc("complete_task", { p_task_id: taskId });
    setBusy(false);
    load();
  }

  async function verifyTask() {
    setBusy(true);
    await supabase.rpc("verify_task", { p_task_id: taskId });
    setBusy(false);
    load();
  }

  if (loading) return <p className="text-sm text-ink-400">Yuklanmoqda...</p>;
  if (!task) return <p className="text-sm text-ink-400">Vazifa topilmadi.</p>;

  const isOwner = task.owner_id === profile.id;
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const isVerifier = isAdmin && task.owner_id !== profile.id;
  const doneCount = checklist.filter((c) => c.is_done).length;

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="text-sm text-ink-400 hover:text-white">
        ← Orqaga
      </button>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">{task.title}</h1>
            {task.description && <p className="mt-1 text-sm text-ink-300">{task.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {!task.status?.is_terminal && !task.status?.requires_verification && (isOwner || isAdmin) && (
              <button onClick={completeTask} disabled={busy} className="btn-secondary">
                Bajardim
              </button>
            )}
            {task.status?.requires_verification && isVerifier && (
              <button onClick={verifyTask} disabled={busy} className="btn-primary">
                ✓ Tasdiqlash (Verify)
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`pill ${TASK_PRIORITY_COLORS[task.priority]}`}>{TASK_PRIORITY_LABELS_UZ[task.priority]}</span>
          <span className="pill bg-white/5 text-ink-300">{task.status?.name}</span>
          {task.category && <span className="pill bg-white/5 text-ink-300">{task.category}</span>}
          {task.owner?.full_name && <span className="pill bg-white/5 text-ink-300">👤 {task.owner.full_name}</span>}
          {task.deadline_at && (
            <span className="pill bg-white/5 text-ink-300">⏰ {new Date(task.deadline_at).toLocaleString("uz-UZ")}</span>
          )}
        </div>
        {task.expected_result && (
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
            <span className="text-ink-400">Kutilayotgan natija: </span>
            <span className="text-ink-100">{task.expected_result}</span>
          </div>
        )}
        {task.verified_at && (
          <div className="mt-3 text-xs text-emerald-400">✓ VERIFIED — {new Date(task.verified_at).toLocaleString("uz-UZ")}</div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">
          Checklist {checklist.length > 0 && `(${doneCount}/${checklist.length})`}
        </h2>
        <div className="space-y-1.5">
          {checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
              <button
                type="button"
                onClick={() => toggleItem(item.id, !item.is_done)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  item.is_done ? "border-brand-500 bg-brand-gradient text-white" : "border-white/20 text-transparent"
                }`}
              >
                <IconCheck width={12} height={12} />
              </button>
              <span className={`text-sm ${item.is_done ? "text-ink-500 line-through" : "text-ink-100"}`}>{item.label}</span>
            </label>
          ))}
        </div>
        <form onSubmit={addChecklistItem} className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="Yangi checklist band..."
            value={newChecklistLabel}
            onChange={(e) => setNewChecklistLabel(e.target.value)}
          />
          <button type="submit" disabled={busy} className="btn-secondary shrink-0">
            <IconPlus width={14} height={14} />
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Izohlar</h2>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>{(c as any).author?.full_name || "Foydalanuvchi"}</span>
                <span>{new Date(c.created_at).toLocaleString("uz-UZ")}</span>
              </div>
              <p className="mt-1 text-sm text-ink-100">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-ink-500">Hali izoh yo'q.</p>}
        </div>
        <form onSubmit={addComment} className="mt-3 flex gap-2">
          <input className="input" placeholder="Izoh qoldirish..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
          <button type="submit" disabled={busy} className="btn-secondary shrink-0">
            Yuborish
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Activity Log</h2>
        <div className="space-y-1.5">
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-xs text-ink-400">
              <span>{a.action}</span>
              <span>{new Date(a.created_at).toLocaleString("uz-UZ")}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="text-sm text-ink-500">Hali activity yo'q.</p>}
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <TaskDetailBody profile={profile} taskId={taskId} />
        </Shell>
      )}
    </AuthGate>
  );
}
