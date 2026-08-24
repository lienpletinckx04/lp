"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MrrChart({
  data,
}: {
  data: { month: string; mrr: number; target: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
          <YAxis tick={{ fontSize: 11, fill: "rgb(var(--muted))" }} />
          <Tooltip
            contentStyle={{
              background: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="mrr" stroke="#2f5c4f" strokeWidth={2} dot={false} name="MRR" />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#d99a4e"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Doel"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
