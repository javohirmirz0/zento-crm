"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Profile, TEAM_ROLE_LABELS_UZ } from "@/lib/types";
import {
  IconDashboard,
  IconFollowup,
  IconTeam,
  IconLogout,
  IconSparkles,
  IconPipeline,
  IconLeads,
  IconIntegrations,
  IconCheck,
  IconChart,
  IconBolt,
  IconWallet,
  IconTruck,
  IconBell,
  IconHistory,
  IconChat,
} from "./icons";

const NAV = [
  { href: "/", label: "CEO Dashboard", icon: IconDashboard },
  { href: "/tasks", label: "Vazifalar", icon: IconCheck },
  { href: "/tasks/my", label: "Mening vazifalarim", icon: IconFollowup },
  { href: "/employees", label: "Xodimlar & KPI", icon: IconChart, adminOnly: true },
  { href: "/automation", label: "Avtomatlashtirish", icon: IconBolt, adminOnly: true },
  { href: "/orders", label: "Buyurtmalar", icon: IconTruck, roles: ["admin", "founder", "ops_manager", "logistics_manager"] },
  { href: "/finance", label: "Moliya", icon: IconWallet, roles: ["admin", "founder", "finance_manager"] },
  { href: "/leads", label: "Leadlar", icon: IconLeads },
  { href: "/pipeline", label: "Pipeline", icon: IconPipeline },
  { href: "/followups", label: "Follow-up", icon: IconFollowup },
  { href: "/economics", label: "Iqtisodiyot", icon: IconSparkles },
  { href: "/ask", label: "Ask ZENTO", icon: IconChat },
  { href: "/notifications", label: "Bildirishnomalar", icon: IconBell },
  { href: "/activity", label: "Faoliyat jurnali", icon: IconHistory, adminOnly: true },
  { href: "/agents", label: "AI Agentlar", icon: IconSparkles, adminOnly: true },
  { href: "/integrations", label: "Integratsiyalar", icon: IconIntegrations },
  { href: "/team", label: "Jamoa", icon: IconTeam, adminOnly: true },
];

function initials(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

export function Shell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      const { data } = await supabase.rpc("notification_center_unread_count");
      if (!cancelled && typeof data === "number") setUnreadCount(data);
    }
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const visibleNav = NAV.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.roles) return isAdmin || item.roles.includes(profile.role);
    return true;
  });

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/70 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-glow">
            Z
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">ZENTO COMMAND CENTER</div>
            <div className="text-[11px] text-ink-400">Business Operating System</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visibleNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-ink-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon width={17} height={17} className={active ? "text-white" : "text-ink-400 group-hover:text-white"} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
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
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
