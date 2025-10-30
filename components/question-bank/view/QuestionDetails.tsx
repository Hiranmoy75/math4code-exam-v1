"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Pill } from "../ui"
import { renderWithLatex } from "@/lib/renderWithLatex"

export default function QuestionDetails({ questionId }: { questionId: string }) {
  const supabase = createClient()
  const [q, setQ] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("question_bank").select("*").eq("id", questionId).single()
      setQ(data)
    })()
  }, [questionId, supabase])

  if (!q) return null

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">{renderWithLatex(q.title)}</div>
      <div className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{renderWithLatex(q.question_text)}</div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Pill color="blue">{q.subject || "Subject —"}</Pill>
        <Pill color={q.difficulty === "easy" ? "mint" : q.difficulty === "medium" ? "amber" : "red"}>
          {q.difficulty?.toUpperCase() || "DIFFICULTY —"}
        </Pill>
        <Pill color={q.question_type === "MCQ" ? "violet" : q.question_type === "MSQ" ? "pink" : "mint"}>
          {q.question_type}
        </Pill>
        <Pill color="gray">Marks: {q.marks}</Pill>
        {q.negative_marks ? <Pill color="red">- {q.negative_marks}</Pill> : null}
      </div>
    </div>
  )
}
