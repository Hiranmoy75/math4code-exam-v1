"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SeriesStats({
  totalExams,
  price,
  status,
}: {
  totalExams: number
  price: string
  status: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Total Exams" value={totalExams} />
      <StatCard title="Price" value={price} />
      <StatCard
        title="Status"
        value={status}
        valueClass={
          status === "published" ? "text-green-600" : "text-yellow-600"
        }
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  valueClass,
}: {
  title: string
  value: string | number
  valueClass?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClass || ""}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
