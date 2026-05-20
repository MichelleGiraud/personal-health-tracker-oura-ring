type SignalCardData = {
  eyebrow: string;
  state: string;
  value: string;
  line1: string;
  line2: string;
  tone: "sleep" | "hrv" | "load";
};

type TodaysKeySignalsProps = {
  cards: SignalCardData[];
};

export default function TodaysKeySignals({
  cards,
}: TodaysKeySignalsProps) {
  return (
    <section id="todays-key-signals" className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Key Wellness Signals
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {cards.map((card) => (
          <SignalCard
            key={card.eyebrow}
            eyebrow={card.eyebrow}
            state={card.state}
            value={card.value}
            line1={card.line1}
            line2={card.line2}
            tone={card.tone}
          />
        ))}
      </div>
    </section>
  );
}


function SignalCard({
  eyebrow,
  state,
  value,
  line1,
  line2,
  tone,
}: SignalCardData) {
  const toneClass =
  tone === "sleep"
    ? "text-[var(--sleep)]" 
    : tone === "hrv"
      ? "text-[var(--hrv)]"
      : "text-[var(--load)]";

  return (
    <article id="todays-key-signals" className="rounded-[40px] border border-[color-mix(in_srgb,var(--border)_88%,white)] bg-[color-mix(in_srgb,var(--surface-elevated)_78%,#243028)] p-10 shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:text-base">
        {eyebrow}
      </p>
      <p className={`mt-8 text-2xl font-medium ${toneClass} sm:text-2xl `}>{state}</p>
      <p className="mt-6 text-5xl font-medium tracking-tight text-[var(--text)] sm:text-5xl">{value}</p>
      <div className="mt-10 space-y-2 text-sm leading-[1.35] text-[var(--text-muted)] sm:text-sm">
        <p>{line1}</p>
        <p>{line2}</p>
      </div>
    </article>
  );
}