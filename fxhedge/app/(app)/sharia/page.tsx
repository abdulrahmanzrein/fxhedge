"use client";
import { useState } from "react";
import { Markdown } from "@/components/markdown";

const options = [
  {
    id: "natural",
    title: "Natural hedge",
    desc: "Match your income and expenses in the same currency. Zero cost, zero riba exposure. Best if you already earn in your supplier's currency.",
    status: "halal" as const,
  },
  {
    id: "murabaha",
    title: "Murabaha (cost-plus sale)",
    desc: "Bank buys the currency at today's rate and sells it to you at a fixed mark-up. Widely accepted. Avoid if the mark-up is not disclosed upfront.",
    status: "halal" as const,
  },
  {
    id: "wad",
    title: "Wa'd (unilateral promise)",
    desc: "A promise — not a contract — to buy currency at a future date. Scholarly debate exists: some scholars accept it, others see binding wa'd as equivalent to a forward. Check your madhab.",
    status: "debated" as const,
  },
  {
    id: "forward",
    title: "Conventional forward",
    desc: "A contract to exchange currency at a fixed future rate. Contains an element of gharar (uncertainty). Generally not permissible under Sharia.",
    status: "caution" as const,
  },
];

const statusStyle = {
  halal:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  debated: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  caution: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const suggestedQuestions = [
  "What is the difference between wa'd and a forward contract?",
  "Is murabaha available for FX in Canada?",
  "How can I use a natural hedge for EUR-CAD?",
  "What do AAOIFI standards say about FX hedging?",
];

const PLACEHOLDER_ANSWER = `**Natural hedging** is the most straightforward halal approach. If your business earns revenue in EUR, you already hold EUR to pay your supplier — no currency exchange needed, and no riba exposure.

For businesses that must convert, **murabaha** is widely accepted by Islamic scholars and available through some Islamic banks in Canada and the UK. The bank buys at spot and sells to you at a disclosed mark-up — no interest involved.

**Wa'd** is more nuanced. A *unilateral* promise (one party promises, the other is not bound) is generally acceptable. A *bilateral* binding wa'd starts to resemble a conventional forward and is contested.

> This is general education grounded in cited scholarly sources, not a fatwa. Consult a qualified Islamic finance scholar for a ruling specific to your situation.`;

export default function ShariaPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    setQuestion(q);
    setLoading(true);
    setAnswer(null);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setAnswer(PLACEHOLDER_ANSWER);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-fg)]">Sharia options</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-fg)]">
          Islamic finance alternatives to conventional FX hedging · grounded in cited sources
        </p>
      </div>

      {/* Options panel */}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map(opt => (
          <div key={opt.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-[var(--color-fg)]">{opt.title}</h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyle[opt.status]}`}>
                {opt.status}
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted-fg)]">{opt.desc}</p>
          </div>
        ))}
      </div>

      {/* Chatbot */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="font-semibold text-[var(--color-fg)] mb-1">Ask the Islamic finance assistant</h2>
        <p className="text-xs text-[var(--color-muted-fg)] mb-4">
          Grounded in cited scholarly sources. Never issues a fatwa. Always surfaces scholarly disagreement.
        </p>

        {/* Suggested questions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs text-[var(--color-fg)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <label htmlFor="sharia-question" className="sr-only">Question for Islamic finance assistant</label>
          <input
            id="sharia-question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && question.trim() && ask(question.trim())}
            placeholder="Ask a question about Islamic finance & FX…"
            className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <button
            onClick={() => question.trim() && ask(question.trim())}
            disabled={loading || !question.trim()}
            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "…" : "Ask"}
          </button>
        </div>

        {/* Answer — live region always in DOM so screen readers pick up changes */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {loading && (
            <div className="mt-4 space-y-2" aria-label="Loading answer…">
              <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--color-muted)]" />
              <div className="h-3 w-full animate-pulse rounded bg-[var(--color-muted)]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--color-muted)]" />
            </div>
          )}
          {answer && !loading && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <Markdown>{answer}</Markdown>
              <p className="mt-3 text-[10px] text-[var(--color-muted-fg)]">
                This is general education, not a fatwa or financial advice. Consult a qualified scholar for a ruling specific to your situation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
