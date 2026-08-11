"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { IconClose } from "@/components/icons";
import { PRIORITIES, PRIORITY_LABELS_UZ, SELLS_ON_OPTIONS, SELLS_ON_LABELS_UZ, FULFILLMENT_MODELS, FULFILLMENT_MODEL_LABELS_UZ } from "@/lib/types";

export function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [skuCount, setSkuCount] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [sellsOn, setSellsOn] = useState<string[]>([]);
  const [hasWarehouse, setHasWarehouse] = useState<boolean | null>(null);
  const [fulfillmentModel, setFulfillmentModel] = useState("unknown");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<string | null>(null);

  function toggleSellsOn(v: string) {
    setSellsOn((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  async function checkDuplicate() {
    if (!phone && !companyName) return;
    const { data } = await supabase.rpc("check_seller_lead_duplicate", {
      p_phone: phone || null,
      p_company_name: companyName || null,
    });
    if (data && data.length > 0) {
      setDupWarning(`Diqqat: shunga o'xshash lead allaqachon mavjud — "${data[0].company_name}" (${data[0].status})`);
    } else {
      setDupWarning(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim() || !phone.trim()) {
      setError("Kompaniya, kontakt shaxs va telefon majburiy");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase.rpc("create_seller_lead", {
      p_company_name: companyName.trim(),
      p_contact_person: contactPerson.trim(),
      p_phone: phone.trim(),
      p_telegram: telegram.trim() || null,
      p_instagram: instagram.trim() || null,
      p_website: website.trim() || null,
      p_category_id: null,
      p_source_id: null,
      p_estimated_sku_count: skuCount ? Number(skuCount) : null,
      p_estimated_monthly_sales: null,
      p_price_range: null,
      p_location: location.trim() || null,
      p_priority: priority,
      p_assigned_manager: null,
      p_note: note.trim() || null,
      p_sells_on: sellsOn,
      p_has_warehouse: hasWarehouse,
      p_fulfillment_model: fulfillmentModel,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Yangi lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <IconClose width={18} height={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Kompaniya nomi *</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={checkDuplicate} required />
          </div>
          <div>
            <label className="label">Kontakt shaxs *</label>
            <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telefon *</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={checkDuplicate} required placeholder="+998..." />
            </div>
            <div>
              <label className="label">Joylashuv</label>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          {dupWarning && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{dupWarning}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Telegram</label>
              <input className="input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
            </div>
            <div>
              <label className="label">Instagram</label>
              <input className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" />
            </div>
          </div>
          <div>
            <label className="label">Veb-sayt</label>
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Taxminiy SKU soni</label>
              <input className="input" type="number" min={0} value={skuCount} onChange={(e) => setSkuCount(e.target.value)} />
            </div>
            <div>
              <label className="label">Prioritet</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS_UZ[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Qayerda sotadi</label>
            <div className="flex flex-wrap gap-2">
              {SELLS_ON_OPTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSellsOn(s)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    sellsOn.includes(s) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"
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
                value={hasWarehouse === null ? "" : hasWarehouse ? "yes" : "no"}
                onChange={(e) => setHasWarehouse(e.target.value === "" ? null : e.target.value === "yes")}
              >
                <option value="">Noma'lum</option>
                <option value="yes">Ha</option>
                <option value="no">Yo'q</option>
              </select>
            </div>
            <div>
              <label className="label">Fulfillment</label>
              <select className="input" value={fulfillmentModel} onChange={(e) => setFulfillmentModel(e.target.value)}>
                {FULFILLMENT_MODELS.map((f) => (
                  <option key={f} value={f}>
                    {FULFILLMENT_MODEL_LABELS_UZ[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Izoh</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Bekor qilish
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
