"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { renderWithLatex } from "@/lib/renderWithLatex"

export default function OptionList({ questionId }: { questionId: string }) {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [type, setType] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: q } = await supabase.from("question_bank").select("question_type").eq("id", questionId).single()
      setType(q?.question_type ?? null)
      if (q?.question_type !== "NAT") {
        const { data } = await supabase
          .from("question_bank_options")
          .select("*")
          .eq("question_id", questionId)
          .order("option_order", { ascending: true })
        setRows(data ?? [])
      } else {
        setRows([])
      }
    })()
  }, [questionId, supabase])

  if (type === "NAT") return null
  if (rows.length === 0) return null

  return (
    <div>
      <div className="text-sm font-semibold mb-2">Options</div>
      <ul className="space-y-2">
        {rows.map((o) => (
          <li key={o.id} className="flex items-start gap-2">
            <div className={`mt-0.5 ${o.is_correct ? "text-emerald-600" : "text-slate-400"}`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className={o.is_correct ? "font-medium text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}>
              {renderWithLatex(o.option_text)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
