import { NextResponse, type NextRequest } from "next/server";
import { parsePair } from "@/lib/fx";
import { fetchProviderQuotes } from "@/lib/providers";

/**
 * GET /api/providers?from=EUR&to=CAD&amount=12000
 * Returns ProviderQuote[] (types/index.ts): ranked, deduped.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = (searchParams.get("from") ?? "EUR").toUpperCase();
  const to = (searchParams.get("to") ?? "CAD").toUpperCase();
  const amount = Number(searchParams.get("amount") ?? 12000);

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || from === to) {
    return NextResponse.json(
      { ok: false, error: "Invalid currencies. Use ?from=EUR&to=CAD" },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return NextResponse.json(
      { ok: false, error: "amount must be a positive number" },
      { status: 400 },
    );
  }

  try {
    const providers = await fetchProviderQuotes(from, to, amount);
    if (providers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No provider quotes available for this pair" },
        { status: 404 },
      );
    }
    return NextResponse.json(providers, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: `Provider fetch failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 502 },
    );
  }
}
