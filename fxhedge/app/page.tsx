import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { FxChartCard } from "@/components/fx-chart-card";
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { GeometricBand } from "@/components/landing/geometric-band";
import { CapabilityRows } from "@/components/landing/capability-rows";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <GeometricBand className="pointer-events-none absolute inset-x-0 top-0 -z-10" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-semibold tracking-tight">Hedged</span>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Create account</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <Stagger className="pt-16 md:pt-24">
          <StaggerItem>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
              Your margin, protected from the exchange rate.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Hedged shows the real cost of an international payment, the risk of
              waiting, and your zakat, computed on live central-bank reference rates.
            </p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-8 flex gap-3">
              <Link href="/signup">
                <Button>Create free account</Button>
              </Link>
              <a href="#live">
                <Button variant="secondary">See a live quote</Button>
              </a>
            </div>
          </StaggerItem>
          <StaggerItem className="mt-16">
            <div id="live">
              <FxChartCard pair="EUR-CAD" days={30} />
            </div>
          </StaggerItem>
        </Stagger>

        <CapabilityRows />

        <FadeUp className="mt-24">
          <Panel className="p-6">
            <p className="text-muted">
              Built ground-up for Muslim-owned businesses: riba-free by design, with
              the sharia reasoning shown, never hidden.
            </p>
            <Link href="/sharia" className="mt-2 inline-block text-accent">
              Read the sharia approach
            </Link>
          </Panel>
        </FadeUp>

        <footer className="mt-24 border-t border-line pt-6 text-sm text-faint">
          Educational tool. Rates are indicative, not bookable. Not financial or
          religious advice.
        </footer>
      </main>
    </div>
  );
}
