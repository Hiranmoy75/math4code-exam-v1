'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"

export function SectionBarChart({ data }: { data: any[] }) {
  const OBTAINED_COLOR = "#60a5fa" // sky-400
  const TOTAL_COLOR = "#cbd5e1" // slate-300 (light neutral)
  const GRADIENT_ID_OBTAINED = "colorObtained"
  const GRADIENT_ID_TOTAL = "colorTotal"

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border-0 shadow-md rounded-3xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
          📘 Section-wise Performance
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Comparison between obtained and total marks per section
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <defs>
                <linearGradient id={GRADIENT_ID_OBTAINED} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id={GRADIENT_ID_TOTAL} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                axisLine={false}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                  color: "#334155",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "13px",
                  color: "#475569",
                  marginTop: 12,
                }}
              />

              {/* Total Marks (light neutral) */}
              <Bar
                dataKey="total"
                fill={`url(#${GRADIENT_ID_TOTAL})`}
                name="Total Marks"
                radius={[10, 10, 0, 0]}
                barSize={32}
              >
                {data.map((_, idx) => (
                  <Cell key={`total-${idx}`} />
                ))}
              </Bar>

              {/* Obtained Marks (vibrant blue gradient) */}
              <Bar
                dataKey="obtained"
                fill={`url(#${GRADIENT_ID_OBTAINED})`}
                name="Obtained Marks"
                radius={[10, 10, 0, 0]}
                barSize={32}
              >
                {data.map((_, idx) => (
                  <Cell key={`obtained-${idx}`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
