'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const COLORS = ["#22c55e", "#ef4444", "#94a3b8"]

export function AnswerPieChart({ data }: { data: any[] }) {
  return (
    <Card className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md rounded-3xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
          🧠 Answer Distribution
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Correct, wrong, and unanswered ratio
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
