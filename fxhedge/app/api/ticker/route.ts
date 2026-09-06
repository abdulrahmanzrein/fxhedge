import { NextResponse } from "next/server";
import { fetchTicker } from "@/lib/fx";

/** GET /api/ticker — latest rate, trailing change and sparkline per pair. */
export async function GET() {
  try {
    const quotes = await fetchTicker();
    return NextResponse.json(quotes, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `Ticker fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }
}
