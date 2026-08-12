"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconShield, IconRefresh } from "@/components/icons";
import {
  Profile,
  OrgModulePermission,
  TEAM_ROLES,
  TEAM_ROLE_LABELS_UZ,
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS_UZ,
  PERMISSION_ACCESS_LEVELS,
  PERMISSION_ACCESS_LABELS_UZ,
  PERMISSION_SCOPES,
  PERMISSION_SCOPE_LABELS_UZ,
  PermissionAccess,
  PermissionScope,
} from "@/lib/types";

const ACCESS_COLORS: Record<string, string> = {
  none: "border-white/10 bg-white/[0.03] text-ink-500",
  read: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  write: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
};

function PermissionsInner() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [rows, setRows] = useState<OrgModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("employee");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: org }, { data: perms }] = await Promise.all([
      supabase.rpc("my_organization_id"),
      supabase.rpc("list_org_module_permissions"),
    ]);
    if (org) setOrgId(org as string);
    setRows((perms as OrgModulePermission[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateCell(module: string, field: "access" | "scope", value: string) {
    if (!orgId) return;
    const key = `${role}:${module}`;
    const current = rows.find((r) => r.role === role && r.module === module);
    const next = {
      access: field === "access" ? (value as PermissionAccess) : (current?.access as PermissionAccess) || "none",
      scope: field === "scope" ? (value as PermissionScope) : (current?.scope as PermissionScope) || "self",
    };

    setRows((prev) => {
      const exists = prev.some((r) => r.role === role && r.module === module);
      if (exists) {
        return prev.map((r) => (r.role === role && r.module === module ? { ...r, ...next } : r));
      }
      return [
        ...prev,
        {
          id: current?.id || "",
          organization_id: orgId,
          role,
          module,
          access: next.access,
          scope: next.scope,
          updated_at: new Date().toISOString(),
          updated_by: null,
        } as OrgModulePermission,
      ];
    });

    setSavingKey(key);
    const { data, error } = await supabase.rpc("upsert_org_module_permission", {
      p_id: current?.id || null,
      p_organization_id: orgId,
      p_role: role,
      p_module: module,
      p_access: next.access,
      p_scope: next.scope,
    });
    if (!error && data) {
      setRows((prev) => {
        const filtered = prev.filter((r) => !(r.role === role && r.module === module));
        return [...filtered, data as OrgModulePermission];
      });
    }
    setSavingKey(null);
  }

  const roleRows = PERMISSION_MODULES.map((module) => {
    const found = rows.find((r) => r.role === role && r.module === module);
    return {
      module,
      access: (found?.access as PermissionAccess) || "none",
      scope: (found?.scope as PermissionScope) || "self",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <IconShield width={20} height={20} className="text-brand-400" />
            Ruxsatlar matritsasi
          </h1>
          <p className="text-sm text-ink-400">
            LEVEL 2 (modul huquqi) va LEVEL 3 (yozuv doirasi) — rolga qarab. O'zgartirish darhol saqlanadi.
          </p>
        </div>
        <button className="btn-secondary" onClick={load}>
          <IconRefresh width={13} height={13} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TEAM_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              role === r ? "bg-brand-gradient text-white shadow-glow" : "bg-white/[0.03] text-ink-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {TEAM_ROLE_LABELS_UZ[r]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-ink-400">Yuklanmoqda...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs text-ink-500">
                <th className="px-4 py-3 font-medium">Modul</th>
                <th className="px-4 py-3 font-medium">Huquq</th>
                <th className="px-4 py-3 font-medium">Doira</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {roleRows.map((row) => {
                const key = `${role}:${row.module}`;
                return (
                  <tr key={row.module}>
                    <td className="px-4 py-2.5 text-white">{PERMISSION_MODULE_LABELS_UZ[row.module]}</td>
                    <td className="px-4 py-2.5">
                      <select
                        className={`rounded-lg border px-2 py-1 text-xs font-medium ${ACCESS_COLORS[row.access] || ACCESS_COLORS.none}`}
                        value={row.access}
                        onChange={(e) => updateCell(row.module, "access", e.target.value)}
                      >
                        {PERMISSION_ACCESS_LEVELS.map((a) => (
                          <option key={a} value={a} className="bg-ink-900 text-white">
                            {PERMISSION_ACCESS_LABELS_UZ[a]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-ink-300"
                        value={row.scope}
                        onChange={(e) => updateCell(row.module, "scope", e.target.value)}
                        disabled={row.access === "none"}
                      >
                        {PERMISSION_SCOPES.map((s) => (
                          <option key={s} value={s} className="bg-ink-900 text-white">
                            {PERMISSION_SCOPE_LABELS_UZ[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[10px] text-ink-500">{savingKey === key ? "saqlanmoqda..." : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ink-500">
        Eslatma: bu matritsa hozircha faqat ko'rish/tahrirlash uchun — mavjud sahifalar/RPC'lar hali eski qattiq kodlangan
        rol tekshiruvlaridan foydalanmoqda. Yangi Employee Portal (Faza 1, Qadam 1.3) RPC'lari shu jadvaldan foydalanadi.
      </p>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <AuthGate>
      {(profile: Profile) => (
        <Shell profile={profile}>
          <PermissionsInner />
        </Shell>
      )}
    </AuthGate>
  );
}
