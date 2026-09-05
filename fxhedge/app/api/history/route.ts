import { NextResponse, type NextRequest } from "next/server";
import {
  parsePair,
  todayIso,
  addDaysIso,
  fetchHistory,
} from "@/lib/fx";

/**
 * GET /api/history?pair=EUR-CAD&years=10
 * Returns { rates: { "YYYY-MM-DD": rate } } for the risk explorer's
 * historical move-distribution (PRD FR-4 / build guide Screen 7).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pairParam = searchParams.get("pair") ?? "EUR-CAD";
  const yearsParam = Number(searchParams.get("years") ?? 10);

  const pair = parsePair(pairParam);
  if (!pair) {
    return NextResponse.json(
      { ok: false, error: "Invalid pair. Expected format: EUR-CAD" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(yearsParam) || yearsParam < 1 || yearsParam > 27) {
    // ECB euro reference rates start 1999-01-04 -> max 27 years as of 2026.
    return NextResponse.json(
      { ok: false, error: "years must be between 1 and 27" },
      { status: 400 },
    );
  }

  const end = todayIso();
  const start = addDaysIso(end, Math.round(yearsParam * 365.25));

  try {
    const series = await fetchHistory(pair.from, pair.to, start, end);
    const rates: Record<string, number> = {};
    for (const { date, rate } of series) rates[date] = rate;

    return NextResponse.json(
      { pair: `${pair.from}-${pair.to}`, rates, count: series.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `History fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }
}
