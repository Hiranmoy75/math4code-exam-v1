// hooks/student/useSaveResponse.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useSaveResponse = () => {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attempt_id, question_id, student_answer, is_marked_for_review = false }: any) => {
      // upsert style: see if exists
      const { data: existing } = await supabase
        .from("responses")
        .select("id")
        .eq("attempt_id", attempt_id)
        .eq("question_id", question_id)
        .limit(1)
        .single();

      if (existing?.id) {
        const { error } = await supabase
          .from("responses")
          .update({ student_answer, is_marked_for_review, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["attempt", attempt_id] });
        return existing.id;
      } else {
        const { data, error } = await supabase
          .from("responses")
          .insert([{ attempt_id, question_id, student_answer, is_marked_for_review }])
          .select("id")
          .single();
        if (error) throw error;
        qc.invalidateQueries({ queryKey: ["attempt", attempt_id] });
        return data.id;
      }
    },
    onError: (err:any) => { console.error(err); }
  });
};
