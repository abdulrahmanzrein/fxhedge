import { NextResponse, type NextRequest } from "next/server";
import {
  parsePair,
  todayIso,
  fetchLatestRateWithFallback,
  fetchHistory,
} from "@/lib/fx";
import { computeBreakEven } from "@/lib/breakeven";

/**
 * GET /api/breakeven?invoice=12000&revenue=18000&pair=EUR-CAD&years=10
 * The dashboard's "am I safe?" number: break-even rate + cushion verdict,
 * grounded in the real historical move distribution.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invoice = Number(searchParams.get("invoice"));
  const revenue = Number(searchParams.get("revenue"));
  const years = Math.max(1, Math.min(27, Number(searchParams.get("years") ?? 10) || 10));
  const pair = parsePair(searchParams.get("pair") ?? "EUR-CAD");

  if (!pair) {
    return NextResponse.json({ ok: false, error: "Invalid pair" }, { status: 400 });
  }
  if (!(invoice > 0) || !(revenue > 0)) {
    return NextResponse.json(
      { ok: false, error: "invoice and revenue must be positive numbers" },
      { status: 400 },
    );
  }

  const today = todayIso();
  const start = addYearsIso(today, years);

  try {
    const latest = await fetchLatestRateWithFallback(pair.from, pair.to);
    const series = await fetchHistory(pair.from, pair.to, start, today);

    // Non-overlapping 21-day forward moves (same method as the risk explorer)
    const WINDOW = 21;
    const moves: number[] = [];
    for (let i = 0; i + WINDOW < series.length; i += WINDOW) {
      const a = series[i];
      const b = series[i + WINDOW];
      if (a.rate <= 0) continue;
      moves.push(((b.rate - a.rate) / a.rate) * 100);
    }
    const byAbs = [...moves].sort((x, y) => Math.abs(y) - Math.abs(x));
    const worst5pctMove = byAbs.length
      ? Math.abs(byAbs[Math.max(0, Math.floor(byAbs.length * 0.05) - 1)])
      : 0;
    const worstOnRecord = byAbs.length ? Math.abs(byAbs[0]) : 0;

    const result = computeBreakEven({
      invoiceAmount: invoice,
      revenue,
      todayRate: latest.rate,
      worst5pctMove,
      worstOnRecord,
    });

    return NextResponse.json(
      {
        ...result,
        today_rate: latest.rate,
        today_rate_source: latest.source,
        hist_windows: moves.length,
      },
      { headers: { "Cache-Control": "public, s-maxage=1800" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `Breakeven fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 502 },
    );
  }
}

function addYearsIso(isoDate: string, years: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}
