export default function ProgressBar({
  label,
  value,
  target,
  format = (n: number) => n.toFixed(0),
  invert = false,
}: {
  label: string;
  value: number;
  target: number;
  format?: (n: number) => string;
  invert?: boolean; // true when lower is better (e.g. churn)
}) {
  const pctRaw = target > 0 ? (value / target) * 100 : 0;
  const pctClamped = Math.max(0, Math.min(100, pctRaw));
  const good = invert ? value <= target : pctRaw >= 100;
  const barColor = good ? "bg-accent" : pctClamped > 60 ? "bg-amber-500" : "bg-red-500";
  const width = invert ? Math.max(0, Math.min(100, pctRaw)) : pctClamped;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="text-muted tabular-nums">
          {format(value)} / {format(target)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
