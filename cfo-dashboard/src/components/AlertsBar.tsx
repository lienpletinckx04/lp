type Alert = { id: string; severity: "red" | "amber"; message: string };

export default function AlertsBar({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="chip-ok rounded-lg px-4 py-3 text-sm font-medium">
        Geen actieve alerts — alles binnen de lijnen.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`${a.severity === "red" ? "chip-red" : "chip-amber"} rounded-lg px-4 py-3 text-sm font-medium`}
        >
          {a.severity === "red" ? "● " : "▲ "}
          {a.message}
        </div>
      ))}
    </div>
  );
}
