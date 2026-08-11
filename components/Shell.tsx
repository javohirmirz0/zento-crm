"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Profile, TEAM_ROLE_LABELS_UZ } from "@/lib/types";
import {
  IconDashboard,
  IconLeads,
  IconPipeline,
  IconFollowup,
  IconIntegrations,
  IconTeam,
  IconLogout,
} from "./icons";

const NAV = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/leads", label: "Leadlar", icon: IconLeads },
  { href: "/pipeline", label: "Pipeline", icon: IconPipeline },
  { href: "/followups", label: "Follow-up", icon: IconFollowup },
  { href: "/integrations", label: "Integratsiyalar", icon: IconIntegrations },
  { href: "/team", label: "Jamoa", icon: IconTeam },
];

export function Shell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const visibleNav = NAV.filter((item) => {
    if (item.href === "/team") return profile.role === "admin" || profile.role === "founder";
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <div className="text-lg font-semibold text-slate-900">ZENTO CRM</div>
          <div className="text-xs text-slate-500">Seller Acquisition</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon width={17} height={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="text-sm font-medium text-slate-800">{profile.full_name || "Foydalanuvchi"}</div>
          <div className="text-xs text-slate-500">{TEAM_ROLE_LABELS_UZ[profile.role as keyof typeof TEAM_ROLE_LABELS_UZ] || profile.role}</div>
          <button onClick={handleLogout} className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-600">
            <IconLogout width={14} height={14} />
            Chiqish
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
