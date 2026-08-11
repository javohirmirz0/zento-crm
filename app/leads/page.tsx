"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { IconPlus, IconSearch } from "@/components/icons";
import { NewLeadModal } from "./NewLeadModal";
import { LEAD_STATUSES, LEAD_STATUS_LABELS_UZ, PRIORITIES, PRIORITY_LABELS_UZ, Profile, SellerTier, SELLER_TIER_LABELS_UZ } from "@/lib/types";

const TIER_COLORS: Record<SellerTier, string> = {
  A: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  B: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  C: "border-white/10 bg-white/[0.04] text-ink-300",
};
function TierBadge({ tier }: { tier: SellerTier | null }) {
  if (!tier) return <span className="text-xs text-ink-600">-</span>;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_COLORS[tier]}`}>
      {SELLER_TIER_LABELS_UZ[tier]}
    </span>
  );
}

const PAGE_SIZE = 25;

function LeadsInner({ profile }: { profile: Profile }) {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("search_seller_leads", {
      p_search: search || null,
      p_status: status || null,
      p_priority: priority || null,
      p_manager: null,
      p_source_id: null,
      p_tag_id: null,
      p_page: page,
      p_page_size: PAGE_SIZE,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setError(null);
    setRows(data?.rows || []);
    setTotal(data?.total || 0);
    setLoading(false);
  }, [search, status, priority, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Leadlar</h1>
          <p className="text-sm text-ink-400">Jami {total} ta lead</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <IconPlus width={16} height={16} /> Yangi lead
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 card p-3">
        <div className="relative flex-1 min-w-[220px]">
          <IconSearch width={16} height={16} className="pointer-events-none absolute left-3 top-2.5 text-ink-500" />
          <input
            className="input pl-9"
            placeholder="Kompaniya, telefon yoki kontakt..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Barcha statuslar</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS_UZ[s]}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={priority}
          onChange={(e) => {
            setPage(1);
            setPriority(e.target.value);
          }}
        >
          <option value="">Barcha prioritetlar</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS_UZ[p]}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs text-ink-400">
            <tr>
              <th className="px-4 py-2.5">Kompaniya</th>
              <th className="px-4 py-2.5">Kontakt</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Tier</th>
              <th className="px-4 py-2.5">Prioritet</th>
              <th className="px-4 py-2.5">Menejer</th>
              <th className="px-4 py-2.5">Skor</th>
              <th className="px-4 py-2.5">Keyingi follow-up</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink-500">
                  Leadlar topilmadi
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/[0.06] hover:bg-white/[0.05]">
                <td className="px-4 py-2.5">
                  <Link href={`/leads/${r.id}`} className="font-medium text-white hover:text-brand-300">
                    {r.company_name}
                  </Link>
                  <div className="text-xs text-ink-500">{r.city || r.location}</div>
                </td>
                <td className="px-4 py-2.5 text-ink-300">
                  <div>{r.contact_person}</div>
                  <div className="text-xs text-ink-500">{r.phone}</div>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-2.5">
                  <TierBadge tier={r.seller_tier} />
                </td>
                <td className="px-4 py-2.5">
                  <PriorityBadge priority={r.priority} />
                </td>
                <td className="px-4 py-2.5 text-ink-300">{r.manager_name || "-"}</td>
                <td className="px-4 py-2.5">
                  <ScoreBadge score={r.lead_score || 0} />
                </td>
                <td className="px-4 py-2.5 text-ink-300">{r.next_followup_at ? new Date(r.next_followup_at).toLocaleDateString("uz-UZ") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-400">
          <span>
            {page} / {totalPages} sahifa
          </span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Oldingi
            </button>
            <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Keyingi
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <NewLeadModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return <AuthGate>{(profile) => <Shell profile={profile}><LeadsInner profile={profile} /></Shell>}</AuthGate>;
}
