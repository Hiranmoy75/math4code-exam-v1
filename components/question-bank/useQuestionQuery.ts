export type Option = {
  id: string
  question_id: string
  text: string
  is_correct: boolean
}

export type BankRow = {
  id: string
  admin_id: string
  title: string
  question_text: string
  question_type: "MCQ" | "MSQ" | "NAT"
  marks: number
  negative_marks: number | null
  correct_answer: string | null
  explanation: string | null
  subject: string | null
  topic: string | null
  difficulty: "easy" | "medium" | "hard" | null
  created_at?: string | null
  updated_at?: string | null

  // ✅ Added new
  question_bank_options?: Option[] // list of options
}


// export function useQuestionQuery(filters: Filters) {
//   const supabase = createClient()
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [rows, setRows] = useState<BankRow[]>([])
//   const [total, setTotal] = useState(0)

//   const { search, subject, difficulty, qtype, page = 1, pageSize = 10 } = filters
//   const from = (page - 1) * pageSize
//   const to = from + pageSize - 1

//   useEffect(() => {
//     let cancelled = false
//     ;(async () => {
//       setLoading(true); setError(null)
//       try {
//         let q = supabase
//           .from("question_bank")
//           .select("*", { count: "exact" })
//           .order("created_at", { ascending: false })

//         if (search?.trim()) q = q.ilike("question_text", `%${search}%`)
//         if (subject && subject !== "all") q = q.eq("subject", subject)
//         if (difficulty && difficulty !== "all") q = q.eq("difficulty", difficulty)
//         if (qtype && qtype !== "all") q = q.eq("question_type", qtype.toUpperCase())

//         q = q.range(from, to)

//         const { data, error, count } = await q
//         if (error) throw error
//         if (!cancelled) {
//           setRows((data ?? []) as any)
//           setTotal(count ?? 0)
//         }
//       } catch (e: any) {
//         if (!cancelled) setError(e.message || "Failed to load")
//       } finally {
//         if (!cancelled) setLoading(false)
//       }
//     })()
//     return () => { cancelled = true }
//   }, [search, subject, difficulty, qtype, page, pageSize, supabase])

//   const pages = useMemo(() => Math.max(1, Math.ceil((total || 0) / (pageSize || 10))), [total, pageSize])
//   return { loading, error, rows, total, pages }
// }