"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { CommsBox } from "@/components/CommsBox";
import { IconSparkles, IconCheck } from "@/components/icons";

const ONBOARDING_STEPS: { key: string; label: string }[] = [
  { key: "account_created", label: "Hisob ochildi" },
  { key: "business_info_done", label: "Biznes ma'lumoti" },
  { key: "contact_verified", label: "Kontakt tasdiqlandi" },
  { key: "bank_info_done", label: "Bank ma'lumoti" },
  { key: "agreement_accepted", label: "Shartnoma qabul qilindi" },
  { key: "products_uploaded", label: "Mahsulot yuklandi (5+)" },
  { key: "products_approved", label: "Mahsulot tasdiqlandi" },
  { key: "stock_available", label: "Ombor/stock bor" },
  { key: "first_order_received", label: "Birinchi buyurtma" },
];
import { LEAD_AGENTS, runAiAgent } from "@/lib/aiAgents";
import {
  Profile,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS_UZ,
  PRIORITIES,
  PRIORITY_LABELS_UZ,
  OBJECTION_TYPES,
  OBJECTION_LABELS_UZ,
  SELLS_ON_OPTIONS,
  SELLS_ON_LABELS_UZ,
  FULFILLMENT_MODELS,
  FULFILLMENT_MODEL_LABELS_UZ,
  SIGNAL_LABELS_UZ,
  SellerSignal,
  SELLER_TIERS,
  SELLER_TIER_LABELS_UZ,
  OBJECTION_OUTCOMES,
  OBJECTION_OUTCOME_LABELS_UZ,
} from "@/lib/types";

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function LeadDetailInner({ profile }: { profile: Profile }) {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;
  const isAdmin = profile.role === "admin" || profile.role === "founder";

  const [detail, setDetail] = useState<any>(null);
  const [objections, setObjections] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [objectionType, setObjectionType] = useState(OBJECTION_TYPES[0]);
  const [objectionNote, setObjectionNote] = useState("");
  const [objectionResponse, setObjectionResponse] = useState("");
  const [objectionReaction, setObjectionReaction] = useState("");
  const [objectionOutcome, setObjectionOutcome] = useState<string>("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [evidenceDraft, setEvidenceDraft] = useState<{ evidence_url: string; city: string }>({ evidence_url: "", city: "" });

  const [draft, setDraft] = useState<{ sells_on: string[]; has_warehouse: boolean | null; fulfillment_model: string }>({
    sells_on: [],
    has_warehouse: null,
    fulfillment_model: "unknown",
  });

  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<{ key: string; text: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function runLeadAgent(key: string) {
    setAiBusy(key);
    setAiError(null);
    setAiOutput(null);
    const res = await runAiAgent(key, { leadId });
    setAiBusy(null);
    if (!res.ok) {
      setAiError(res.error || "Xatolik");
      return;
    }
    setAiOutput({ key, text: res.output || "" });
  }

  const [onboardingBusy, setOnboardingBusy] = useState<string | null>(null);
  async function toggleOnboardingStep(field: string, value: boolean) {
    setOnboardingBusy(field);
    const { error } = await supabase.rpc("set_seller_onboarding_step", { p_lead_id: leadId, p_field: field, p_value: value });
    setOnboardingBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error }, objRes, mgrRes] = await Promise.all([
      supabase.rpc("seller_lead_detail", { p_lead_id: leadId }),
      supabase
        .from("seller_lead_objections")
        .select("id, objection_type, note, manager_response, seller_reaction, outcome, created_at")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("role", "seller_manager"),
    ]);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setDetail(data);
    setObjections(objRes.data || []);
    setManagers(mgrRes.data || []);
    if (data?.lead) {
      setDraft({
        sells_on: data.lead.sells_on || [],
        has_warehouse: data.lead.has_warehouse,
        fulfillment_model: data.lead.fulfillment_model || "unknown",
      });
      setEscalateReason(data.lead.escalate_reason || "");
      setEvidenceDraft({ evidence_url: data.lead.evidence_url || "", city: data.lead.city || "" });
    }
    setError(null);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(fn: () => PromiseLike<{ error: any }>) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  if (loading) return <div className="text-sm text-ink-400">Yuklanmoqda...</div>;
  if (error && !detail) return <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>;
  if (!detail?.lead) return <div className="text-sm text-ink-400">Lead topilmadi</div>;

  const lead = detail.lead;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push("/leads")} className="text-xs text-ink-500 hover:text-ink-300">
            ← Leadlar
          </button>
          <h1 className="mt-1 text-xl font-semibold text-white">{lead.company_name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Asosiy ma'lumot">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-ink-500">Kontakt shaxs</div>
                <div className="text-white">{lead.contact_person}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Telefon</div>
                <div className="text-white">{lead.phone}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Telegram</div>
                <div className="text-white">{lead.telegram || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Instagram</div>
                <div className="text-white">{lead.instagram || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Manba</div>
                <div className="text-white">{detail.source_name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Kategoriya</div>
                <div className="text-white">{detail.category_name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Joylashuv</div>
                <div className="text-white">{lead.location || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Taxminiy SKU</div>
                <div className="text-white">{lead.estimated_sku_count ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Lead skor</div>
                <div className="text-white">{lead.lead_score}</div>
              </div>
            </div>
          </Section>

          <Section title="Seller tier va evidence">
            <div className="mb-3 flex flex-wrap gap-2">
              {SELLER_TIERS.map((t) => (
                <button
                  key={t}
                  disabled={busy}
                  onClick={() => runAction(() => supabase.rpc("set_seller_lead_tier", { p_lead_id: leadId, p_tier: lead.seller_tier === t ? null : t }))}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    lead.seller_tier === t ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-white/10 text-ink-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {SELLER_TIER_LABELS_UZ[t]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Shahar</label>
                <input className="input" value={evidenceDraft.city} onChange={(e) => setEvidenceDraft((d) => ({ ...d, city: e.target.value }))} />
              </div>
              <div>
                <label className="label">Evidence URL</label>
                <input
                  className="input"
                  placeholder="https://instagram.com/..."
                  value={evidenceDraft.evidence_url}
                  onChange={(e) => setEvidenceDraft((d) => ({ ...d, evidence_url: e.target.value }))}
                />
              </div>
            </div>
            <button
              className="btn-secondary mt-3"
              disabled={busy}
              onClick={() =>
                runAction(() =>
                  supabase.rpc("set_seller_lead_evidence", {
                    p_lead_id: leadId,
                    p_evidence_url: evidenceDraft.evidence_url || null,
                    p_city: evidenceDraft.city || null,
                  })
                )
              }
            >
              Saqlash
            </button>
          </Section>

          <Section title="Status">
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={busy || s === lead.status}
                  onClick={() =>
                    runAction(() => supabase.rpc("set_seller_lead_status", { p_lead_id: leadId, p_new_status: s, p_note: null }))
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    s === lead.status ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-white/10 text-ink-400 hover:bg-white/[0.05]"
                  }`}
                >
                  {LEAD_STATUS_LABELS_UZ[s]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prioritet</label>
                <select
                  className="input"
                  value={lead.priority}
                  disabled={busy}
                  onChange={(e) => runAction(() => supabase.rpc("set_seller_lead_priority", { p_lead_id: leadId, p_priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS_UZ[p]}
                    </option>
                  ))}
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="label">Menejer</label>
                  <select
                    className="input"
                    value={lead.assigned_manager || ""}
                    disabled={busy}
                    onChange={(e) => runAction(() => supabase.rpc("assign_seller_lead", { p_lead_id: leadId, p_manager_id: e.target.value || null }))}
                  >
                    <option value="">Biriktirilmagan</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </Section>

          <Section title="Biznes ma'lumotlari">
            <div className="space-y-3">
              <div>
                <label className="label">Qayerda sotadi</label>
                <div className="flex flex-wrap gap-2">
                  {SELLS_ON_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, sells_on: d.sells_on.includes(s) ? d.sells_on.filter((x) => x !== s) : [...d.sells_on, s] }))
                      }
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        draft.sells_on.includes(s) ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-white/10 text-ink-400"
                      }`}
                    >
                      {SELLS_ON_LABELS_UZ[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ombor bormi</label>
                  <select
                    className="input"
                    value={draft.has_warehouse === null ? "" : draft.has_warehouse ? "yes" : "no"}
                    onChange={(e) => setDraft((d) => ({ ...d, has_warehouse: e.target.value === "" ? null : e.target.value === "yes" }))}
                  >
                    <option value="">Noma'lum</option>
                    <option value="yes">Ha</option>
                    <option value="no">Yo'q</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fulfillment</label>
                  <select className="input" value={draft.fulfillment_model} onChange={(e) => setDraft((d) => ({ ...d, fulfillment_model: e.target.value }))}>
                    {FULFILLMENT_MODELS.map((f) => (
                      <option key={f} value={f}>
                        {FULFILLMENT_MODEL_LABELS_UZ[f]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className="btn-secondary"
                disabled={busy}
                onClick={() =>
                  runAction(() =>
                    supabase.rpc("update_seller_lead_details", {
                      p_lead_id: leadId,
                      p_company_name: lead.company_name,
                      p_contact_person: lead.contact_person,
                      p_phone: lead.phone,
                      p_telegram: lead.telegram,
                      p_instagram: lead.instagram,
                      p_website: lead.website,
                      p_category_id: lead.category_id,
                      p_source_id: lead.source_id,
                      p_estimated_sku_count: lead.estimated_sku_count,
                      p_estimated_monthly_sales: lead.estimated_monthly_sales,
                      p_price_range: lead.price_range,
                      p_location: lead.location,
                      p_sells_on: draft.sells_on,
                      p_has_warehouse: draft.has_warehouse,
                      p_fulfillment_model: draft.fulfillment_model,
                    })
                  )
                }
              >
                Biznes ma'lumotlarini saqlash
              </button>
            </div>
          </Section>

          <Section title="Signallar">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SIGNAL_LABELS_UZ) as SellerSignal[]).map((sig) => {
                const activeAt = lead[`${sig}_at`];
                return (
                  <button
                    key={sig}
                    disabled={busy}
                    onClick={() => runAction(() => supabase.rpc("set_seller_lead_signal", { p_lead_id: leadId, p_signal: sig, p_value: !activeAt }))}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      activeAt ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-ink-400"
                    }`}
                  >
                    {SIGNAL_LABELS_UZ[sig]}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Founderga o'tkazish">
            <div className="flex items-center gap-3">
              <input
                className="input"
                placeholder="Sabab"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                disabled={lead.escalate_to_founder}
              />
              {lead.escalate_to_founder ? (
                <button
                  className="btn-secondary shrink-0"
                  disabled={busy}
                  onClick={() => runAction(() => supabase.rpc("set_seller_lead_escalation", { p_lead_id: leadId, p_escalate: false, p_reason: null }))}
                >
                  Bekor qilish
                </button>
              ) : (
                <button
                  className="btn-primary shrink-0"
                  disabled={busy}
                  onClick={() => runAction(() => supabase.rpc("set_seller_lead_escalation", { p_lead_id: leadId, p_escalate: true, p_reason: escalateReason || null }))}
                >
                  O'tkazish
                </button>
              )}
            </div>
          </Section>

          {lead.converted_seller_id && detail.marketplace && (
            <Section title="Marketplace holati">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-ink-500">Do'kon</div>
                  <div className="text-white">{detail.marketplace.store_name || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Mahsulotlar</div>
                  <div className="text-white">
                    {detail.marketplace.product_count} (tasdiqlangan: {detail.marketplace.approved_count})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Buyurtmalar</div>
                  <div className="text-white">{detail.marketplace.order_count}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-ink-400">Onboarding checklist</div>
                  <div className="text-xs text-ink-500">
                    {ONBOARDING_STEPS.filter((s) => detail.marketplace?.onboarding?.[s.key]).length} / {ONBOARDING_STEPS.length}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ONBOARDING_STEPS.map((s) => {
                    const done = !!detail.marketplace?.onboarding?.[s.key];
                    return (
                      <button
                        key={s.key}
                        disabled={onboardingBusy === s.key}
                        onClick={() => toggleOnboardingStep(s.key, !done)}
                        className={`pill border transition disabled:opacity-50 ${
                          done
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/[0.04] text-ink-400 hover:bg-white/[0.08]"
                        }`}
                      >
                        {done && <IconCheck width={11} height={11} />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          <Section title="Follow-uplar">
            <div className="mb-3 flex gap-2">
              <input type="datetime-local" className="input" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} />
              <input className="input" placeholder="Izoh" value={followupNote} onChange={(e) => setFollowupNote(e.target.value)} />
              <button
                className="btn-primary shrink-0"
                disabled={busy || !followupDate}
                onClick={() =>
                  runAction(async () => {
                    const r = await supabase.rpc("create_seller_lead_followup", {
                      p_lead_id: leadId,
                      p_due_at: new Date(followupDate).toISOString(),
                      p_note: followupNote || null,
                    });
                    if (!r.error) {
                      setFollowupDate("");
                      setFollowupNote("");
                    }
                    return r;
                  })
                }
              >
                Qo'shish
              </button>
            </div>
            <div className="space-y-2">
              {(detail.followups || []).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <div>
                    <span className={f.done ? "text-ink-500 line-through" : "text-ink-100"}>{new Date(f.due_at).toLocaleString("uz-UZ")}</span>
                    {f.note && <span className="ml-2 text-ink-400">— {f.note}</span>}
                  </div>
                  {!f.done && (
                    <button
                      className="text-xs font-medium text-brand-300 hover:underline"
                      disabled={busy}
                      onClick={() => runAction(() => supabase.rpc("complete_seller_lead_followup", { p_followup_id: f.id, p_note: null }))}
                    >
                      Bajarildi
                    </button>
                  )}
                </div>
              ))}
              {(detail.followups || []).length === 0 && <div className="text-sm text-ink-500">Follow-up yo'q</div>}
            </div>
          </Section>

          <Section title="E'tirozlar">
            <div className="mb-3 space-y-2 rounded-lg border border-white/10 p-3">
              <div className="flex gap-2">
                <select className="input w-40 shrink-0" value={objectionType} onChange={(e) => setObjectionType(e.target.value as any)}>
                  {OBJECTION_TYPES.map((o) => (
                    <option key={o} value={o}>
                      {OBJECTION_LABELS_UZ[o]}
                    </option>
                  ))}
                </select>
                <input className="input" placeholder="Seller nima dedi..." value={objectionNote} onChange={(e) => setObjectionNote(e.target.value)} />
              </div>
              <input className="input" placeholder="Manager javobi" value={objectionResponse} onChange={(e) => setObjectionResponse(e.target.value)} />
              <div className="flex gap-2">
                <input className="input" placeholder="Seller reaksiyasi" value={objectionReaction} onChange={(e) => setObjectionReaction(e.target.value)} />
                <select className="input w-40 shrink-0" value={objectionOutcome} onChange={(e) => setObjectionOutcome(e.target.value)}>
                  <option value="">Natija — hali noaniq</option>
                  {OBJECTION_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {OBJECTION_OUTCOME_LABELS_UZ[o]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() =>
                  runAction(async () => {
                    const r = await supabase.rpc("add_seller_lead_objection", {
                      p_lead_id: leadId,
                      p_objection_type: objectionType,
                      p_note: objectionNote || null,
                      p_manager_response: objectionResponse || null,
                      p_seller_reaction: objectionReaction || null,
                      p_outcome: objectionOutcome || null,
                    });
                    if (!r.error) {
                      setObjectionNote("");
                      setObjectionResponse("");
                      setObjectionReaction("");
                      setObjectionOutcome("");
                      const objRes = await supabase
                        .from("seller_lead_objections")
                        .select("id, objection_type, note, manager_response, seller_reaction, outcome, created_at")
                        .eq("lead_id", leadId)
                        .order("created_at", { ascending: false });
                      setObjections(objRes.data || []);
                    }
                    return r;
                  })
                }
              >
                Qo'shish
              </button>
            </div>
            <div className="space-y-2">
              {objections.map((o) => (
                <div key={o.id} className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink-100">{OBJECTION_LABELS_UZ[o.objection_type as keyof typeof OBJECTION_LABELS_UZ] || o.objection_type}</span>
                    {o.outcome && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          o.outcome === "interested" ? "bg-emerald-500/10 text-emerald-400" : o.outcome === "not_interested" ? "bg-red-500/10 text-red-400" : "bg-white/[0.06] text-ink-400"
                        }`}
                      >
                        {OBJECTION_OUTCOME_LABELS_UZ[o.outcome as keyof typeof OBJECTION_OUTCOME_LABELS_UZ] || o.outcome}
                      </span>
                    )}
                  </div>
                  {o.note && <div className="mt-1 text-ink-300">Seller: {o.note}</div>}
                  {o.manager_response && <div className="mt-1 text-ink-300">Manager: {o.manager_response}</div>}
                  {o.seller_reaction && <div className="mt-1 text-ink-400">Reaksiya: {o.seller_reaction}</div>}
                  <div className="mt-1 text-xs text-ink-500">{new Date(o.created_at).toLocaleString("uz-UZ")}</div>
                </div>
              ))}
              {objections.length === 0 && <div className="text-sm text-ink-500">E'tiroz yo'q</div>}
            </div>
          </Section>

          <Section title="Izohlar">
            <div className="mb-3 flex gap-2">
              <input className="input" placeholder="Izoh yozing..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button
                className="btn-primary shrink-0"
                disabled={busy || !noteText.trim()}
                onClick={() =>
                  runAction(async () => {
                    const r = await supabase.rpc("add_seller_lead_note", { p_lead_id: leadId, p_note: noteText.trim() });
                    if (!r.error) setNoteText("");
                    return r;
                  })
                }
              >
                Qo'shish
              </button>
            </div>
            <div className="space-y-2">
              {(detail.notes || []).map((n: any) => (
                <div key={n.id} className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <div className="text-ink-100">{n.note}</div>
                  <div className="mt-1 text-xs text-ink-500">
                    {n.author_name} · {new Date(n.created_at).toLocaleString("uz-UZ")}
                  </div>
                </div>
              ))}
              {(detail.notes || []).length === 0 && <div className="text-sm text-ink-500">Izoh yo'q</div>}
            </div>
          </Section>

          <Section title="Status tarixi">
            <div className="space-y-2">
              {(detail.status_history || []).map((h: any) => (
                <div key={h.id} className="text-sm text-ink-300">
                  <span className="font-medium text-white">{h.changed_by_name || "Tizim"}</span>{" "}
                  {h.old_status ? `${LEAD_STATUS_LABELS_UZ[h.old_status as keyof typeof LEAD_STATUS_LABELS_UZ] || h.old_status} → ` : ""}
                  {LEAD_STATUS_LABELS_UZ[h.new_status as keyof typeof LEAD_STATUS_LABELS_UZ] || h.new_status}
                  <span className="ml-2 text-xs text-ink-500">{new Date(h.created_at).toLocaleString("uz-UZ")}</span>
                </div>
              ))}
              {(detail.status_history || []).length === 0 && <div className="text-sm text-ink-500">Tarix yo'q</div>}
            </div>
          </Section>

          <Section title="Faoliyat jurnali">
            <div className="space-y-2">
              {(detail.activity || []).map((a: any) => (
                <div key={a.id} className="text-sm text-ink-300">
                  <span className="font-medium text-white">{a.actor_name || "Tizim"}</span> {a.action_type}
                  {a.detail && <span className="text-ink-400"> — {a.detail}</span>}
                  <span className="ml-2 text-xs text-ink-500">{new Date(a.created_at).toLocaleString("uz-UZ")}</span>
                </div>
              ))}
              {(detail.activity || []).length === 0 && <div className="text-sm text-ink-500">Faoliyat yo'q</div>}
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <CommsBox leadId={leadId} phone={lead.phone} />

          <Section title="AI Agentlar">
            <div className="flex flex-wrap gap-2">
              {LEAD_AGENTS.map((a) => (
                <button
                  key={a.key}
                  className="pill border border-white/10 bg-white/[0.04] text-ink-200 hover:bg-white/[0.08] disabled:opacity-50"
                  disabled={aiBusy === a.key}
                  onClick={() => runLeadAgent(a.key)}
                  title={a.description}
                >
                  <IconSparkles width={12} height={12} className="text-brand-300" />
                  {aiBusy === a.key ? "..." : a.label}
                </button>
              ))}
            </div>
            {aiError && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{aiError}</div>
            )}
            {aiOutput && (
              <div className="mt-3 max-h-80 overflow-y-auto whitespace-pre-line rounded-lg border border-brand-500/20 bg-brand-500/[0.06] px-3 py-2 text-xs text-ink-100">
                {aiOutput.text}
              </div>
            )}
          </Section>
          {(detail.tags || []).length > 0 && (
            <Section title="Teglar">
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((t: any) => (
                  <span key={t.id} className="rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: (t.color || "#e2e8f0") + "33", color: t.color || "#334155" }}>
                    {t.name}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><LeadDetailInner profile={profile} /></Shell>}</AuthGate>;
}
