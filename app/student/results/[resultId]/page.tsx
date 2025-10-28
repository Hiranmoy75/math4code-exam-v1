import { createClient } from "@/lib/supabase/server"
import { ResultHeader } from "./components/ResultHeader"
import { ScoreSummary } from "./components/ScoreSummary"
import { SectionBarChart } from "./components/SectionBarChart"
import { AnswerPieChart } from "./components/AnswerPieChart"
import { SectionTable } from "./components/SectionTable"

export default async function ResultDetailPage({ params }: { params: { resultId: string } }) {
  const supabase = await createClient()

  const { data: result } = await supabase
    .from("results")
    .select("*, exam_attempts(exam_id, exams(title, total_marks))")
    .eq("id", params.resultId)
    .single()

  if (!result) return <div className="text-center text-gray-500 py-20">Result not found</div>

  const { data: sectionResults } = await supabase
    .from("section_results")
    .select("*, sections(title)")
    .eq("result_id", params.resultId)

  const chartData = sectionResults?.map((sr: any) => ({
    name: sr.sections.title,
    obtained: sr.obtained_marks,
    total: sr.total_marks,
  }))

  const pieData = [
    {
      name: "Correct",
      value:
        sectionResults?.reduce(
          (sum: number, sr: any) => sum + sr.correct_answers,
          0
        ) || 0,
      fill: "#22c55e",
    },
    {
      name: "Wrong",
      value:
        sectionResults?.reduce(
          (sum: number, sr: any) => sum + sr.wrong_answers,
          0
        ) || 0,
      fill: "#ef4444",
    },
    {
      name: "Unanswered",
      value:
        sectionResults?.reduce(
          (sum: number, sr: any) => sum + sr.unanswered,
          0
        ) || 0,
      fill: "#94a3b8",
    },
  ]

  return (
    <div className="space-y-8 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black rounded-3xl p-6 md:p-10 shadow-lg">
      <ResultHeader title={result.exam_attempts.exams.title} />

      <ScoreSummary
        totalScore={result.obtained_marks}
        totalMarks={result.total_marks}
        percentage={result.percentage}
        rank={result.rank}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SectionBarChart data={chartData} />
        <AnswerPieChart data={pieData} />
      </div>

      <SectionTable data={sectionResults || []} />
    </div>
  )
}
