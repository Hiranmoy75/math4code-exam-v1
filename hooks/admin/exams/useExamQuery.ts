"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Fetches an exam and its related sections.
 */
export const useExamQuery = (examId: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      if (!examId) throw new Error("Missing exam ID");

      // 1️⃣ Fetch exam details
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError) {
        console.error("Exam fetch error:", examError);
        throw examError;
      }

      if (!exam) throw new Error("Exam not found.");

      // 2️⃣ Fetch all sections belonging to this exam
      const { data: sections, error: secError } = await supabase
        .from("sections")
        .select("id, title, duration_minutes, total_marks, section_order, created_at")
        .eq("exam_id", examId)
        .order("section_order", { ascending: true });

      if (secError) {
        console.error("Section fetch error:", secError);
        throw secError;
      }

      return { ...exam, sections: sections ?? [] };
    },
    enabled: !!examId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};
