'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ScoreSummary({
  totalScore,
  totalMarks,
  percentage,
  rank,
}: {
  totalScore: number
  totalMarks: number
  percentage: number
  rank: number | null
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Total Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalScore}</div>
          <p className="text-xs text-gray-500 mt-1">out of {totalMarks}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Percentage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{percentage.toFixed(2)}%</div>
          <p className="text-xs text-gray-500 mt-1">Performance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Rank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{rank ?? "N/A"}</div>
          <p className="text-xs text-gray-500 mt-1">Among all attempts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-600">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-green-600">Submitted</div>
          <p className="text-xs text-gray-500 mt-1">Exam completed</p>
        </CardContent>
      </Card>
    </div>
  )
}
