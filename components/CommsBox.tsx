"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function CommsBox({ leadId, phone }: { leadId: string; phone: string | null }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    const text = message.trim();
    if (!text || !phone) return;
    setSending(true);
    setResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead_id: leadId, message: text }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const errMap: Record<string, string> = {
          quota_exceeded: "Kunlik SMS limiti tugadi",
          no_phone: "Telefon raqami yo'q",
          message_too_long: "Xabar juda uzun",
        };
        setResult({ ok: false, text: errMap[json.error] || "Yuborilmadi" });
      } else {
        setResult({ ok: true, text: "SMS yuborildi" });
        setMessage("");
      }
    } catch {
      setResult({ ok: false, text: "Tarmoq xatoligi" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="text-sm font-medium text-slate-800">SMS yuborish</div>
      {!phone && <div className="mt-1 text-xs text-red-600">Telefon raqami kiritilmagan</div>}
      <textarea
        className="input mt-2"
        rows={3}
        maxLength={480}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Xabar matni..."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">{message.length}/480</span>
        <button className="btn-primary" onClick={send} disabled={sending || !message.trim() || !phone}>
          {sending ? "Yuborilmoqda..." : "Yuborish"}
        </button>
      </div>
      {result && (
        <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {result.text}
        </div>
      )}
    </div>
  );
}
