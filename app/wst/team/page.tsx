"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconCopy, IconTrash } from "@/components/icons";
import {
  Profile,
  WST_TEAM_ROLES,
  WST_TEAM_ROLE_LABELS_UZ,
  WstTeamMember,
} from "@/lib/types";

// WST — ikkinchi tashkilot (Faza 2). ZENTO'ning /team sahifasidagi xavfsiz
// naqsh (service-role edge function orqali akkaunt yaratish, vaqtinchalik
// parol bir marta ko'rsatiladi) shu yerda WST uchun takrorlangan — lekin
// alohida wst-create-employee funksiyasi orqali, chunki WST akkauntlari
// profiles.role'da hech qachon 'admin'/'founder' bo'lmaydi va @wst.uz email
// domeni talab qilinadi.
const WST_ORG_ID = "18bc3231-4887-453b-b98f-8c82954d6135";

const CREATE_ERROR_LABELS_UZ: Record<string, string> = {
  full_name_required: "Ism va familiya kiritilishi shart",
  invalid_email_domain: "Email @wst.uz domenida bo'lishi shart (masalan: sales@wst.uz)",
  invalid_role: "Noto'g'ri rol",
  email_taken: "Bu email allaqachon ro'yxatdan o'tgan",
  forbidden: "Sizda bu amalni bajarish huquqi yo'q",
  unauth: "Sessiya tugagan, qayta kiring",
};

function TeamInner({ profile }: { profile: Profile }) {
  const [members, setMembers] = useState<WstTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [teamRole, setTeamRole] = useState<string>("sales_manager");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ email: string; temp_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_organization_members")
      .select("id, role, team_role, user_id, profiles!crm_organization_members_user_id_fkey(id, full_name, phone)")
      .eq("organization_id", WST_ORG_ID);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const rows: WstTeamMember[] = (data || []).map((m: any) => ({
      id: m.profiles?.id || m.user_id,
      full_name: m.profiles?.full_name || null,
      phone: m.profiles?.phone || null,
      org_role: m.role,
      team_role: m.team_role,
    }));
    setMembers(rows);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function removeMember(userId: string) {
    setError(null);
    const { error } = await supabase.rpc("crm_remove_org_member", { p_org: WST_ORG_ID, p_user: userId });
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
      const res = await fetch("https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/wst-create-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), email: email.trim(), team_role: teamRole }),
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
        <h1 className="text-xl font-semibold text-white">WST — Jamoa</h1>
        <p className="text-sm text-ink-400">WST xodimlarini boshqarish. Bu yerda yaratilgan akkauntlar faqat WST ma'lumotlariga kira oladi.</p>
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
                  <div className="text-xs text-ink-500">
                    {m.phone || "-"} ·{" "}
                    {m.org_role === "owner"
                      ? WST_TEAM_ROLE_LABELS_UZ.owner
                      : WST_TEAM_ROLE_LABELS_UZ[m.team_role as keyof typeof WST_TEAM_ROLE_LABELS_UZ] || m.team_role || "—"}
                  </div>
                </div>
                <button
                  className="text-ink-500 hover:text-red-400 disabled:opacity-30"
                  disabled={m.id === profile.id}
                  onClick={() => removeMember(m.id)}
                  title="O'chirish"
                >
                  <IconTrash width={16} height={16} />
                </button>
              </div>
            ))}
            {members.length === 0 && <div className="text-sm text-ink-500">A'zo yo'q</div>}
          </div>
        )}
      </div>

      <div className="card max-w-md p-4">
        <h2 className="mb-1 text-sm font-semibold text-white">Yangi WST xodimi qo'shish</h2>
        <p className="mb-4 text-xs text-ink-400">
          Email albatta <span className="font-mono">@wst.uz</span> domenida bo'lishi kerak. Vaqtinchalik parol bir marta ko'rsatiladi — uni xodimga xavfsiz usulda yetkazing.
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
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@wst.uz" required />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={teamRole} onChange={(e) => setTeamRole(e.target.value)}>
              {WST_TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {WST_TEAM_ROLE_LABELS_UZ[r]}
                </option>
              ))}
            </select>
          </div>
          {createError && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{createError}</div>}
          <button type="submit" className="btn-primary w-full" disabled={creating}>
            {creating ? "Yaratilmoqda..." : "Akkaunt yaratish"}
          </button>
        </form>
        {createdResult && (
          <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="text-sm font-medium text-emerald-300">Akkaunt yaratildi</div>
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
    </div>
  );
}

export default function WstTeamPage() {
  return (
    <AuthGate>
      {(profile: Profile) => {
        const orgIds = profile.org_ids || [];
        const canView = !!profile.is_platform_owner || orgIds.includes(WST_ORG_ID);
        return (
          <Shell profile={profile}>
            {canView ? (
              <TeamInner profile={profile} />
            ) : (
              <div className="rounded-lg border border-white/10 bg-ink-800/60 px-4 py-3 text-sm text-ink-400">
                Bu sahifaga faqat WST jamoasi yoki platforma egasi kira oladi.
              </div>
            )}
          </Shell>
        );
      }}
    </AuthGate>
  );
}
