"use client";
import { useState, useEffect, useCallback } from "react";
import { MOCK_PROFILE } from "@/lib/fixtures";
import type { Profile } from "@/types";

export interface Invoice {
  id: string;
  amount: number;
  from: string;
  to: string;
  /** Days from today until payment is due — the forward exposure window. */
  days: number;
  /** ISO date the invoice was issued. Distinct from `days`, which looks forward. */
  invoicedOn: string;
  label: string;
  savedAt: string;
}

const KEY_CURRENT = "hedged:current-invoice";
const KEY_RECENT  = "hedged:recent-invoices";
const MAX_RECENT  = 8;

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Invoices saved before `invoicedOn` existed fall back to the old assumption. */
function normalize(inv: Invoice): Invoice {
  return inv.invoicedOn ? inv : { ...inv, invoicedOn: isoDaysAgo(inv.days ?? 21) };
}

/** Seed a working invoice from the answers given at onboarding. */
function fromProfile(p: Profile): Invoice {
  const amount = Number(p.invoice_amount);
  const days = Number(p.days_until_due);
  return {
    id: "profile",
    amount: Number.isFinite(amount) && amount > 0 ? amount : MOCK_PROFILE.invoice_amount,
    from: p.supplier_currency || MOCK_PROFILE.supplier_currency,
    to: p.home_currency || MOCK_PROFILE.home_currency,
    days: Number.isFinite(days) ? days : MOCK_PROFILE.days_until_due,
    invoicedOn: todayIsoDate(),
    label: p.business_name ? `${p.business_name} invoice` : "Your invoice",
    savedAt: new Date().toISOString(),
  };
}

function defaultInvoice(): Invoice {
  return {
    id: "sample",
    amount: MOCK_PROFILE.invoice_amount,
    from:   MOCK_PROFILE.supplier_currency,
    to:     MOCK_PROFILE.home_currency,
    days:   MOCK_PROFILE.days_until_due,
    invoicedOn: isoDaysAgo(MOCK_PROFILE.days_until_due),
    label:  `${MOCK_PROFILE.business_name.split(" ")[0]} sample`,
    savedAt: new Date().toISOString(),
  };
}

export function useInvoice() {
  const [current, setCurrentState] = useState<Invoice>(defaultInvoice);
  const [recent, setRecentState]   = useState<Invoice[]>([]);
  const [ready, setReady]           = useState(false);

  useEffect(() => {
    let alive = true;
    let stored: Invoice | null = null;
    try {
      const c = localStorage.getItem(KEY_CURRENT);
      if (c) stored = normalize(JSON.parse(c));
      const r = localStorage.getItem(KEY_RECENT);
      if (r) setRecentState((JSON.parse(r) as Invoice[]).map(normalize));
    } catch {
      // corrupt storage, fall back to defaults
    }

    if (stored) {
      setCurrentState(stored);
      setReady(true);
      return;
    }

    // Nothing saved on this device — use the profile from onboarding rather
    // than the built-in sample, so a fresh login still shows the user's own numbers.
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p: Profile | null) => {
        if (!alive) return;
        if (p?.invoice_amount) setCurrentState(fromProfile(p));
        setReady(true);
      })
      .catch(() => { if (alive) setReady(true); });

    return () => { alive = false; };
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
