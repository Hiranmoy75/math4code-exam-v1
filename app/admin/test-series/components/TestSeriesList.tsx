// app/admin/test-series/components/TestSeriesList.tsx
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import TestSeriesCard from "./TestSeriesCard"
import EmptyState from "./EmptyState"

export default async function TestSeriesList() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: testSeries } = await supabase
    .from("test_series")
    .select("*")
    .eq("admin_id", user?.id)
    .order("created_at", { ascending: false })

  async function handleDelete(formData: FormData) {
    "use server"
    const id = formData.get("id") as string
    const supabase = await createClient()
    await supabase.from("test_series").delete().eq("id", id)
    revalidatePath("/admin/test-series")
  }

  if (!testSeries || testSeries.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {testSeries.map((series) => (
        <TestSeriesCard key={series.id} series={series} handleDelete={handleDelete} />
      ))}
    </div>
  )
}
