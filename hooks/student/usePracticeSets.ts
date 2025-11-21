// hooks/student/usePracticeSets.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export const usePracticeSets = () => {
  const supabase = createClient();
  return useQuery({
    queryKey: ["student", "practice_sets"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u?.user?.id;
      if (!userId) return [];
      const { data, error } = await supabase
        .from("exams")
        .select("id,title,total_marks,created_at")
        .eq("created_by", userId)
        .eq("is_practice", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};
