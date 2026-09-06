"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PROFILE } from "@/lib/fixtures";

export interface Invoice {
  id: string;
  amount: number;
  from: string;
  to: string;
  days: number;
  label: string;
  savedAt: string;
}

const KEY_CURRENT = "hedged:current-invoice";
const KEY_RECENT  = "hedged:recent-invoices";
const MAX_RECENT  = 8;

function defaultInvoice(): Invoice {
  return {
    id: "sample",
    amount: MOCK_PROFILE.invoice_amount,
    from:   MOCK_PROFILE.supplier_currency,
    to:     MOCK_PROFILE.home_currency,
    days:   MOCK_PROFILE.days_until_due,
    label:  `${MOCK_PROFILE.business_name.split(" ")[0]} sample`,
    savedAt: new Date().toISOString(),
  };
}

export function useInvoice() {
  const [current, setCurrentState] = useState<Invoice>(defaultInvoice);
  const [recent, setRecentState]   = useState<Invoice[]>([]);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(KEY_CURRENT);
      if (c) setCurrentState(JSON.parse(c));
      const r = localStorage.getItem(KEY_RECENT);
      if (r) setRecentState(JSON.parse(r));
    } catch {
      // corrupt storage, fall back to defaults
    }
    setReady(true);
  }, []);

  const setCurrent = useCallback((inv: Invoice) => {
    setCurrentState(inv);
    try { localStorage.setItem(KEY_CURRENT, JSON.stringify(inv)); } catch {}
    setRecentState((r) => {
      const next = [inv, ...r.filter((x) => x.id !== inv.id)].slice(0, MAX_RECENT);
      try { localStorage.setItem(KEY_RECENT, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeRecent = useCallback((id: string) => {
    setRecentState((r) => {
      const next = r.filter((x) => x.id !== id);
      try { localStorage.setItem(KEY_RECENT, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { current, recent, ready, setCurrent, removeRecent };
}
