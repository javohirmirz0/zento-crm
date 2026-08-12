"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Profile, TEAM_ROLE_LABELS_UZ } from "@/lib/types";
import { IconDashboard, IconCheck, IconFollowup, IconLogout, IconLeads, IconTeam } from "./icons";

const BASE_NAV = [
  { href: "/work", label: "MY WORK", icon: IconDashboard },
  { href: "/work/tasks", label: "Vazifalarim", icon: IconCheck },
  { href: "/work/reports", label: "Hisobotlarim", icon: IconFollowup },
  { href: "/work/profile", label: "Profil", icon: IconTeam },
];

// Rolga xos qo'shimcha nav — hozircha faqat seller_manager uchun (mavjud /leads sahifasiga,
// crm moduli ruxsatiga mos — org_module_permissions: seller_manager.crm = write/self).
const ROLE_EXTRA_NAV: Record<string, { href: string; label: string; icon: typeof IconLeads }[]> = {
  seller_manager: [{ href: "/leads", label: "Mijozlarim (Leadlar)", icon: IconLeads }],
};

function initials(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

export function EmployeeShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const nav = [...BASE_NAV, ...(ROLE_EXTRA_NAV[profile.role] || [])];

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-glow">
            Z
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">MY WORK</div>
            <div className="text-[11px] text-ink-400">ZENTO — Shaxsiy ish maydoni</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/work" && pathname?.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-brand-gradient text-white shadow-glow" : "text-ink-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon width={17} height={17} className={active ? "text-white" : "text-ink-400 group-hover:text-white"} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mx-3 mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{profile.full_name || "Foydalanuvchi"}</div>
              <div className="truncate text-[11px] text-ink-400">
                {TEAM_ROLE_LABELS_UZ[profile.role as keyof typeof TEAM_ROLE_LABELS_UZ] || profile.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-400 transition hover:bg-white/[0.05] hover:text-red-400"
          >
            <IconLogout width={14} height={14} />
            Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
