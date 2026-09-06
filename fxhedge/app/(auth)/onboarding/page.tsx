"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "SGD", "AED", "SAR"];
const BUSINESS_TYPES = [
  "Halal grocery importer",
  "Clothing & textiles importer",
  "Electronics importer",
  "Food & beverage distributor",
  "Wholesale trader",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    router.push("/dashboard");
  }

  return (
    <main className="min-h-full flex flex-col items-center justify-center bg-[var(--color-surface)] px-4 py-16">
      <Link href="/" className="font-serif text-2xl font-semibold text-[var(--color-fg)] mb-8">
        HalalFlow
      </Link>
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        <h1 className="text-xl font-semibold text-[var(--color-fg)] mb-1">Tell us about your business</h1>
        <p className="text-sm text-[var(--color-muted-fg)] mb-6">Step 2 of 2 — business profile</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Business name">
            <input id="onboarding-biz-name" type="text" required autoComplete="organization" placeholder="Aisha's Halal Imports" className={inputCls} />
          </Field>

          <Field label="Business type">
            <select id="onboarding-biz-type" required className={inputCls}>
              <option value="">Select a type…</option>
              {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Home currency">
              <select id="onboarding-home-currency" required className={inputCls}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Supplier currency">
              <select id="onboarding-supplier-currency" required className={inputCls}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Invoice amount (supplier currency)">
            <input id="onboarding-invoice" type="number" required min={1} placeholder="12000" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Target margin (%)">
              <input id="onboarding-margin" type="number" required min={0} max={100} placeholder="10" className={inputCls} />
            </Field>
            <Field label="Days until due">
              <input id="onboarding-days" type="number" required min={1} placeholder="21" className={inputCls} />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-[opacity,scale] duration-150 active:scale-[0.96] disabled:opacity-60"
          >
            {loading ? "Saving…" : "Go to dashboard →"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputCls =
  "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

function Field({ label, children }: { label: string; children: React.ReactElement<{ id?: string }> }) {
  const id = children.props.id;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-[var(--color-muted-fg)] mb-1">{label}</label>
      {children}
    </div>
  );
}
