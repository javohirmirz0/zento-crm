import { supabase } from "./supabaseClient";

const FUNCTIONS_URL = "https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-ai-agent-run";

export type AgentRunResult = { ok: boolean; run_id?: string; output?: string; error?: string };

export async function runAiAgent(agentKey: string, opts?: { leadId?: string; note?: string }): Promise<AgentRunResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  try {
    const res = await fetch(FUNCTIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ agent_key: agentKey, lead_id: opts?.leadId || null, input_note: opts?.note || null }),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
      return { ok: false, error: json.output || json.error || "Xatolik yuz berdi" };
    }
    return { ok: true, run_id: json.run_id, output: json.output };
  } catch {
    return { ok: false, error: "Tarmoq xatoligi" };
  }
}

export const LEAD_AGENTS = [
  { key: "seller_research", label: "Seller Research", description: "Lead haqida tahlil va so'raladigan savollar" },
  { key: "seller_scoring", label: "Seller Scoring", description: "Tier va risk baholash" },
  { key: "outreach", label: "Outreach", description: "Yuborish uchun xabar loyihasi" },
  { key: "followup_planner", label: "Follow-up Planner", description: "Keyingi qadam va vaqt tavsiyasi" },
  { key: "onboarding", label: "Onboarding", description: "Ro'yxatdan o'tish checklist'i" },
] as const;

export const ORG_AGENTS = [
  { key: "sales_analyst", label: "Sales Analyst", description: "Voronka va e'tirozlar bo'yicha trend tahlili", adminOnly: false },
  { key: "seller_intelligence", label: "Seller Intelligence", description: "Oxirgi 100 e'tiroz bo'yicha pattern tahlili", adminOnly: false },
  { key: "ceo_digest", label: "CEO Agent", description: "Founder uchun haftalik digest", adminOnly: true },
] as const;
