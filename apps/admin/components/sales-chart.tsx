/**
 * Sales line chart from the mockup: this period (solid, filled) vs the previous period (dashed),
 * drawn as SVG on the server. Values scale to the larger of the two series.
 */
export function SalesChart({
  current,
  previous,
  ticks,
  ariaLabel,
}: {
  current: number[];
  previous: number[];
  ticks: string[];
  ariaLabel: string;
}) {
  const W = 1000;
  const H = 260;
  const top = 20;
  const bottom = 240;
  const max = Math.max(1, ...current, ...previous);
  const x = (i: number, n: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => bottom - (v / max) * (bottom - top);
  const path = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i, values.length).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(" ");
  const line = path(current);
  const area = current.length > 1 ? `${line} L${W} ${bottom} L0 ${bottom} Z` : "";

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
        className="block h-[180px] w-full md:h-[260px]"
      >
        <path
          d="M0 40H1000M0 100H1000M0 160H1000M0 220H1000"
          stroke="#ececea"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {area ? <path d={area} fill="rgba(35,76,46,0.08)" stroke="none" /> : null}
        <path
          d={path(previous)}
          fill="none"
          stroke="#b9c4b6"
          strokeWidth="2"
          strokeDasharray="5 6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={line}
          fill="none"
          stroke="#234c2e"
          strokeWidth="2.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="text-admin-muted flex justify-between pt-2 text-[14px]">
        {ticks.map((t, i) => (
          <span key={`${t}-${i}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}
