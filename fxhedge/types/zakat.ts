export type MadhhabMethod = "hanafi" | "aaoifi";

export interface ZakatHolding {
  id: string;
  kind: "cash_home" | "cash_foreign" | "receivable" | "inventory" | "liability";
  label: string;
  amount: number;
  currency: string; // "CAD", "EUR", "USD", "GBP"...
  due_days?: number; // receivables only: days until due (0 = due now)
  doubtful?: boolean; // receivables only: seriously doubtful collection
}

export interface ValuedHolding extends ZakatHolding {
  value_home: number; // converted at today's reference rate
  rate_used: number | null; // 1.0 for home currency
  rate_source: string | null;
  zakatable: boolean; // after method rules
  excluded_reason?: string; // shown in UI when zakatable is false
}

export interface ZakatResult {
  method: MadhhabMethod;
  zakatable_total: number; // home currency
  nisab_threshold: number; // home currency
  nisab_met: boolean;
  zakat_due: number; // 2.5% of zakatable_total when nisab_met, else 0
  holdings: ValuedHolding[];
  computed_at: string;
  rate_date: string; // "as of" date for the FX rates used
}
