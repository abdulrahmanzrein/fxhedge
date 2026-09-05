import Link from "next/link";
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { FxChartCard } from "@/components/fx-chart-card";
import { DashboardKpis } from "@/components/dashboard-kpis";
import { BreakevenCard } from "@/components/breakeven-card";
import { NaturalHedgeCard } from "@/components/natural-hedge-card";

// Placeholder scenario numbers for now — wired to saved scenarios post-plan.
const SCENARIO = { invoice: 12000, revenue: 18000, pair: "EUR-CAD" };

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Stagger className="flex flex-col gap-4">
      <StaggerItem>
        <div className="flex items-end justify-between gap-4">
          <FadeUp>
            <h1 className="text-2xl font-semibold tracking-tight">Good afternoon</h1>
            <p className="text-sm text-muted">{today}</p>
          </FadeUp>
          <Link href="/transfer">
            <Button variant="secondary">New payment</Button>
          </Link>
        </div>
      </StaggerItem>

      <StaggerItem>
        <FxChartCard pair={SCENARIO.pair} days={90} />
      </StaggerItem>

      <div className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <BreakevenCard invoice={SCENARIO.invoice} revenue={SCENARIO.revenue} pair={SCENARIO.pair} />
        </StaggerItem>
        <StaggerItem>
          <NaturalHedgeCard />
        </StaggerItem>
      </div>

      <StaggerItem>
        <DashboardKpis pair={SCENARIO.pair} />
      </StaggerItem>
    </Stagger>
  );
}
