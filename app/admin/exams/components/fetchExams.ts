import { createClient } from "@/lib/supabase/server"

export default async function fetchExams() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("admin_id", user?.id)
    .order("created_at", { ascending: false })

  return exams || []
}
