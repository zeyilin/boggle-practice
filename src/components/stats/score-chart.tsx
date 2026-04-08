"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/stats-calculator";

interface ScoreChartProps {
  data: ChartDataPoint[];
  dataKey: "score" | "discoveryRate";
  color: string;
  yLabel?: string;
}

export function ScoreChart({ data, dataKey, color, yLabel }: ScoreChartProps) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11 }}
            stroke="#71717a"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#71717a"
            tickFormatter={(v) => `${v}${yLabel ?? ""}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(v) => `Game ${v}`}
            formatter={(v) => [`${v}${yLabel ?? ""}`, dataKey === "score" ? "Score" : "Discovery"]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
