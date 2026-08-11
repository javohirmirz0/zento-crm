"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconCopy, IconRefresh, IconPlus } from "@/components/icons";
import { CHANNEL_TYPES, CHANNEL_LABELS_UZ, CHANNEL_DESCRIPTIONS_UZ, CrmChannel, Profile } from "@/lib/types";

const ORG_ID = "3cbb2145-29e1-4b11-a333-5821d7b2e695";
const FUNCTIONS_BASE = "https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-lead-ingest";

function IntegrationsInner({ profile }: { profile: Profile }) {
  const [channels, setChannels] = useState<CrmChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState<string>(CHANNEL_TYPES[0]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [quota, setQuota] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, quotaRes] = await Promise.all([
      supabase.from("crm_channels").select("*").eq("organization_id", ORG_ID).order("created_at", { ascending: false }),
      supabase.rpc("crm_check_sms_quota"),
    ]);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setChannels((data as CrmChannel[]) || []);
    setQuota(quotaRes.data || null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.rpc("crm_create_channel", { p_org: ORG_ID, p_type: newType, p_name: newName.trim() });
    setCreating(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNewName("");
    load();
  }

  async function toggle(channel: CrmChannel) {
    const { error } = await supabase.rpc("crm_toggle_channel", { p_channel: channel.id, p_active: !channel.is_active });
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  async function rotateToken(channel: CrmChannel) {
    const { error } = await supabase.rpc("crm_rotate_channel_token", { p_channel: channel.id });
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  function copyWebhook(channel: CrmChannel) {
    const url = `${FUNCTIONS_BASE}/${channel.webhook_token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(channel.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Integratsiyalar</h1>
        <p className="text-sm text-slate-500">Kanallar orqali avtomatik lead qabul qilish</p>
      </div>

      {quota && (
        <div className="card p-3 text-sm text-slate-600">
          SMS kvotasi: {quota.used ?? 0} / {quota.limit ?? "-"} bugun
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={createChannel} className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Turi</label>
          <select className="input w-auto" value={newType} onChange={(e) => setNewType(e.target.value)}>
            {CHANNEL_TYPES.map((t) => (
              <option key={t} value={t}>
                {CHANNEL_LABELS_UZ[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="label">Nomi</label>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Masalan: Asosiy sayt" />
        </div>
        <button type="submit" className="btn-primary" disabled={creating}>
          <IconPlus width={16} height={16} /> Qo'shish
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Yuklanmoqda...</div>
      ) : (
        <div className="space-y-3">
          {channels.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{CHANNEL_LABELS_UZ[c.type]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.is_active ? "Aktiv" : "O'chirilgan"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{CHANNEL_DESCRIPTIONS_UZ[c.type]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => toggle(c)}>
                    {c.is_active ? "O'chirish" : "Yoqish"}
                  </button>
                </div>
              </div>
              {c.type !== "manual" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-slate-600">
                    {FUNCTIONS_BASE}/{c.webhook_token}
                  </code>
                  <button className="text-slate-400 hover:text-slate-700" onClick={() => copyWebhook(c)} title="Nusxalash">
                    <IconCopy width={15} height={15} />
                  </button>
                  <button className="text-slate-400 hover:text-slate-700" onClick={() => rotateToken(c)} title="Tokenni yangilash">
                    <IconRefresh width={15} height={15} />
                  </button>
                  {copiedId === c.id && <span className="text-xs text-green-600">Nusxalandi!</span>}
                </div>
              )}
            </div>
          ))}
          {channels.length === 0 && <div className="text-sm text-slate-400">Kanal yo'q</div>}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><IntegrationsInner profile={profile} /></Shell>}</AuthGate>;
}
