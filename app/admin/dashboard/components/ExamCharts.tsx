"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface Props { userId: string }

export default function ExamCharts({ userId }: Props) {
  const [attemptsData, setAttemptsData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    // Hardcoded for demo
    setAttemptsData([
      { name: "Mon", attempts: 12 },
      { name: "Tue", attempts: 19 },
      { name: "Wed", attempts: 15 },
      { name: "Thu", attempts: 25 },
      { name: "Fri", attempts: 22 },
      { name: "Sat", attempts: 18 },
      { name: "Sun", attempts: 14 },
    ])
    setPerformanceData([
      { name: "Mon", avgScore: 78 },
      { name: "Tue", avgScore: 82 },
      { name: "Wed", avgScore: 80 },
      { name: "Thu", avgScore: 85 },
      { name: "Fri", avgScore: 88 },
      { name: "Sat", avgScore: 90 },
      { name: "Sun", avgScore: 87 },
    ])
  }, [userId])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-400/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <CardHeader>
          <CardTitle>Exam Attempts</CardTitle>
          <CardDescription>Weekly submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attemptsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attempts" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-indigo-400/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Average scores</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="avgScore" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
