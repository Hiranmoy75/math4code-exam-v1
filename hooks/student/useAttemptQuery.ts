// hooks/student/useAttemptQuery.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useAttemptQuery = (attemptId?: string) => {
  const supabase = createClient();
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: async () => {
      if (!attemptId) throw new Error("Missing attemptId");
      const { data: attempt } = await supabase.from("exam_attempts").select("*").eq("id", attemptId).single();
      if (!attempt) throw new Error("Attempt not found");
      const { data: exam } = await supabase.from("exams").select("*").eq("id", attempt.exam_id).single();
      const { data: sections } = await supabase
        .from("sections")
        .select("id,title,duration_minutes,total_marks,section_order")
        .eq("exam_id", attempt.exam_id)
        .order("section_order", { ascending: true });

      // attach questions + options
      if (sections && sections.length) {
        for (const s of sections) {
          const { data: questions } = await supabase
            .from("questions")
            .select("id,question_text,question_type,marks,correct_answer")
            .eq("section_id", s.id)
            .order("created_at", { ascending: true });
          // for each question load options
          for (const q of questions || []) {
            const { data: opts } = await supabase.from("options").select("id,option_text,is_correct,option_order").eq("question_id", q.id).order("option_order");
            (q as any).options = opts || [];
          }
          (s as any).questions = questions || [];
        }
      }

      const { data: responses } = await supabase.from("responses").select("*").eq("attempt_id", attemptId);

      return { attempt, exam, sections: sections || [], responses: responses || [] };
    },
    enabled: !!attemptId,
    staleTime: 1000 * 60 * 5,
  });
};
