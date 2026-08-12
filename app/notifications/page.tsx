"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconBell, IconCheck, IconRefresh, IconPlus, IconTrash } from "@/components/icons";
import {
  Profile,
  NotificationRow,
  NotificationRoutingRule,
  NOTIFICATION_SEVERITY_LABELS_UZ,
  NOTIFICATION_SEVERITY_COLORS,
  TEAM_ROLES,
  TEAM_ROLE_LABELS_UZ,
} from "@/lib/types";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "hozir";
  if (mins < 60) return `${mins} daq oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

function RoutingRulesPanel() {
  const [rules, setRules] = useState<NotificationRoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "", min_severity: "info", target_role: "admin", channel: "in_app" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("list_notification_routing_rules");
    setRules((data as NotificationRoutingRule[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function addRule() {
    if (!form.category) return;
    setSaving(true);
    await supabase.rpc("upsert_notification_routing_rule", {
      p_id: null,
      p_category: form.category,
      p_min_severity: form.min_severity,
      p_target_role: form.target_role,
      p_channel: form.channel,
    });
    setForm({ category: "", min_severity: "info", target_role: "admin", channel: "in_app" });
    setSaving(false);
    load();
  }

  async function removeRule(id: string) {
    await supabase.rpc("delete_notification_routing_rule", { p_id: id });
    load();
  }

  return (
    <div className="card p-4">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)}>
        <div>
          <h2 className="text-sm font-semibold text-white">Routing qoidalari</h2>
          <p className="text-xs text-ink-400">Qaysi kategoriya/severity kimga (rolga) yuborilishini sozlash</p>
        </div>
        <span className="text-ink-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm text-ink-400">Yuklanmoqda...</div>
          ) : rules.length === 0 ? (
            <div className="text-xs text-ink-500">Hozircha qoida yo'q.</div>
          ) : (
            <div className="space-y-1.5">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-xs">
                  <span className="text-ink-300">
                    <strong className="text-white">{r.category}</strong> · min: {r.min_severity} · → {r.target_role} · {r.channel}
                  </span>
                  <button onClick={() => removeRule(r.id)} className="text-ink-500 hover:text-red-400">
                    <IconTrash width={13} height={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            <input
              className="input w-auto flex-1 min-w-[140px]"
              placeholder="kategoriya (masalan task_deadline)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <select className="input w-auto" value={form.min_severity} onChange={(e) => setForm({ ...form, min_severity: e.target.value })}>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="critical">critical</option>
            </select>
            <select className="input w-auto" value={form.target_role} onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {TEAM_ROLE_LABELS_UZ[r]}
                </option>
              ))}
            </select>
            <select className="input w-auto" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="in_app">in_app</option>
              <option value="telegram">telegram</option>
              <option value="push">push</option>
            </select>
            <button className="btn-secondary" disabled={saving || !form.category} onClick={addRule}>
              <IconPlus width={13} height={13} /> Qo'shish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("notification_center_list", {
      p_unread_only: unreadOnly,
      p_category: null,
      p_limit: 100,
      p_offset: 0,
    });
    setItems((data as NotificationRow[]) || []);
    setLoading(false);
  }, [unreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await supabase.rpc("mark_notification_read", { p_id: id });
  }

  async function markAllRead() {
    await supabase.rpc("mark_all_notifications_read");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Bildirishnomalar</h1>
          <p className="text-sm text-ink-400">Shaxsiy bildirishnomalar markazi</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-ink-400">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Faqat o'qilmagan
          </label>
          <button className="btn-secondary" onClick={markAllRead}>
            <IconCheck width={13} height={13} /> Barchasini o'qildi deb belgilash
          </button>
          <button className="btn-secondary" onClick={load}>
            <IconRefresh width={13} height={13} />
          </button>
        </div>
      </div>

      {isAdmin && <RoutingRulesPanel />}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-ink-400">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-500">
            <IconBell width={22} height={22} className="mx-auto mb-2 text-ink-600" />
            Bildirishnoma yo'q.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex items-start gap-3 px-4 py-3 text-sm transition ${n.is_read ? "opacity-60" : "cursor-pointer hover:bg-white/[0.03]"}`}
              >
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />}
                <div className={n.is_read ? "ml-5" : ""}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{n.title || n.type || "Bildirishnoma"}</span>
                    {n.severity && (
                      <span className={`pill border text-[10px] ${NOTIFICATION_SEVERITY_COLORS[n.severity] || ""}`}>
                        {NOTIFICATION_SEVERITY_LABELS_UZ[n.severity] || n.severity}
                      </span>
                    )}
                  </div>
                  {(n.message || n.body) && <p className="mt-0.5 text-ink-400">{n.message || n.body}</p>}
                  <p className="mt-1 text-xs text-ink-500">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <NotificationsInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
