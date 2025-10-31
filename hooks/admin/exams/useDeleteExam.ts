// hooks/admin/exams/useDeleteExam.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export default function useDeleteExam() {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (examId: string) => {
      // delete dependent records if necessary (sections/questions) depending on your schema
      // for safety below we delete exam rows only (change if cascade is needed)
      const { error } = await supabase.from("exams").delete().eq("id", examId);
      if (error) throw error;
      return examId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exams"] });
    },
  });
}
