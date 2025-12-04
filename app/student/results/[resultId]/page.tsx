import { createClient } from "@/lib/supabase/server"
import { ResultHeader } from "./components/ResultHeader"
import { ScoreSummary } from "./components/ScoreSummary"
import { SectionBarChart } from "./components/SectionBarChart"
import { AnswerPieChart } from "./components/AnswerPieChart"
import { SectionTable } from "./components/SectionTable"

export default async function ResultDetailPage({ params, searchParams }: { params: Promise<{ resultId: string }>, searchParams: Promise<{ attemptId?: string }> }) {
  const supabase = await createClient()
  const { resultId } = await params;
  const { attemptId } = await searchParams

  console.log("Result ID:", resultId)
  console.log("Attempt ID:", attemptId)

  const { data: result } = await supabase
    .from("results")
    .select("*, exam_attempts(exam_id, exams(title, total_marks))")
    .eq("id", resultId)
    .single()

  if (!result)
    return <div className="text-center text-gray-500 py-20">Result not found</div>

  const { data: sectionResults } = await supabase
    .from("section_results")
    .select("*, sections(title)")
    .eq("result_id", resultId)

  const chartData = sectionResults?.map((sr: any) => ({
    name: sr.sections.title,
    obtained: sr.obtained_marks,
    total: sr.total_marks,
  }))

  const pieData = [
    {
      name: "Correct",
      value: sectionResults?.reduce((sum: number, sr: any) => sum + sr.correct_answers, 0) || 0,
      fill: "#22c55e",
    },
    {
      name: "Wrong",
      value: sectionResults?.reduce((sum: number, sr: any) => sum + sr.wrong_answers, 0) || 0,
      fill: "#ef4444",
    },
    {
      name: "Unanswered",
      value: sectionResults?.reduce((sum: number, sr: any) => sum + sr.unanswered, 0) || 0,
      fill: "#94a3b8",
    },
  ]

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 md:py-10 
      bg-gradient-to-b from-white via-slate-50 to-slate-100 
      dark:from-slate-900 dark:via-slate-950 dark:to-black 
      rounded-2xl md:rounded-3xl shadow-lg overflow-x-hidden">

        <ResultHeader title={result.exam_attempts.exams.title} attemptId={attemptId} />

        <div className="mt-6 sm:mt-8">
          <ScoreSummary
            totalScore={result.obtained_marks}
            totalMarks={result.total_marks}
            percentage={result.percentage}
            rank={result.rank}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mt-8">
          <SectionBarChart data={chartData || []} />
          <AnswerPieChart data={pieData} />
        </div>

        <div className="mt-8">
          <SectionTable data={sectionResults || []} />
        </div>
      </div>

    </>
  )
}
