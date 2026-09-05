import "server-only";

/**
 * lib/fx.ts — FX data clients (server-only).
 *
 * Sources (both keyless, per PRD FR-1):
 *  - Frankfurter (ECB reference rates): latest + historical series
 *  - Bank of Canada Valet: cross-check / fallback
 *
 * Invariants (architecture.md):
 *  - Never predict direction — we only report reference rates and
 *    historical move magnitudes.
 *  - Every rate carries its source label; rates are indicative,
 *    not bookable.
 *  - Parsing/validation happens at the boundary before data enters lib/.
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";
const BOC_BASE = "https://www.bankofcanada.ca/valet";

/** Revalidate windows (seconds) — reference rates update ~once daily. */
export const LATEST_REVALIDATE = 60 * 30; // 30 min
export const HISTORY_REVALIDATE = 60 * 60 * 12; // 12 h

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit tests)
// ---------------------------------------------------------------------------

/** Parse "EUR-CAD" -> { from: "EUR", to: "CAD" }. Null when malformed. */
export function parsePair(pair: string): { from: string; to: string } | null {
  const m = /^([A-Za-z]{3})-([A-Za-z]{3})$/.exec(pair.trim());
  if (!m) return null;
  return { from: m[1].toUpperCase(), to: m[2].toUpperCase() };
}

/** "2026-03-05" minus 21 days -> "2026-02-12" (UTC arithmetic, ISO in/out). */
export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Today in ISO date (UTC) — tests seed dates, prod uses this. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Frankfurter historical shape -> sorted [{date, rate}] for one currency. */
export function toDailyRates(
  raw: Record<string, Record<string, number>>,
  target: string,
): { date: string; rate: number }[] {
  return Object.entries(raw)
    .filter(([, rates]) => typeof rates?.[target] === "number")
    .map(([date, rates]) => ({ date, rate: rates[target] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Forward-looking % moves over `windowDays` between consecutive observations.
 * These are historical *magnitudes* — the basis for risk ranges, never a
 * direction prediction (challenge rule).
 */
export function computeWorstMoves(
  series: { date: string; rate: number }[],
  windowDays: number,
): { windows: number; moves: number[]; worst5pctMove: number; worstOnRecord: number } {
  const moves: number[] = [];
  for (let i = 0; i + windowDays < series.length; i += windowDays) {
    const start = series[i];
    const end = series[i + windowDays];
    if (start.rate <= 0) continue;
    moves.push(((end.rate - start.rate) / start.rate) * 100);
  }
  if (moves.length === 0) {
    return { windows: 0, moves, worst5pctMove: Number.NaN, worstOnRecord: Number.NaN };
  }
  const byAbs = [...moves].sort((a, b) => Math.abs(b) - Math.abs(a));
  const worst5pctMove = byAbs[Math.max(0, Math.floor(byAbs.length * 0.05) - 1)];
  const worstOnRecord = byAbs[0];
  return { windows: moves.length, moves, worst5pctMove, worstOnRecord };
}

// ---------------------------------------------------------------------------
// Frankfurter clients
// ---------------------------------------------------------------------------

export interface LatestResult {
  rate: number;
  source: string;
  date: string;
}

/** Latest ECB reference rate for from->to. */
export async function fetchLatestRate(
  from: string,
  to: string,
): Promise<LatestResult> {
  const url = `${FRANKFURTER_BASE}/latest?from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: LATEST_REVALIDATE } });
  if (!res.ok) throw new Error(`Frankfurter latest failed: ${res.status}`);
  const json = (await res.json()) as { date?: string; rates?: Record<string, number> };
  const rate = json.rates?.[to];
  if (typeof rate !== "number") throw new Error(`Frankfurter latest: missing ${to}`);
  return { rate, source: "ECB / Frankfurter", date: json.date ?? todayIso() };
}

/** Historical rate on a specific ISO date (the invoice-day rate). */
export async function fetchRateOnDate(
  from: string,
  to: string,
  isoDate: string,
): Promise<number> {
  const url = `${FRANKFURTER_BASE}/${isoDate}?from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: HISTORY_REVALIDATE } });
  if (!res.ok) throw new Error(`Frankfurter historical failed: ${res.status}`);
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rate = json.rates?.[to];
  if (typeof rate !== "number") {
    throw new Error(`Frankfurter historical: no ${to} rate on ${isoDate}`);
  }
  return rate;
}

/** Daily series from start..end dates. */
export async function fetchHistory(
  from: string,
  to: string,
  startDate: string,
  endDate: string,
): Promise<{ date: string; rate: number }[]> {
  const url = `${FRANKFURTER_BASE}/${startDate}..${endDate}?from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: HISTORY_REVALIDATE } });
  if (!res.ok) throw new Error(`Frankfurter history failed: ${res.status}`);
  const json = (await res.json()) as {
    rates?: Record<string, Record<string, number>>;
  };
  return toDailyRates(json.rates ?? {}, to);
}

// ---------------------------------------------------------------------------
// Bank of Canada Valet — cross-check / fallback
// ---------------------------------------------------------------------------

/** BoC series code for a from->to pair where CAD is the quote side. */
export function bocSeriesCode(from: string, to: string): string | null {
  // Valet publishes FX{FROM}{TO} e.g. FXEURCAD, FXGBPCAD, FXUSDCAD
  if (to !== "CAD") return null;
  return `FX${from}CAD`;
}

/** Latest BoC observation, used when Frankfurter is unreachable. */
export async function fetchBoCFallback(
  from: string,
  to: string,
): Promise<LatestResult | null> {
  const series = bocSeriesCode(from, to);
  if (!series) return null;
  const url = `${BOC_BASE}/observations/${series}/json?recent=1`;
  try {
    const res = await fetch(url, { next: { revalidate: LATEST_REVALIDATE } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      observations?: Record<string, Record<string, number | string>>[];
    };
    const obs = json.observations?.at(-1);
    const value = obs?.[series]?.v;
    const rate = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(rate)) return null;
    return { rate, source: "Bank of Canada Valet", date: obs ? Object.keys(obs)[0] ?? "" : "" };
  } catch {
    return null;
  }
}

/**
 * Latest rate with graceful fallback (PRD FR-1 / NFR reliability):
 * Frankfurter first, BoC Valet second. Throws only if both fail.
 */
export async function fetchLatestRateWithFallback(
  from: string,
  to: string,
): Promise<LatestResult> {
  try {
    return await fetchLatestRate(from, to);
  } catch (primaryError) {
    const fallback = await fetchBoCFallback(from, to);
    if (fallback) return fallback;
    throw primaryError;
  }
}
