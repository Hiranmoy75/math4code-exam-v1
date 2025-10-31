// hooks/admin/exams/useExams.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export default function useExams() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["admin", "exams"],
    queryFn: async () => {
      // get user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData?.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("admin_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
