"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconPlus, IconTrash, IconRefresh, IconClose } from "@/components/icons";
import {
  Profile,
  AutomationRule,
  AutomationRun,
  AutomationCondition,
  AUTOMATION_TRIGGER_TABLES,
  AUTOMATION_TRIGGER_EVENTS,
  AUTOMATION_CONDITION_OPS,
  AUTOMATION_CONDITION_OP_LABELS_UZ,
  AutomationActionType,
} from "@/lib/types";

function NewRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [triggerTable, setTriggerTable] = useState<string>("seller_leads");
  const [triggerEvent, setTriggerEvent] = useState<string>("UPDATE");
  const [conditions, setConditions] = useState<AutomationCondition[]>([{ field: "status", op: "changed_to", value: "" }]);
  const [actionType, setActionType] = useState<AutomationActionType>("create_task");
  // send_notification fields
  const [notifyTarget, setNotifyTarget] = useState("owner");
  const [notifyCategory, setNotifyCategory] = useState("");
  const [notifySeverity, setNotifySeverity] = useState("info");
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  // create_task fields
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [taskDeadlineHours, setTaskDeadlineHours] = useState("24");
  const [taskAssignTo, setTaskAssignTo] = useState("owner");
  const [taskExpectedResult, setTaskExpectedResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCondition(i: number, patch: Partial<AutomationCondition>) {
    setConditions((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCondition() {
    setConditions((prev) => [...prev, { field: "", op: "eq", value: "" }]);
  }
  function removeCondition(i: number) {
    setConditions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const cleanConditions = conditions.filter((c) => c.field.trim()).map((c) => ({
      field: c.field.trim(),
      op: c.op,
      ...(c.op !== "is_null" && c.op !== "is_not_null" ? { value: c.value } : {}),
    }));

    const { data: ruleId, error: ruleErr } = await supabase.rpc("create_automation_rule", {
      p_name: name.trim(),
      p_trigger_table: triggerTable,
      p_trigger_event: triggerEvent,
      p_trigger_condition: cleanConditions,
      p_is_active: true,
    });
    if (ruleErr) {
      setError(ruleErr.message);
      setSaving(false);
      return;
    }

    const actionConfig =
      actionType === "send_notification"
        ? { target: notifyTarget, category: notifyCategory || null, severity: notifySeverity, title: notifyTitle, body: notifyBody }
        : {
            title: taskTitle,
            category: taskCategory || null,
            priority: taskPriority,
            deadline_offset_hours: Number(taskDeadlineHours) || 24,
            assign_to: taskAssignTo,
            expected_result: taskExpectedResult || null,
          };

    const { error: actionErr } = await supabase.rpc("add_automation_action", {
      p_rule_id: ruleId,
      p_position: 1,
      p_action_type: actionType,
      p_action_config: actionConfig,
    });
    setSaving(false);
    if (actionErr) {
      setError(actionErr.message);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Yangi avtomatlashtirish qoidasi</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <IconClose width={18} height={18} />
          </button>
        </div>
        {error && <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Qoida nomi</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Yangi lead -> qo'ng'iroq vazifasi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Jadval (IF)</label>
              <select className="input" value={triggerTable} onChange={(e) => setTriggerTable(e.target.value)}>
                {AUTOMATION_TRIGGER_TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t === "tasks" ? "Vazifalar" : "Sotuvchi leadlar"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Hodisa</label>
              <select className="input" value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)}>
                {AUTOMATION_TRIGGER_EVENTS.map((e2) => (
                  <option key={e2} value={e2}>
                    {e2 === "INSERT" ? "Yaratilganda" : "O'zgartirilganda"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Shartlar (barchasi bajarilishi kerak)</label>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    placeholder="maydon (masalan: status)"
                    value={c.field}
                    onChange={(e) => updateCondition(i, { field: e.target.value })}
                  />
                  <select className="input w-44" value={c.op} onChange={(e) => updateCondition(i, { op: e.target.value as any })}>
                    {AUTOMATION_CONDITION_OPS.map((op) => (
                      <option key={op} value={op}>
                        {AUTOMATION_CONDITION_OP_LABELS_UZ[op]}
                      </option>
                    ))}
                  </select>
                  {c.op !== "is_null" && c.op !== "is_not_null" && (
                    <input className="input w-32" placeholder="qiymat" value={c.value || ""} onChange={(e) => updateCondition(i, { value: e.target.value })} />
                  )}
                  <button type="button" onClick={() => removeCondition(i)} className="text-ink-500 hover:text-red-400">
                    <IconTrash width={14} height={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addCondition} className="btn-secondary text-xs">
                <IconPlus width={12} height={12} /> Shart qo'shish
              </button>
            </div>
          </div>

          <div>
            <label className="label">Amal (THEN)</label>
            <select className="input" value={actionType} onChange={(e) => setActionType(e.target.value as AutomationActionType)}>
              <option value="create_task">Vazifa yaratish</option>
              <option value="send_notification">Bildirishnoma yuborish</option>
            </select>
          </div>

          {actionType === "create_task" ? (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="col-span-2">
                <label className="label">Vazifa sarlavhasi</label>
                <input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Kategoriya</label>
                <input className="input" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} />
              </div>
              <div>
                <label className="label">Muhimlik</label>
                <select className="input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="label">Muddat (soat)</label>
                <input className="input" type="number" value={taskDeadlineHours} onChange={(e) => setTaskDeadlineHours(e.target.value)} />
              </div>
              <div>
                <label className="label">Kimga biriktiriladi</label>
                <select className="input" value={taskAssignTo} onChange={(e) => setTaskAssignTo(e.target.value)}>
                  <option value="owner">Egasi/menejer (qatordan)</option>
                  <option value="manager">Uning menejeri</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Kutilayotgan natija</label>
                <input className="input" value={taskExpectedResult} onChange={(e) => setTaskExpectedResult(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div>
                <label className="label">Kimga</label>
                <select className="input" value={notifyTarget} onChange={(e) => setNotifyTarget(e.target.value)}>
                  <option value="owner">Egasi/menejer</option>
                  <option value="manager">Uning menejeri</option>
                  <option value="founder">Barcha founder/admin</option>
                </select>
              </div>
              <div>
                <label className="label">Darajasi</label>
                <select className="input" value={notifySeverity} onChange={(e) => setNotifySeverity(e.target.value)}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="label">Kategoriya</label>
                <input className="input" value={notifyCategory} onChange={(e) => setNotifyCategory(e.target.value)} placeholder="masalan: task_deadline" />
              </div>
              <div>
                <label className="label">Sarlavha</label>
                <input className="input" value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Matn</label>
                <textarea className="input min-h-[60px]" value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Bekor qilish
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saqlanmoqda..." : "Qoidani yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RunLog({ ruleId, onClose }: { ruleId: string; onClose: () => void }) {
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc("list_automation_runs", { p_rule_id: ruleId, p_limit: 30 }).then(({ data }) => {
      setRuns((data as AutomationRun[]) || []);
      setLoading(false);
    });
  }, [ruleId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card max-h-[80vh] w-full max-w-lg overflow-y-auto p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Ishga tushirish jurnali</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <IconClose width={16} height={16} />
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-ink-400">Yuklanmoqda...</div>
        ) : runs.length === 0 ? (
          <div className="text-sm text-ink-500">Hali ishga tushmagan.</div>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <div key={r.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className={r.status === "success" ? "text-emerald-400" : "text-red-400"}>{r.status}</span>
                  <span className="text-ink-500">{new Date(r.triggered_at).toLocaleString("uz-UZ")}</span>
                </div>
                {r.error && <div className="mt-1 text-red-400">{r.error}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AutomationInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [logRuleId, setLogRuleId] = useState<string | null>(null);
  const [runningDeadline, setRunningDeadline] = useState(false);
  const [deadlineResult, setDeadlineResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_automation_rules");
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRules((data as AutomationRule[]) || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(rule: AutomationRule) {
    const { error } = await supabase.rpc("toggle_automation_rule", { p_rule_id: rule.id, p_is_active: !rule.is_active });
    if (!error) load();
  }

  async function remove(rule: AutomationRule) {
    const { error } = await supabase.rpc("delete_automation_rule", { p_rule_id: rule.id });
    if (!error) load();
  }

  async function runDeadlineCheck() {
    setRunningDeadline(true);
    setDeadlineResult(null);
    const { data, error } = await supabase.rpc("trigger_deadline_check");
    setRunningDeadline(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDeadlineResult(data);
    load();
  }

  if (!isAdmin) {
    return <div className="card p-6 text-sm text-ink-400">Bu sahifa faqat admin/founder uchun.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Avtomatlashtirish</h1>
          <p className="text-sm text-ink-400">
            IF/THEN qoidalar (vazifalar, sotuvchi leadlar) + Deadline Engine (muddat ogohlantirish/eskalatsiya, har 5 daqiqada avtomatik)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" disabled={runningDeadline} onClick={runDeadlineCheck}>
            <IconRefresh width={14} height={14} />
            {runningDeadline ? "Tekshirilmoqda..." : "Deadline Engine'ni hozir ishga tushirish"}
          </button>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <IconPlus width={14} height={14} /> Yangi qoida
          </button>
        </div>
      </div>

      {deadlineResult && (
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/[0.06] px-3 py-2 text-xs text-ink-300">
          Ogohlantirish: {deadlineResult.warned}, muddati o'tgan: {deadlineResult.overdue_notified}, kritik eskalatsiya: {deadlineResult.critical_escalated}
        </div>
      )}
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-sm text-ink-400">Yuklanmoqda...</div>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{r.name}</span>
                    <span className="pill border border-white/10 bg-white/[0.04] text-ink-400">
                      {r.trigger_table} · {r.trigger_event}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {r.trigger_condition.length === 0
                      ? "Shartsiz (har doim)"
                      : r.trigger_condition.map((c, i) => `${c.field} ${c.op} ${c.value ?? ""}`).join(" VA ")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.actions.map((a) => (
                      <span key={a.id} className="pill border border-brand-500/20 bg-brand-500/10 text-brand-300">
                        {a.action_type === "create_task" ? "Vazifa yaratish" : "Bildirishnoma"}: {a.action_config.title || a.action_config.target}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setLogRuleId(r.id)} className="text-xs text-ink-400 hover:text-white">
                    Jurnal ({r.run_count})
                  </button>
                  <button
                    onClick={() => toggle(r)}
                    className={`pill border cursor-pointer ${r.is_active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/[0.04] text-ink-400"}`}
                  >
                    {r.is_active ? "Faol" : "O'chirilgan"}
                  </button>
                  <button onClick={() => remove(r)} className="text-ink-500 hover:text-red-400">
                    <IconTrash width={14} height={14} />
                  </button>
                </div>
              </div>
              {r.last_run && (
                <div className={`mt-2 text-xs ${r.last_run.status === "success" ? "text-ink-500" : "text-red-400"}`}>
                  So'nggi: {r.last_run.status} · {new Date(r.last_run.triggered_at).toLocaleString("uz-UZ")}
                  {r.last_run.error && ` · ${r.last_run.error}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewRuleModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
      {logRuleId && <RunLog ruleId={logRuleId} onClose={() => setLogRuleId(null)} />}
    </div>
  );
}

export default function AutomationPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <AutomationInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
