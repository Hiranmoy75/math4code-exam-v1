"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function removeExamFromSeries(seriesId: string, examId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("test_series_exams")
    .delete()
    .eq("test_series_id", seriesId)
    .eq("exam_id", examId)

  if (error) throw error
  revalidatePath(`/admin/test-series/${seriesId}`)
  return { success: true }
}

export async function addExamToSeries(seriesId: string, examId: string, examOrder: number) {
  const supabase = await createClient()
  const { error } = await supabase.from("test_series_exams").insert([
    {
      test_series_id: seriesId,
      exam_id: examId,
      exam_order: examOrder,
    },
  ])

  if (error) throw error
  revalidatePath(`/admin/test-series/${seriesId}`)
  return { success: true }
}
export async function publishTestSeries(seriesId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from("test_series")
        .update({ status: "published" })
        .eq("id", seriesId)

    if (error) {
        console.error("Error publishing test series:", error)
    }

    // Revalidate the current page to show the updated status immediately
    revalidatePath(`/admin/test-series/${seriesId}`)
}