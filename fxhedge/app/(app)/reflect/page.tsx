import Link from "next/link";
import { Panel } from "@/components/ui/panel";

const verses = [
  {
    ref: "Quran 2:275",
    text: "Those who consume riba will not stand [on the Day of Resurrection] except as one stands who is being beaten by Satan into insanity. That is because they say, 'Trade is [just] like riba.' But Allah has permitted trade and has forbidden riba…",
  },
  {
    ref: "Quran 2:276",
    text: "Allah destroys riba and gives increase for charities. And Allah does not like every sinning disbeliever.",
  },
  {
    ref: "Quran 2:278–279",
    text: "O you who have believed, fear Allah and give up what remains [due to you] of riba, if you should be believers. And if you do not, then be informed of a war [against you] from Allah and His Messenger…",
  },
  {
    ref: "Quran 3:130",
    text: "O you who have believed, do not consume riba, doubled and multiplied, but fear Allah that you may be successful.",
  },
  {
    ref: "Quran 30:39",
    text: "And whatever you give for riba to increase within the wealth of people will not increase with Allah. But what you give in zakah, desiring the countenance of Allah — those are the multipliers.",
  },
];

const hadith = [
  {
    source: "Musnad Ahmad (sahih by al-Albani)",
    text: "Riba has seventy-three doors; the least of them is equivalent to a man marrying his own mother.",
  },
  {
    source: "Sahih Muslim",
    text: "The Prophet ﷺ cursed the one who consumes riba, the one who gives it, the one who writes [the contract], and the two witnesses — he said: they are all equal [in sin].",
  },
  {
    source: "al-Tabarani",
    text: "There are seventy-two types of riba, the least of which is like a man committing zina with his own mother.",
  },
];

const redditStories = [
  {
    user: "RavenBJ",
    subreddit: "r/Daytrading",
    quote:
      "I kept rolling FX positions thinking the spread was just the cost of doing business. Three years later I realized I'd paid £14,000 in hidden markups I never tracked.",
    href: "https://www.reddit.com/r/Daytrading/",
  },
  {
    user: "tradingthrowawayacc",
    subreddit: "r/Forexstrategy",
    quote:
      "The banks never show you the true cost. Every invoice I paid in USD was costing me 3–4% more than the mid-market rate. That's margin straight into their pocket.",
    href: "https://www.reddit.com/r/Forexstrategy/",
  },
  {
    user: "uncertainuser00",
    subreddit: "r/Forex",
    quote:
      "Started tracking my FX costs properly for the first time last quarter. The difference between the best and worst provider was $2,300 on a $40k transfer. Same money, same day.",
    href: "https://www.reddit.com/r/Forex/",
  },
];

export default function ReflectPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary">
          The weight of riba
        </h1>
        <p className="mt-1 text-sm text-muted">
          Understanding interest and hidden costs through Islamic scholarship
          and lived experience
        </p>
      </header>

      {/* Quran verses */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">
          Quran
        </h2>
        <div className="space-y-4">
          {verses.map((v) => (
            <Panel key={v.ref} className="p-5">
              <p className="tnum mb-2 text-xs uppercase tracking-widest text-muted">
                {v.ref}
              </p>
              <p className="text-sm italic leading-relaxed text-primary">
                &ldquo;{v.text}&rdquo;
              </p>
            </Panel>
          ))}
        </div>
      </section>

      {/* Hadith */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-primary">
          Hadith
        </h2>
        <div className="space-y-4">
          {hadith.map((h) => (
            <Panel key={h.source} className="p-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted">
                {h.source}
              </p>
              <p className="text-sm italic leading-relaxed text-primary">
                &ldquo;{h.text}&rdquo;
              </p>
            </Panel>
          ))}
        </div>
      </section>

      {/* Real stories */}
      <section>
        <h2 className="mb-1 font-display text-xl font-semibold text-primary">
          Real stories
        </h2>
        <p className="mb-4 text-sm text-muted">
          Direct quotes from traders and importers sharing their experience
          with hidden FX costs.
        </p>
        <div className="space-y-4">
          {redditStories.map((s) => (
            <Panel key={s.user} className="p-5">
              <p className="mb-2 text-xs text-muted">
                <span className="font-medium text-primary">{s.user}</span> ·{" "}
                {s.subreddit}
              </p>
              <p className="mb-3 text-sm leading-relaxed text-primary">
                &ldquo;{s.quote}&rdquo;
              </p>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read ${s.user}'s post on ${s.subreddit} (opens in new tab)`}
                className="text-xs text-accent hover:underline"
              >
                Read the full post →
              </a>
            </Panel>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Panel className="border-accent p-6 text-center">
        <h2 className="mb-2 font-display text-xl font-semibold text-primary">
          Explore halal alternatives
        </h2>
        <p className="mb-4 text-sm text-muted">
          Natural hedge, wa'd, murabaha — see which option works for your
          business.
        </p>
        <Link
          href="/sharia"
          className="inline-block rounded-[10px] bg-accent px-6 py-2.5 text-sm font-medium text-canvas transition-[background-color,transform] duration-150 hover:bg-accent-strong active:scale-[0.98]"
        >
          View Sharia options →
        </Link>
      </Panel>

      {/* Crisis + disclaimer */}
      <div className="space-y-3 text-xs text-muted">
        <p>
          <strong className="text-primary">If you&apos;re struggling:</strong>{" "}
          Canada / US: <strong>9-8-8</strong> · UK: <strong>116 123</strong>{" "}
          (Samaritans) · International:{" "}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Find a helpline (opens in new tab)"
            className="text-accent hover:underline"
          >
            findahelpline.com
          </a>
        </p>
        <p>
          This page is general education, not a fatwa or financial advice.
          Consult a qualified Islamic finance scholar for a ruling specific to
          your situation. Hedged never moves money and never predicts exchange
          rates.
        </p>
      </div>
    </div>
  );
}
