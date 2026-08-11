"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { IconClose } from "@/components/icons";

export function DealDetailModal({ dealId, onClose, onChanged }: { dealId: string; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("crm_deal_detail", { p_deal: dealId });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setData(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function addActivity() {
    if (!note.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("crm_add_deal_activity", { p_deal: dealId, p_type: "note", p_note: note.trim() });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setNote("");
    load();
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-ink-850 border border-white/10 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{data?.deal?.title || "Deal"}</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-300">
            <IconClose width={18} height={18} />
          </button>
        </div>
        {loading && <div className="text-sm text-ink-500">Yuklanmoqda...</div>}
        {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
        {data?.deal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-ink-500">Kontakt</div>
                <div className="text-white">{data.deal.contact?.name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Telefon</div>
                <div className="text-white">{data.deal.contact?.phone || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Egasi</div>
                <div className="text-white">{data.deal.owner_name || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-ink-500">Qiymat</div>
                <div className="text-white">{data.deal.value ?? "-"}</div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-white">Faoliyat</div>
              <div className="flex gap-2">
                <input className="input" placeholder="Izoh qo'shish..." value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn-primary shrink-0" onClick={addActivity} disabled={busy}>
                  Qo'shish
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {(data.activities || []).map((a: any) => (
                  <div key={a.id} className="rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                    <div className="text-ink-100">{a.note}</div>
                    <div className="mt-1 text-xs text-ink-500">
                      {a.created_by_name} · {new Date(a.created_at).toLocaleString("uz-UZ")}
                    </div>
                  </div>
                ))}
                {(data.activities || []).length === 0 && <div className="text-sm text-ink-500">Faoliyat yo'q</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
