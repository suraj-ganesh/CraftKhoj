"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

export function RevenueTrend({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="chart-panel" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#88D9E6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#88D9E6" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#374B4A22" strokeDasharray="0" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#526760", fontFamily: "'DM Sans'" }} axisLine={{ stroke: "#374B4A" }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#526760", fontFamily: "'DM Sans'" }} axisLine={{ stroke: "#374B4A" }} tickLine={false} />
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} contentStyle={{ border: "2px solid #374B4A", borderRadius: 0, fontFamily: "'DM Sans'", fontSize: 12 }} />
          <Area type="monotone" dataKey="revenue" stroke="#374B4A" strokeWidth={2.5} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ["#88D9E6", "#C5FFFD", "#8B8BAE", "#526760", "#F5B301", "#8CD867", "#F28C8C"];

export function CategoryPie({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="chart-panel" style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={95} innerRadius={55} stroke="#374B4A" strokeWidth={1.5} paddingAngle={2}>
            {data.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ border: "2px solid #374B4A", borderRadius: 0, fontFamily: "'DM Sans'", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans'" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DemandChart({ data }: { data: { label: string; forecast: number }[] }) {
  return (
    <div className="chart-panel" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#374B4A22" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#526760", fontFamily: "'DM Sans'" }} axisLine={{ stroke: "#374B4A" }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#526760", fontFamily: "'DM Sans'" }} axisLine={{ stroke: "#374B4A" }} tickLine={false} />
          <Tooltip formatter={(v: number) => [`${v} units`, "Forecast"]} contentStyle={{ border: "2px solid #374B4A", borderRadius: 0, fontFamily: "'DM Sans'", fontSize: 12 }} />
          <Bar dataKey="forecast" fill="#8B8BAE" stroke="#374B4A" strokeWidth={1.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
