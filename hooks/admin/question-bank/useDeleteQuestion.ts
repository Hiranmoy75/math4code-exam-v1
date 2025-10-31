"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useDeleteQuestion = () => {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // delete options first (no cascade)
      await supabase.from("question_bank_options").delete().eq("question_id", id);
      const { error } = await supabase.from("question_bank").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};
