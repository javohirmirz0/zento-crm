"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { IconSparkles } from "./icons";

const EXAMPLES = [
  "Bugun kimga qo'ng'iroq qilishim kerak?",
  "Eng ko'p uchragan e'tiroz nima?",
  "Qaysi sellerlarni Javohirga o'tkazish kerak?",
];

export function AskAiBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.answer || "Xatolik yuz berdi");
      } else {
        setAnswer(json.answer);
      }
    } catch {
      setError("Tarmoq xatoligi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <IconSparkles width={16} height={16} className="text-brand-600" />
        AI'dan so'rang
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          className="input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Masalan: bugun kimga qo'ng'iroq qilishim kerak?"
        />
        <button className="btn-primary shrink-0" disabled={loading}>
          {loading ? "..." : "So'rash"}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuestion(ex);
              ask(ex);
            }}
            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
          >
            {ex}
          </button>
        ))}
      </div>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {answer && <div className="mt-3 whitespace-pre-line rounded-lg bg-brand-50 px-3 py-2 text-sm text-slate-800">{answer}</div>}
    </div>
  );
}
