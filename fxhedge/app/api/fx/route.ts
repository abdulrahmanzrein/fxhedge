import { NextResponse, type NextRequest } from "next/server";
import {
  parsePair,
  addDaysIso,
  todayIso,
  fetchLatestRateWithFallback,
  fetchRateOnDate,
} from "@/lib/fx";

/**
 * GET /api/fx?pair=EUR-CAD&days_ago=21
 * Returns the FXRate contract shape (types/index.ts):
 * latest reference rate + invoice-day rate + source label.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pairParam = searchParams.get("pair") ?? "EUR-CAD";
  const daysAgoParam = Number(searchParams.get("days_ago") ?? 21);

  const pair = parsePair(pairParam);
  if (!pair) {
    return NextResponse.json(
      { ok: false, error: "Invalid pair. Expected format: EUR-CAD" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(daysAgoParam) || daysAgoParam < 0 || daysAgoParam > 3650) {
    return NextResponse.json(
      { ok: false, error: "days_ago must be a number between 0 and 3650" },
      { status: 400 },
    );
  }

  const today = todayIso();
  const invoiceDay = addDaysIso(today, Math.round(daysAgoParam));

  try {
    const latest = await fetchLatestRateWithFallback(pair.from, pair.to);

    let rateInvoiceDay = latest.rate;
    if (daysAgoParam > 0) {
      try {
        rateInvoiceDay = await fetchRateOnDate(pair.from, pair.to, invoiceDay);
      } catch {
        // Invoice-day rate is enrichment — fall back to today's rate
        // rather than failing the whole response (FR-1 graceful degradation).
      }
    }

    const body = {
      pair: `${pair.from}-${pair.to}`,
      from: pair.from,
      to: pair.to,
      rate: latest.rate,
      rate_invoice_day: rateInvoiceDay,
      source: latest.source,
      fetched_at: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `FX fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }
}
