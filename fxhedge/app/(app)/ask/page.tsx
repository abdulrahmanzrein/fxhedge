"use client";
import { useState, useRef, useEffect } from "react";
import { MOCK_PROFILE } from "@/lib/fixtures";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

const SUGGESTED = [
  "What is murabaha and can I use it to hedge my EUR invoice?",
  "Is using a forward contract permissible in Islamic finance?",
  "What are my halal alternatives to a currency swap?",
  "How does a wa'd-based FX arrangement work?",
];

export default function AskPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: q,
          pair: `${MOCK_PROFILE.supplier_currency}-${MOCK_PROFILE.home_currency}`,
          amount: MOCK_PROFILE.invoice_amount,
        }),
      });
      const data = await res.json();
      if (data.error || !data.answer) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "The assistant is unavailable right now. For Islamic-finance questions about your payment, please consult a qualified Sharia advisor.", error: true },
        ]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Could not reach the assistant. Check your connection and try again.", error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>
      <div className="mb-5 shrink-0">
        <h1 className="font-serif text-3xl font-normal text-[var(--color-fg)]">Ask HalalFlow</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Islamic finance questions about your EUR/CAD payment · General education only
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="space-y-3 py-4">
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Suggested questions</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left text-sm text-[var(--color-fg)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-muted-fg)] mt-4">
              This assistant answers Islamic-finance education questions related to your payment. It does not give fatwas, financial advice, or execute any transactions.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3 mt-0.5"
                style={{ background: "var(--color-primary)" }}
              >
                H
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "text-white"
                  : m.error
                  ? "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-fg)] italic"
                  : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-fg)]"
              }`}
              style={m.role === "user" ? { background: "var(--color-primary)" } : {}}
            >
              {m.text.split("\n").map((line, j) => (
                <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mr-3"
              style={{ background: "var(--color-primary)" }}
            >
              H
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full animate-bounce"
                    style={{ background: "var(--color-muted-fg)", animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-[var(--color-border)]">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Islamic finance options for your payment…"
            disabled={loading}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] outline-none focus:border-[var(--color-primary)] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-primary)" }}
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-[var(--color-muted-fg)]">
          General education only · Not a fatwa · Not financial advice
        </p>
      </div>
    </div>
  );
}
