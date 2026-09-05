import { NextResponse, type NextRequest } from "next/server";
import { fetchLatestRateWithFallback } from "@/lib/fx";

/**
 * GET /api/zakat/rates?currencies=EUR,USD,GBP&home=CAD
 * Values each foreign currency in the user's zakat pool at today's
 * reference rate. Zakat is due on the VALUE of holdings — which moves
 * daily with FX. Reuses the existing live FX layer (with fallback).
 * A currency whose fetch fails is simply absent from `rates`, so the
 * client surfaces an honest "missing rate" error for that row.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const home = (searchParams.get("home") ?? "CAD").toUpperCase();
  const currencies = (searchParams.get("currencies") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{3}$/.test(c) && c !== home)
    .slice(0, 10); // cap: free APIs + sanity

  if (!/^[A-Z]{3}$/.test(home)) {
    return NextResponse.json(
      { ok: false, error: "Invalid home currency" },
      { status: 400 },
    );
  }

  const rates: Record<string, number> = { [home]: 1 };
  const sources: Record<string, string> = { [home]: "home currency" };
  let rateDate = new Date().toISOString().slice(0, 10);

  const results = await Promise.allSettled(
    currencies.map((cur) =>
      // We need "how many home units 1 cur buys": fetch home as base and
      // read the cur quote, then invert (1 / homePerCur).
      fetchLatestRateWithFallback(home, cur).then((r) => ({
        cur,
        rate: 1 / r.rate,
        source: r.source,
        date: r.date,
      })),
    ),
  );
  for (const res of results) {
    if (res.status === "fulfilled") {
      const { cur, rate, source, date } = res.value;
      rates[cur] = Math.round(rate * 100000) / 100000; // 5dp: 1 cur = X home
      sources[cur] = source;
      rateDate = date;
    }
  }

  return NextResponse.json(
    { rates, home, sources, rate_date: rateDate },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
