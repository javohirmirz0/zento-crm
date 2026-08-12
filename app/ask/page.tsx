"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthGate } from "@/components/AuthGate";
import { Shell } from "@/components/Shell";
import { IconChat, IconSparkles } from "@/components/icons";
import { Profile } from "@/lib/types";

const FUNCTIONS_URL = "https://ilbyzbmridyxxblclpyf.supabase.co/functions/v1/crm-ai-query";

const EXAMPLES = [
  "Bugun kimga qo'ng'iroq qilishim kerak?",
  "Diqqat talab qiladigan buyurtmalar bormi?",
  "Oxirgi 30 kunlik moliyaviy holat qanday?",
  "Eng ko'p uchragan e'tiroz nima?",
];

type ChatMessage = { role: "user" | "assistant" | "error"; text: string };

function AskInner({ profile }: { profile: Profile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setQuestion("");
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(FUNCTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setMessages((prev) => [...prev, { role: "error", text: json.answer || "Xatolik yuz berdi" }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: json.answer }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "Tarmoq xatoligi" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Ask ZENTO</h1>
        <p className="text-sm text-ink-400">
          CRM, buyurtmalar, logistika, moliya va avtomatlashtirish bo'yicha tabiiy tilda savol bering — javob faqat real ma'lumotga asoslanadi.
        </p>
      </div>

      <div className="card flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-ink-500">
              <IconChat width={28} height={28} className="mb-3 text-ink-600" />
              <p className="text-sm">Savol bering — masalan:</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => ask(ex)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-300 hover:bg-white/[0.05]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-brand-gradient text-white"
                      : m.role === "error"
                      ? "border border-red-500/20 bg-red-500/10 text-red-400"
                      : "border border-white/[0.06] bg-white/[0.03] text-ink-100"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="mb-1 flex items-center gap-1.5 text-xs text-brand-300">
                      <IconSparkles width={12} height={12} /> ZENTO
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-ink-400">
                  Yozmoqda...
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex gap-2 border-t border-white/[0.06] p-3"
        >
          <input
            className="input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Savolingizni yozing..."
            disabled={loading}
          />
          <button className="btn-primary shrink-0" disabled={loading || !question.trim()}>
            Yuborish
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AskPage() {
  return (
    <AuthGate>
      {(profile) => (
        <Shell profile={profile}>
          <AskInner profile={profile} />
        </Shell>
      )}
    </AuthGate>
  );
}
