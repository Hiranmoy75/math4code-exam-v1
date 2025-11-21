"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface Props { userId: string }

export default function ExamCharts({ userId }: Props) {
  const [attemptsData, setAttemptsData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    // TODO: Fetch real data from API
    setAttemptsData([
      { name: "Mon", attempts: 12 },
      { name: "Tue", attempts: 19 },
      { name: "Wed", attempts: 15 },
      { name: "Thu", attempts: 25 },
      { name: "Fri", attempts: 22 },
      { name: "Sat", attempts: 18 },
      { name: "Sun", attempts: 14 },
    ]);
    setPerformanceData([
      { name: "Mon", avgScore: 78 },
      { name: "Tue", avgScore: 82 },
      { name: "Wed", avgScore: 80 },
      { name: "Thu", avgScore: 85 },
      { name: "Fri", avgScore: 88 },
      { name: "Sat", avgScore: 90 },
      { name: "Sun", avgScore: 87 },
    ]);
  }, [userId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Exam Attempts</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Weekly student submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attemptsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar
                  dataKey="attempts"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Performance Trend</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Average student scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
