export interface Profile {
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  home_currency: string;
  supplier_currency: string;
  invoice_amount: number;
  target_margin: number;
  days_until_due: number;
  updated_at: string;
}

export interface Scenario {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  pair: string;
  revenue: number;
  days_ago: number;
  target_margin: number;
  saved_at: string;
}

export interface FXRate {
  pair: string;
  from: string;
  to: string;
  rate: number;
  rate_invoice_day: number;
  source: string;
  fetched_at: string;
}

export interface ProviderQuote {
  name: string;
  received: number;
  mid_market: boolean;
  transfer_fee?: number;
  logo?: string;
}

export interface CostBreakdown {
  invoice_amount: number;
  revenue: number;
  ecb_rate_today: number;
  true_cost_today: number;
  margin_today: number;
  best_provider: ProviderQuote;
  worst_provider: ProviderQuote;
  saving_vs_worst: number;
  margin_at_risk_minus5pct: number;
  providers: ProviderQuote[];
}

export interface RiskResult {
  pair: string;
  hist_windows: number;
  worst_5pct_move: number;
  worst_on_record: number;
  drift_today_pct: number;
  decision: "pay_now" | "wait" | "marginal";
  decision_reason: string;
}

export interface ChatAnswer {
  answer: string;
  model?: string;
  error?: boolean;
}
