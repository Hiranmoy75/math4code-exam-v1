'use client'
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Percent, Clock, Award } from "lucide-react"

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
  const cards = [
    {
      title: "Total Score",
      value: `${totalScore}/${totalMarks}`,
      icon: <Trophy className="w-5 h-5 text-emerald-600" />,
      gradient: "from-emerald-50 to-emerald-100",
      textColor: "text-emerald-700",
    },
    {
      title: "Percentage",
      value: `${percentage.toFixed(2)}%`,
      icon: <Percent className="w-5 h-5 text-indigo-500" />,
      gradient: "from-indigo-50 to-indigo-100",
      textColor: "text-indigo-700",
    },
    {
      title: "Status",
      value: "Submitted",
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      gradient: "from-amber-50 to-amber-100",
      textColor: "text-amber-700",
    },
    {
      title: "Rank",
      value: rank ?? "N/A",
      icon: <Award className="w-5 h-5 text-pink-500" />,
      gradient: "from-pink-50 to-pink-100",
      textColor: "text-pink-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
      {cards.map((card, i) => (
        <Card
          key={i}
          className={`bg-gradient-to-br ${card.gradient} rounded-2xl border-0 shadow-md hover:shadow-lg transition-all`}
        >
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-slate-500">{card.title}</p>
              <div className={`text-3xl font-bold mt-1 ${card.textColor}`}>
                {card.value}
              </div>
            </div>
            <div className="bg-white/70 p-2 rounded-full shadow-sm">{card.icon}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
