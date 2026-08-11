"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconCopy, IconTrash } from "@/components/icons";
import { Profile, CREATABLE_TEAM_ROLES, TEAM_ROLE_LABELS_UZ, TEAM_ROLE_DESCRIPTIONS_UZ, TeamMember } from "@/lib/types";

const ORG_ID = "3cbb2145-29e1-4b11-a333-5821d7b2e695";

const CREATE_ERROR_LABELS_UZ: Record<string, string> = {
  full_name_required: "Ism va familiya kiritilishi shart",
  invalid_email: "Email formati noto'g'ri",
  invalid_role: "Noto'g'ri rol",
  email_taken: "Bu email allaqachon ro'yxatdan o'tgan",
  forbidden: "Sizda bu amalni bajarish huquqi yo'q",
  unauth: "Sessiya tugagan, qayta kiring",
};

function TeamInner({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "Add existing user" tab
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addRole, setAddRole] = useState("seller_manager");

  // "Create new account" tab
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller_manager");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ email: string; temp_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_organization_members")
      .select("id, role, user_id, profiles!crm_organization_members_user_id_fkey(id, full_name, role, phone)")
      .eq("organization_id", ORG_ID);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const rows: TeamMember[] = (data || []).map((m: any) => ({
      id: m.profiles?.id || m.user_id,
      full_name: m.profiles?.full_name || null,
      role: m.profiles?.role || "",
      phone: m.profiles?.phone || null,
      org_role: m.role,
    }));
    setMembers(rows);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function searchUsers() {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase.from("profiles").select("id, full_name, role, phone").or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`).limit(10);
    setSearchResults((data || []).filter((u) => !members.some((m) => m.id === u.id)));
    setSearching(false);
  }

  async function addMember(userId: string) {
    setError(null);
    const { error } = await supabase.rpc("crm_add_org_member", { p_org: ORG_ID, p_user: userId, p_role: addRole === "seller_manager" || addRole === "admin" ? "member" : addRole });
    if (error) {
      setError(error.message);
      return;
    }
    await supabase.from("profiles").update({ role: addRole }).eq("id", userId);
    setSearchQuery("");
    setSearchResults([]);
    loadMembers();
  }

  async function removeMember(userId: string) {
    setError(null);
    const { error } = await supabase.rpc("crm_remove_org_member", { p_org: ORG_ID, p_user: userId });
    if (error) {
      setError(error.message);
      return;
    }
    loadMembers();
  }

  async function changeRole(userId: string, newRole: string) {
    setError(null);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) {
      setError(error.message);
      return;
    }
    loadMembers();
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreatedResult(null);
    if (!fullName.trim()) {
      setCreateError(CREATE_ERROR_LABELS_UZ.full_name_required);
      return;
    }
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setCreateError(CREATE_ERROR_LABELS_UZ[json.error] || "Xatolik yuz berdi");
        return;
      }
      setCreatedResult({ email: json.email, temp_password: json.temp_password });
      setFullName("");
      setPhone("");
      setEmail("");
      loadMembers();
    } catch {
      setCreateError("Tarmoq xatoligi");
    } finally {
      setCreating(false);
    }
  }

  function copyCredentials() {
    if (!createdResult) return;
    navigator.clipboard.writeText(`Email: ${createdResult.email}\nVaqtinchalik parol: ${createdResult.temp_password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Jamoa</h1>
        <p className="text-sm text-ink-400">CRM foydalanuvchilarini boshqarish</p>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">A'zolar ({members.length})</h2>
        {loading ? (
          <div className="text-sm text-ink-500">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                <div>
                  <div className="text-sm font-medium text-white">{m.full_name || "Noma'lum"}</div>
                  <div className="text-xs text-ink-500">{m.phone || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-auto text-xs"
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    disabled={m.id === profile.id}
                  >
                    {["founder", "admin", "seller_manager"].map((r) => (
                      <option key={r} value={r}>
                        {TEAM_ROLE_LABELS_UZ[r as keyof typeof TEAM_ROLE_LABELS_UZ] || r}
                      </option>
                    ))}
                  </select>
                  <button
                    className="text-ink-500 hover:text-red-400 disabled:opacity-30"
                    disabled={m.id === profile.id}
                    onClick={() => removeMember(m.id)}
                    title="O'chirish"
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && <div className="text-sm text-ink-500">A'zo yo'q</div>}
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="mb-4 flex gap-2 border-b border-white/[0.06] pb-3">
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "existing" ? "bg-brand-500/10 text-brand-300" : "text-ink-400 hover:bg-white/[0.05]"}`}
            onClick={() => setTab("existing")}
          >
            Mavjud foydalanuvchini qo'shish
          </button>
          <button
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === "new" ? "bg-brand-500/10 text-brand-300" : "text-ink-400 hover:bg-white/[0.05]"}`}
            onClick={() => setTab("new")}
          >
            Yangi akkaunt yaratish
          </button>
        </div>

        {tab === "existing" ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Ism yoki telefon bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              />
              <select className="input w-auto" value={addRole} onChange={(e) => setAddRole(e.target.value)}>
                <option value="seller_manager">Sotuvchi menejeri</option>
                <option value="admin">Admin</option>
              </select>
              <button className="btn-secondary shrink-0" onClick={searchUsers} disabled={searching}>
                Qidirish
              </button>
            </div>
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-white">{u.full_name || "Noma'lum"}</div>
                    <div className="text-xs text-ink-500">
                      {u.phone || "-"} · {u.role}
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => addMember(u.id)}>
                    Qo'shish
                  </button>
                </div>
              ))}
              {searchQuery && !searching && searchResults.length === 0 && <div className="text-sm text-ink-500">Topilmadi</div>}
            </div>
          </div>
        ) : (
          <div className="max-w-md space-y-3">
            <p className="text-xs text-ink-400">
              Tizimda hali umuman ro'yxatdan o'tmagan odam uchun yangi akkaunt yaratiladi. Vaqtinchalik parol bir marta ko'rsatiladi.
            </p>
            <form onSubmit={createEmployee} className="space-y-3">
              <div>
                <label className="label">Ism familiya *</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998..." />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  {CREATABLE_TEAM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {TEAM_ROLE_LABELS_UZ[r]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-500">{TEAM_ROLE_DESCRIPTIONS_UZ[role as keyof typeof TEAM_ROLE_DESCRIPTIONS_UZ]}</p>
              </div>
              {createError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{createError}</div>}
              <button type="submit" className="btn-primary w-full" disabled={creating}>
                {creating ? "Yaratilmoqda..." : "Akkaunt yaratish"}
              </button>
            </form>
            {createdResult && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="text-sm font-medium text-green-800">Akkaunt yaratildi</div>
                <div className="mt-2 space-y-1 text-sm text-ink-100">
                  <div>
                    Email: <span className="font-mono">{createdResult.email}</span>
                  </div>
                  <div>
                    Vaqtinchalik parol: <span className="font-mono">{createdResult.temp_password}</span>
                  </div>
                </div>
                <button onClick={copyCredentials} className="btn-secondary mt-2">
                  <IconCopy width={14} height={14} /> {copied ? "Nusxalandi!" : "Nusxalash"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><TeamInner profile={profile} /></Shell>}</AuthGate>;
}
