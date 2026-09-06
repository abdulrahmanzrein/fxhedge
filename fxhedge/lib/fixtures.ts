export const SAMPLE = {
  pair: "EUR-CAD",
  from: "EUR",
  to: "CAD",
  invoiceAmount: 12000,
  revenue: 18000,
  targetMargin: 10,
  daysAgo: 21,
  ecbRateToday: 1.6038,
  ecbRateInvoiceDay: 1.6049,
  trueCostToday: 19246,
  marginToday: -6.9,
  bestProvider: { name: "Wise", received: 19195, midMarket: true },
  worstProvider: { name: "PayPal", received: 18428 },
  savingVsWorst: 767,
  marginAtRiskMinus5pct: -2208,
  providers: [
    { name: "Wise",          received: 19195, midMarket: true  },
    { name: "Instarem",      received: 19158, midMarket: false },
    { name: "Deutsche Bank", received: 19156, midMarket: false },
    { name: "Western Union", received: 19098, midMarket: false },
  ],
  histWindows: 2796,
  worst5pctMove: 3.2,
  worstOnRecord: 9.8,
  driftTodayPct: -0.1,
  decision: "marginal" as const,
  decisionReason:
    "Drift is tiny and in your favor, but history shows 5% of 21-day windows moved 3.2%+ against you.",
};

export const MOCK_PROFILE = {
  user_id: "mock",
  business_name: "Aisha's Halal Imports",
  business_type: "Halal grocery importer",
  home_currency: "CAD",
  supplier_currency: "EUR",
  invoice_amount: 12000,
  target_margin: 10,
  days_until_due: 21,
  updated_at: new Date().toISOString(),
};

export function currencySymbol(code: string): string {
  const map: Record<string, string> = {
    USD: "$", CAD: "$", AUD: "$", SGD: "$",
    GBP: "£",
    EUR: "€",
  };
  return map[code] ?? code;
}
