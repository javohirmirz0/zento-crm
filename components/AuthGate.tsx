"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

export function AuthGate({ children }: { children: (profile: Profile) => React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, avatar_url, is_platform_owner")
        .eq("id", user.id)
        .single();
      if (!active) return;
      if (error || !data) {
        setError("Profil topilmadi");
        setLoading(false);
        return;
      }
      const { data: memberships } = await supabase
        .from("crm_organization_members")
        .select("organization_id")
        .eq("user_id", user.id);
      const org_ids = (memberships || []).map((m: { organization_id: string }) => m.organization_id);
      const allowedRoles = [
        "admin",
        "founder",
        "seller_manager",
        "ops_manager",
        "logistics_manager",
        "finance_manager",
        "ai_developer",
        "employee",
      ];
      if (!allowedRoles.includes(data.role)) {
        setError("Sizda ushbu tizimga kirish huquqi yo'q");
        setLoading(false);
        return;
      }
      setProfile({ ...(data as Profile), org_ids });
      setLoading(false);
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-400">
        Yuklanmoqda...
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-sm text-red-400">{error || "Xatolik yuz berdi"}</p>
          <button className="btn-secondary mt-4" onClick={() => supabase.auth.signOut()}>
            Chiqish
          </button>
        </div>
      </div>
    );
  }
  return <>{children(profile)}</>;
}
