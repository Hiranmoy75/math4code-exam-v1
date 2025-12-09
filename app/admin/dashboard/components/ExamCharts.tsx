"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface Props { userId: string }

export default function ExamCharts({ userId }: Props) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-charts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_admin_chart_data', { admin_uuid: userId });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Default empty state for charts
  const chartData = data || [
    { name: "Mon", attempts: 0, avgScore: 0 },
    { name: "Tue", attempts: 0, avgScore: 0 },
    { name: "Wed", attempts: 0, avgScore: 0 },
    { name: "Thu", attempts: 0, avgScore: 0 },
    { name: "Fri", attempts: 0, avgScore: 0 },
    { name: "Sat", attempts: 0, avgScore: 0 },
    { name: "Sun", attempts: 0, avgScore: 0 },
  ];

  const attemptsData = chartData.map((d: any) => ({ name: d.name, attempts: d.attempts }));
  const performanceData = chartData.map((d: any) => ({ name: d.name, avgScore: d.avgScore }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px] w-full bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="h-[400px] w-full bg-white/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-none shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Exam Attempts (Last 7 Days)</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Daily student submissions</CardDescription>
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
                  allowDecimals={false}
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
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Performance Trend (Last 7 Days)</CardTitle>
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
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Avg Score']}
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
