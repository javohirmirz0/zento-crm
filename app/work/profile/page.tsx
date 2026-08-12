"use client";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { Profile, TEAM_ROLE_LABELS_UZ, TEAM_ROLE_DESCRIPTIONS_UZ } from "@/lib/types";

function ProfileInner({ profile }: { profile: Profile }) {
  const roleLabel = TEAM_ROLE_LABELS_UZ[profile.role as keyof typeof TEAM_ROLE_LABELS_UZ] || profile.role;
  const roleDesc = TEAM_ROLE_DESCRIPTIONS_UZ[profile.role as keyof typeof TEAM_ROLE_DESCRIPTIONS_UZ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Profil</h1>
        <p className="text-sm text-ink-400">Shaxsiy ma'lumotlaringiz — faqat siz ko'rasiz.</p>
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <div className="label">To'liq ism</div>
          <div className="text-sm text-white">{profile.full_name || "—"}</div>
        </div>
        <div>
          <div className="label">Lavozim</div>
          <div className="text-sm text-white">{roleLabel}</div>
          {roleDesc && <div className="mt-0.5 text-xs text-ink-400">{roleDesc}</div>}
        </div>
        <div>
          <div className="label">Telefon</div>
          <div className="text-sm text-white">{profile.phone || "—"}</div>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        KPI'ingizni <a href="/work/kpi" className="text-brand-300 hover:text-brand-200">Mening KPI'im</a>, maoshingizni{" "}
        <a href="/work/salary" className="text-brand-300 hover:text-brand-200">Maoshim</a>, shartnomangizni{" "}
        <a href="/work/documents" className="text-brand-300 hover:text-brand-200">Hujjatlarim</a> bo'limidan ko'rishingiz mumkin.
      </p>
    </div>
  );
}

export default function WorkProfilePage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <ProfileInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
