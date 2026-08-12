"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { EmployeeShell } from "@/components/EmployeeShell";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/lib/types";

const DOC_TYPE_LABELS_UZ: Record<string, string> = {
  contract: "Mehnat shartnomasi",
  nda: "Maxfiylik shartnomasi (NDA)",
  policy_ack: "Ichki qoidalar",
  other: "Boshqa",
};

interface MyDocument {
  document_id: string;
  doc_type: string;
  title: string;
  current_version_id: string | null;
  version_label: string | null;
  content: string | null;
  version_created_at: string | null;
  accepted: boolean;
  accepted_at: string | null;
}

function DocumentsInner({ profile }: { profile: Profile }) {
  const [docs, setDocs] = useState<MyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("my_documents");
    if (error) setError(error.message);
    else setDocs((data as MyDocument[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [profile.id]);

  async function accept(versionId: string) {
    setAccepting(versionId);
    const { error } = await supabase.rpc("accept_document", { p_document_version_id: versionId });
    setAccepting(null);
    if (!error) load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Hujjatlarim</h1>
        <p className="text-sm text-ink-400">Shartnoma va boshqa rasmiy hujjatlaringiz, versiyalar tarixi bilan.</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Yuklanmoqda...</p>
      ) : error ? (
        <p className="text-sm text-red-400">Xatolik: {error}</p>
      ) : docs.length === 0 ? (
        <div className="card p-5">
          <p className="text-sm text-ink-400">Sizga hali hujjat biriktirilmagan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => {
            const isOpen = openId === d.document_id;
            return (
              <div key={d.document_id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(isOpen ? null : d.document_id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="pill border border-white/10 bg-white/[0.03] text-ink-400">
                        {DOC_TYPE_LABELS_UZ[d.doc_type] || d.doc_type}
                      </span>
                      <span className="truncate text-sm font-medium text-white">{d.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-ink-500">
                      {d.version_label}
                      {d.version_created_at && ` · ${new Date(d.version_created_at).toLocaleDateString("uz-UZ")}`}
                    </div>
                  </div>
                  <span
                    className={`pill shrink-0 border ${
                      d.accepted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {d.accepted ? "Qabul qilingan" : "Qabul qilinmagan"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.06] p-4">
                    <div className="whitespace-pre-wrap rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-ink-200">
                      {d.content || "Matn yo'q"}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {d.accepted ? (
                        <span className="text-xs text-ink-500">
                          {d.accepted_at && `Qabul qilingan: ${new Date(d.accepted_at).toLocaleString("uz-UZ")}`}
                        </span>
                      ) : (
                        d.current_version_id && (
                          <button
                            onClick={() => accept(d.current_version_id!)}
                            disabled={accepting === d.current_version_id}
                            className="btn-primary"
                          >
                            {accepting === d.current_version_id ? "Yuborilmoqda..." : "Men bu hujjatni qabul qilaman"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WorkDocumentsPage() {
  return (
    <AuthGate>
      {(profile) => (
        <EmployeeShell profile={profile}>
          <DocumentsInner profile={profile} />
        </EmployeeShell>
      )}
    </AuthGate>
  );
}
