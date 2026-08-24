"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS: Record<string, string> = {
  voorsprong: "#2f5c4f",
  audit: "#7ac8b0",
  traject: "#d99a4e",
  retainer: "#6b8fb0",
  workshop: "#b06b8f",
  challenge: "#c2c24e",
  other: "#9c9c94",
};

export default function RevenueByPijlerChart({
  data,
}: {
  data: Record<string, number | string>[];
}) {
  const keys = Object.keys(COLORS);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
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
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k) => (
            <Bar key={k} dataKey={k} stackId="a" fill={COLORS[k]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
