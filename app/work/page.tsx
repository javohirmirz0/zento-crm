"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { StatCard } from "@/components/StatCard";
import { IconCheck, IconFollowup, IconAlert, IconChevronRight } from "@/components/icons";
import { supabase } from "@/lib/supabaseClient";
import { Profile, Task, TASK_PRIORITY_LABELS_UZ, TASK_PRIORITY_COLORS } from "@/lib/types";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Xayrli tong";
  if (h < 17) return "Xayrli kun";
  return "Xayrli kech";
}

function MyWorkInner({ profile }: { profile: Profile }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [eodSubmitted, setEodSubmitted] = useState<boolean | null>(null);

  async function load() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: taskData }, { data: eod }] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, status:task_statuses(name,is_terminal,requires_verification)")
        .eq("owner_id", profile.id)
        .order("deadline_at", { ascending: true, nullsFirst: false }),
      supabase.rpc("get_my_eod_report", { p_report_date: today }),
    ]);
    setTasks((taskData as unknown as Task[]) || []);
    setEodSubmitted(!!eod);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [profile.id]);

  const done = tasks.filter((t) => t.status?.name === "DONE" || t.status?.name === "VERIFIED");
  const inProgress = tasks.filter((t) => t.status?.name === "IN_PROGRESS");
  const pending = tasks.filter((t) => !t.status?.is_terminal && t.status?.name !== "IN_PROGRESS" && t.status?.name !== "DONE");
  const overdue = tasks.filter((t) => t.deadline_at && !t.status?.is_terminal && new Date(t.deadline_at) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">
          {greeting()}, {profile.full_name?.split(" ")[0] || "!"}
        </h1>
        <p className="text-sm text-ink-400">{new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Jami" value={tasks.length} icon={<IconCheck width={15} height={15} />} />
            <StatCard label="Bajarilgan" value={done.length} tone="good" icon={<IconCheck width={15} height={15} />} />
            <StatCard label="Jarayonda" value={inProgress.length} tone="brand" icon={<IconFollowup width={15} height={15} />} />
            <StatCard
              label="Muddati o'tgan"
              value={overdue.length}
              tone={overdue.length > 0 ? "critical" : "default"}
              icon={<IconAlert width={15} height={15} />}
            />
          </div>

          <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Bugungi vazifalar</h2>
              <Link href="/work/tasks" className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200">
                Barchasi <IconChevronRight width={12} height={12} />
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-ink-400">Sizga biriktirilgan vazifa yo'q.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.slice(0, 5).map((t) => {
                  const isOverdue = t.deadline_at && !t.status?.is_terminal && new Date(t.deadline_at) < new Date();
                  return (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-white/[0.03]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`pill ${TASK_PRIORITY_COLORS[t.priority]}`}>{TASK_PRIORITY_LABELS_UZ[t.priority]}</span>
                        <span className="truncate text-ink-100">{t.title}</span>
                      </div>
                      <span className={`shrink-0 text-xs ${isOverdue ? "text-red-400" : "text-ink-500"}`}>
                        {t.status?.name}
                        {isOverdue && " · OVERDUE"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card flex items-center justify-between p-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Kun yakuni hisoboti</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {eodSubmitted ? "Bugungi hisobot topshirilgan." : "Bugun uchun hali topshirilmagan."}
              </p>
            </div>
            <Link href="/work/reports" className={eodSubmitted ? "btn-secondary" : "btn-primary"}>
              {eodSubmitted ? "Ko'rish / yangilash" : "Hisobot berish"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function MyWorkPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <MyWorkInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
