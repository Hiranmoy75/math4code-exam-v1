"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export const useUpdateExam = () => {
  const supabase = createClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload: any }) => {
      const { error } = await supabase
        .from("exams")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", examId);
      if (error) throw error;
      return payload;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["exam", vars.examId] });
      qc.invalidateQueries({ queryKey: ["admin", "exams"] });
      toast.success("Exam updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Update failed!");
    },
  });
};
