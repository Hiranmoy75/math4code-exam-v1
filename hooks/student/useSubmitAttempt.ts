// hooks/student/useSubmitAttempt.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const useSubmitAttempt = () => {
  const supabase = createClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const { error } = await supabase.from("exam_attempts").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", attemptId);
      if (error) throw error;

      // Optionally call an RPC to grade attempt on server if you have such function.
      // await supabase.rpc("grade_attempt", { attempt_uuid: attemptId });

      qc.invalidateQueries({ queryKey: ["attempt", attemptId] });
      return attemptId;
    },
  });
};
