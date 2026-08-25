import type { ReactNode } from "react";
import type { SecurityGrade } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-hull-700/70 bg-hull-900/60 p-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foam-300">
        {title}
      </h2>
      {hint ? <p className="mt-1 text-sm text-foam-400">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const tones: Record<string, string> = {
    neutral: "border-hull-600 bg-hull-800 text-foam-300",
    good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    bad: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    accent: "border-aqua-500/40 bg-aqua-500/10 text-aqua-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Horizontal 0..100 bar. `value` and `max` are in the same unit. */
export function Meter({
  value,
  max = 100,
  tone = "accent",
}: {
  value: number;
  max?: number;
  tone?: "accent" | "good" | "warn" | "bad";
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const fills: Record<string, string> = {
    accent: "bg-aqua-400",
    good: "bg-emerald-400",
    warn: "bg-amber-400",
    bad: "bg-rose-400",
  };
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-hull-800"
      role="meter"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
    >
      <div
        className={`h-full rounded-full ${fills[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const GRADE_COLOR: Record<SecurityGrade, string> = {
  A: "#34d399",
  B: "#6fe3d5",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#fb7185",
};

export function ScoreDial({
  score,
  grade,
  label,
}: {
  score: number;
  grade?: SecurityGrade;
  label: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color = grade ? GRADE_COLOR[grade] : "#35cfbf";

  return (
    <div className="flex items-center gap-4">
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#112232"
          strokeWidth="12"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 64 64)"
        />
        <text
          x="64"
          y={grade ? 60 : 72}
          textAnchor="middle"
          fill="#e9f2f8"
          fontSize="30"
          fontWeight="600"
        >
          {score}
        </text>
        {grade ? (
          <text
            x="64"
            y="84"
            textAnchor="middle"
            fill={color}
            fontSize="16"
            fontWeight="600"
          >
            Grade {grade}
          </text>
        ) : null}
      </svg>
      <div className="text-sm text-foam-300">
        <p className="font-medium text-foam-100">{label}</p>
        <p className="mt-1 max-w-xs text-foam-400">out of 100</p>
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-hull-700/60 bg-hull-900/50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-foam-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foam-100">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-foam-400">{hint}</p> : null}
    </div>
  );
}
