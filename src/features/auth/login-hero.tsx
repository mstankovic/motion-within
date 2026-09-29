import { getTranslations } from "next-intl/server";
import { Play, Trophy } from "lucide-react";
import { BrandMark } from "@/components/app/brand-mark";
import { cn } from "@/lib/cn";

const ARC = "M20 150C70 60 118 28 180 28s110 32 160 122";

/** Welcome hero: brand, a live-looking glimpse of the app, and the tagline. */
export async function LoginHero() {
  const [t, ta] = await Promise.all([getTranslations("welcome"), getTranslations("app")]);
  const lines = ta("tagline").split(/(?<=\.)\s+/);

  return (
    <div className="text-on-hero relative flex flex-1 flex-col px-6 pt-[max(env(safe-area-inset-top),0.75rem)]">
      {/* Soft light behind the preview. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_50%_at_60%_35%,rgb(63_194_173/0.28),transparent_70%)]"
      />

      <div className="animate-fade-in relative mt-5 mb-5 flex items-center gap-2.5">
        <BrandMark className="size-9 rounded-[10px] ring-1 ring-white/15" />
        <span className="text-lg font-extrabold tracking-tight">{ta("name")}</span>
      </div>

      {/* Hidden on the code step (the form sets data-step) and on very short screens. */}
      <div
        aria-hidden="true"
        className="relative mx-auto my-auto max-h-72 min-h-36 w-full max-w-sm flex-1 group-has-[[data-step=code]]:hidden [@media(max-height:600px)]:hidden"
      >
        <svg
          viewBox="0 0 360 170"
          preserveAspectRatio="xMidYMax meet"
          className="absolute inset-0 size-full overflow-visible"
          fill="none"
        >
          <path
            d={ARC}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={ARC}
            stroke="var(--color-on-hero-muted)"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
          {/* The mark's accent dot, moving along the arc (static when motion is reduced). */}
          <circle r="9" fill="var(--color-accent)" className="motion-reduce:hidden">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={ARC}
              keyPoints="0.15;0.85;0.15"
              keyTimes="0;0.5;1"
              calcMode="spline"
              keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            />
          </circle>
          <circle
            cx="180"
            cy="28"
            r="9"
            fill="var(--color-accent)"
            className="hidden motion-reduce:block"
          />
        </svg>

        <Chip className="top-0 left-0 -rotate-3" delay={0}>
          <span className="bg-accent text-on-accent flex size-8 items-center justify-center rounded-full">
            <Play className="size-4 fill-current" />
          </span>
          <ChipText label={t("todayLabel")} value={t("todayValue")} />
        </Chip>

        <Chip className="top-[42%] right-0 rotate-2" delay={1}>
          <WeekRing done={3} total={4} />
          <ChipText label={t("weekLabel")} value={t("weekValue", { done: 3, total: 4 })} />
        </Chip>

        <Chip className="bottom-0 left-[6%] -rotate-1 [@media(max-height:800px)]:hidden" delay={2}>
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <Trophy className="text-accent size-4" />
          </span>
          <ChipText label={t("recordLabel")} value={t("recordValue")} />
        </Chip>
      </div>

      <div className="relative mt-auto mb-6">
        <h1 className="enter text-[clamp(2rem,5.4dvh,2.75rem)] leading-[1.02] font-extrabold tracking-tight">
          {lines.map((line, i) => (
            <span key={line} className={cn("block", i === lines.length - 1 && "text-accent")}>
              {line}
            </span>
          ))}
        </h1>
        <p
          className="enter text-on-hero-muted mt-2.5 max-w-80 text-[0.9375rem] text-balance"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          {t("subtitle")}
        </p>
      </div>
    </div>
  );
}

function Chip({
  className,
  delay,
  children,
}: {
  className?: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("enter absolute", className)}
      style={{ "--i": delay + 1 } as React.CSSProperties}
    >
      <div
        className="animate-float flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 py-2 pr-4 pl-2 shadow-[0_12px_32px_rgb(0_0_0/0.18)] backdrop-blur-md"
        style={{ animationDelay: `${delay * -2}s` }}
      >
        {children}
      </div>
    </div>
  );
}

function ChipText({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col leading-tight">
      <span className="text-on-hero-muted text-[0.6875rem] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-sm font-bold whitespace-nowrap">{value}</span>
    </span>
  );
}

function WeekRing({ done, total }: { done: number; total: number }) {
  const r = 13;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 32 32" className="size-8 -rotate-90">
      <circle cx="16" cy="16" r={r} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="4" />
      <circle
        cx="16"
        cy="16"
        r={r}
        fill="none"
        stroke="var(--color-on-hero)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(c * done) / total} ${c}`}
      />
    </svg>
  );
}
