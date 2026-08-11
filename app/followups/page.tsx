"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { Profile } from "@/lib/types";

function FollowupsInner({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("seller_lead_followups_due", { p_manager: null });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setRows(data || []);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function complete(id: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("complete_seller_lead_followup", { p_followup_id: id, p_note: null });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  const overdue = rows.filter((r) => r.overdue);
  const today = rows.filter((r) => !r.overdue);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Follow-uplar</h1>
        <p className="text-sm text-slate-500">Bugungi va muddati o'tgan follow-uplar</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-slate-500">Yuklanmoqda...</div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-red-700">Muddati o'tgan ({overdue.length})</h2>
              <div className="space-y-2">
                {overdue.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm">
                    <Link href={`/leads/${f.lead_id}`} className="font-medium text-slate-800 hover:text-brand-600">
                      {f.company_name}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-red-600">{new Date(f.due_at).toLocaleString("uz-UZ")}</span>
                      <button className="btn-secondary" disabled={busyId === f.id} onClick={() => complete(f.id)}>
                        Bajarildi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Bugun / yaqin kunlarda ({today.length})</h2>
            <div className="space-y-2">
              {today.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <Link href={`/leads/${f.lead_id}`} className="font-medium text-slate-800 hover:text-brand-600">
                    {f.company_name}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{new Date(f.due_at).toLocaleString("uz-UZ")}</span>
                    {f.note && <span className="text-slate-400">{f.note}</span>}
                    <button className="btn-secondary" disabled={busyId === f.id} onClick={() => complete(f.id)}>
                      Bajarildi
                    </button>
                  </div>
                </div>
              ))}
              {today.length === 0 && <div className="text-sm text-slate-400">Yo'q</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FollowupsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><FollowupsInner profile={profile} /></Shell>}</AuthGate>;
}
