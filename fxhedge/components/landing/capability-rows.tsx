const ROWS = [
  {
    title: "See the real cost",
    body: "Provider rates, fees and markups from the live Wise Comparison API, ranked by what actually arrives.",
  },
  {
    title: "Know the risk of waiting",
    body: "25 years of ECB history behind a pay-now-or-wait verdict that reports magnitudes, never predictions.",
  },
  {
    title: "Zakat on live rates",
    body: "Your holdings valued at today's reference rate, with AAOIFI and Hanafi views shown side by side.",
  },
];

export function CapabilityRows() {
  return (
    <section className="mt-24">
      {ROWS.map((row) => (
        <div
          key={row.title}
          className="grid gap-2 border-t border-line py-6 md:grid-cols-[240px_1fr] md:gap-8"
        >
          <h3 className="font-medium text-primary">{row.title}</h3>
          <p className="leading-relaxed text-muted">{row.body}</p>
        </div>
      ))}
    </section>
  );
}
