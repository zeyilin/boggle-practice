"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WordLengthData } from "@/lib/stats-calculator";

interface WordLengthChartProps {
  data: WordLengthData[];
}

export function WordLengthChart({ data }: WordLengthChartProps) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="length"
            tick={{ fontSize: 11 }}
            stroke="#71717a"
            label={{ value: "Word length", position: "insideBottom", offset: -5, fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} stroke="#71717a" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [String(v), "Words"]}
            labelFormatter={(v) => `${v} letters`}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
