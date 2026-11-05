"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; registrations: number };

/**
 * Registration trend. Recharts is used for accessibility-friendly axes and
 * tooltips; the palette is drawn from the brand, not from the default theme.
 */
export function TrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[220px] w-full" role="img" aria-label="Daily registrations over the last 14 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#02C58A" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#02C58A" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#111111" strokeOpacity={0.06} vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            interval={1}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={44}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 2,
              border: "1px solid rgba(17,17,17,0.14)",
              boxShadow: "none",
              background: "#ffffff",
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ fontWeight: 600, color: "#111111", marginBottom: 2 }}
            itemStyle={{ color: "#02C58A" }}
            formatter={(v) => [`${v} registrations`, ""]}
            cursor={{ stroke: "#111111", strokeOpacity: 0.2, strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="registrations"
            stroke="#02C58A"
            strokeWidth={2}
            fill="url(#regFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: "#02C58A", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


export type BarPoint = { name: string } & Record<string, string | number>;

const SERIES_COLOURS = ["#8B3FF0", "#02C58A", "#08B1F2", "#D803E5"];

/**
 * Multi-series comparison chart (registered vs attended, arrivals by hour).
 * Series are declared explicitly so the legend and colours stay stable and
 * accessible regardless of the data shape.
 */
export function ComparisonChart({
  data,
  keys,
  labels,
  height = 200,
  ariaLabel = "Comparison chart",
}: {
  data: BarPoint[];
  keys: string[];
  labels: Record<string, string>;
  height?: number;
  ariaLabel?: string;
}) {
  return (
    <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#111111" strokeOpacity={0.06} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8A8A8A" }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid rgba(17,17,17,0.09)",
              fontSize: 12,
              padding: "8px 10px",
            }}
            labelStyle={{ fontWeight: 600, color: "#111111", marginBottom: 2 }}
            cursor={{ fill: "rgba(17,17,17,0.04)" }}
          />
          {keys.length > 1 && (
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
            />
          )}
          {keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              name={labels[key] ?? key}
              fill={SERIES_COLOURS[i % SERIES_COLOURS.length]}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
