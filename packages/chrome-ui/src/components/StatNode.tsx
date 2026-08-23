import type { JSX } from "react";

export type StatTone = "neutral" | "ok" | "warn" | "error";
export type StatSize = "regular" | "large";

export const STAT_PENDING = "…";

export interface StatNodeProps {
  readonly label: string;
  readonly value: string | number | null;
  readonly unit?: string;
  readonly tone?: StatTone;
  readonly size?: StatSize;
  readonly detail?: string | null;
  readonly testId?: string;
}

export function StatNode({
  label,
  value,
  unit = "",
  tone = "neutral",
  size = "regular",
  detail = null,
  testId,
}: StatNodeProps): JSX.Element {
  const reportedTone: StatTone | "pending" = value === null ? "pending" : tone;
  const classes = [
    "stat__value",
    `stat--${reportedTone}`,
    size === "large" ? "stat--large" : "",
  ]
    .filter((c) => c !== "")
    .join(" ");
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <span className={classes} data-testid={testId} data-tone={reportedTone}>
          {value === null ? (
            <span
              className="stat__pending"
              title={`${label}: no data yet`}
            >
              {STAT_PENDING}
            </span>
          ) : (
            `${value}${unit}`
          )}
        </span>
        {detail !== null && detail !== "" ? (
          <span className="stat__detail">{detail}</span>
        ) : null}
      </dd>
    </>
  );
}
