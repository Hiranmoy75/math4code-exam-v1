'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function SectionBarChart({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Section-wise Performance</CardTitle>
        <CardDescription>Score breakdown by section</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="obtained" fill="#3b82f6" name="Obtained" />
            <Bar dataKey="total" fill="#e5e7eb" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
