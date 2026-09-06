"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clsx } from "clsx";

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
  halal: "bg-positive-soft text-positive",
  debated: "bg-warning-soft text-warning",
  caution: "bg-negative-soft text-negative",
} as const;

const suggestedQuestions = [
  "What is the difference between wa'd and a forward contract?",
  "Is murabaha available for FX in Canada?",
  "How can I use a natural hedge for EUR-CAD?",
  "What do AAOIFI standards say about FX hedging?",
];

/**
 * Sharia options + the Islamic finance assistant, grounded in the real
 * /api/ask endpoint (server-side Claude, cited sources, never a fatwa).
 */
export default function ShariaPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    setQuestion(q);
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const body = (await res.json()) as { answer?: string; error?: boolean };
      if (!res.ok || body.error || !body.answer) {
        setError("The assistant is unavailable right now. Try again shortly.");
      } else {
        setAnswer(body.answer);
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          Sharia options
        </h1>
        <p className="mt-1 text-sm text-muted">
          Islamic finance alternatives to conventional FX hedging · grounded in
          cited sources
        </p>
      </header>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((opt) => (
          <Panel key={opt.id} className="p-5" as="article">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-semibold text-primary">{opt.title}</h3>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                  statusStyle[opt.status],
                )}
              >
                {opt.status}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted">{opt.desc}</p>
          </Panel>
        ))}
      </div>

      {/* Assistant */}
      <Panel className="p-5">
        <h2 className="font-semibold text-primary">
          Ask the Islamic finance assistant
        </h2>
        <p className="mb-4 text-xs text-muted">
          Grounded in cited scholarly sources. Never issues a fatwa. Always
          surfaces scholarly disagreement.
        </p>

        {/* Suggested questions */}
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <Button
              key={q}
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
              onClick={() => ask(q)}
            >
              {q}
            </Button>
          ))}
        </div>

        {/* Input */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) ask(question.trim());
          }}
        >
          <label htmlFor="sharia-question" className="sr-only">
            Question for Islamic finance assistant
          </label>
          <Input
            id="sharia-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about Islamic finance & FX…"
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? "…" : "Ask"}
          </Button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-xs text-negative">
            {error}
          </p>
        )}

        {/* Answer — live region always in DOM so screen readers pick up changes */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {loading && (
            <div className="mt-4 space-y-2" aria-label="Loading answer…">
              <div className="h-3 w-3/4 animate-pulse rounded bg-surface-offset" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-offset" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-offset" />
            </div>
          )}
          {answer && !loading && (
            <div className="mt-4 border-t border-line pt-4">
              <Markdown>{answer}</Markdown>
              <p className="mt-3 text-[10px] text-muted">
                This is general education, not a fatwa or financial advice.
                Consult a qualified scholar for a ruling specific to your
                situation.
              </p>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
