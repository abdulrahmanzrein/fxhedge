import { NextResponse, type NextRequest } from "next/server";
import {
  parsePair,
  todayIso,
  addDaysIso,
  fetchLatestRateWithFallback,
  fetchRateOnDate,
  fetchHistory,
} from "@/lib/fx";
import { buildRiskResult } from "@/lib/risk";

/**
 * GET /api/risk?pair=EUR-CAD&days_ago=21&window_days=21&years=10
 *
 * Two distinct periods, deliberately separate:
 *   days_ago     — how long ago the invoice was issued; the drift baseline.
 *   window_days  — how long until it is due; the forward exposure window the
 *                  historical distribution is measured over.
 * They only coincide by accident. Defaults to days_ago when omitted.
 *
 * Returns RiskResult (types/index.ts). No direction prediction.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pairParam = searchParams.get("pair") ?? "EUR-CAD";
  const daysAgo = Math.max(0, Math.min(3650, Number(searchParams.get("days_ago") ?? 21) || 0));
  const windowParam = searchParams.get("window_days");
  const windowDays = Math.max(
    1,
    Math.min(3650, (windowParam === null ? daysAgo : Number(windowParam)) || 21),
  );
  const years = Math.max(1, Math.min(27, Number(searchParams.get("years") ?? 10) || 10));

  const pair = parsePair(pairParam);
  if (!pair) {
    return NextResponse.json(
      { ok: false, error: "Invalid pair. Expected format: EUR-CAD" },
      { status: 400 },
    );
  }

  const today = todayIso();
  const invoiceDay = addDaysIso(today, daysAgo);
  const start = addDaysIso(today, Math.round(years * 365.25));

  try {
    const latest = await fetchLatestRateWithFallback(pair.from, pair.to);
    let invoiceDayRate = latest.rate;
    if (daysAgo > 0) {
      try {
        invoiceDayRate = await fetchRateOnDate(pair.from, pair.to, invoiceDay);
      } catch {
        // degrade to today's rate
      }
    }

    const series = await fetchHistory(pair.from, pair.to, start, today);
    const result = buildRiskResult({
      pair: `${pair.from}-${pair.to}`,
      invoiceDayRate,
      todayRate: latest.rate,
      windowDays,
      series,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=43200" },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Risk fetch failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 },
    );
  }
}
