"use client"

import { renderWithLatex } from "@/lib/renderWithLatex"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function QuestionExplanation({ questionId }: { questionId: string }) {
  const supabase = createClient()
  const [q, setQ] = useState<any>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("question_bank").select("question_type,correct_answer,explanation").eq("id", questionId).single()
      setQ(data)
    })()
  }, [questionId, supabase])

  if (!q) return null

  return (
    <div className="space-y-2">
      {q.question_type === "NAT" && q.correct_answer ? (
        <div className="text-sm">
          <span className="font-semibold">Correct Answer:</span> <span className="text-slate-700 dark:text-slate-200">{renderWithLatex(q.correct_answer)}</span>
        </div>
      ) : null}
      {q.explanation ? (
        <div>
          <div className="text-sm font-semibold mb-1">Explanation</div>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{renderWithLatex(q.explanation)}</div>
        </div>
      ) : null}
    </div>
  )
}
