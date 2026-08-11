"use client";
import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconSparkles } from "@/components/icons";
import { Profile } from "@/lib/types";
import { ORG_AGENTS, runAiAgent } from "@/lib/aiAgents";

function AgentsInner({ profile }: { profile: Profile }) {
  const isAdmin = profile.role === "admin" || profile.role === "founder";
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string) {
    setBusy(key);
    setErrors((prev) => ({ ...prev, [key]: "" }));
    const res = await runAiAgent(key);
    setBusy(null);
    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [key]: res.error || "Xatolik" }));
      return;
    }
    setOutputs((prev) => ({ ...prev, [key]: res.output || "" }));
  }

  const visibleAgents = ORG_AGENTS.filter((a) => !a.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">AI Agentlar</h1>
        <p className="text-sm text-ink-400">
          Sotuv jarayonini tahlil qiladigan mustaqil AI agentlar — real CRM ma'lumoti asosida ishlaydi.
        </p>
      </div>

      <div className="rounded-lg border border-brand-500/20 bg-brand-500/[0.06] px-4 py-3 text-xs text-ink-300">
        Lead darajasidagi agentlar (Research, Scoring, Outreach, Follow-up, Onboarding) — har bir leadning o'zi sahifasida ishlaydi.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {visibleAgents.map((a) => (
          <div key={a.key} className="card flex flex-col p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
                <IconSparkles width={16} height={16} />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">{a.label}</div>
                <div className="text-xs text-ink-400">{a.description}</div>
              </div>
            </div>
            <button className="btn-primary mt-4" disabled={busy === a.key} onClick={() => run(a.key)}>
              {busy === a.key ? "Ishlamoqda..." : "Ishga tushirish"}
            </button>
            {errors[a.key] && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{errors[a.key]}</div>
            )}
            {outputs[a.key] && (
              <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-line rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-ink-100">
                {outputs[a.key]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><AgentsInner profile={profile} /></Shell>}</AuthGate>;
}
