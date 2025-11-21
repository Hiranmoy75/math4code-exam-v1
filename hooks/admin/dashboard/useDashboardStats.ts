"use client";
import { useQuery } from "@tanstack/react-query";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface DashboardStats {
  examsCount: number;
  questionsCount: number;
  attemptsCount: number;
  uniqueStudents: number;
}

export const useDashboardStats = (userId: string) => {
  const supabase = createClientComponentClient();

  return useQuery<DashboardStats>({
    queryKey: ["admin-dashboard-stats", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No userId provided");

      const results: DashboardStats = {
        examsCount: 0,
        questionsCount: 0,
        attemptsCount: 0,
        uniqueStudents: 0,
      };

      try {
        // 1. Exams Count
        const { count: examsCount, error: examsError } = await supabase
          .from("exams")
          .select("*", { count: "exact", head: true })
          .eq("admin_id", userId);

        if (!examsError) results.examsCount = examsCount || 0;

        // 2. Questions Count (Need to join with sections -> exams)
        // Since Supabase doesn't support deep joins for count easily in one go without RPC, 
        // we might need to do it differently or use a view. 
        // For now, let's try to get all exams IDs first, then count questions.
        // Optimization: If there are too many exams, this might be slow. 
        // A better approach is to create a Database View or RPC. 
        // For this implementation, we will assume a reasonable number of exams.

        const { data: exams } = await supabase
          .from("exams")
          .select("id")
          .eq("admin_id", userId);

        if (exams && exams.length > 0) {
          const examIds = exams.map(e => e.id);

          // Get sections for these exams
          const { data: sections } = await supabase
            .from("sections")
            .select("id")
            .in("exam_id", examIds);

          if (sections && sections.length > 0) {
            const sectionIds = sections.map(s => s.id);
            const { count: qCount } = await supabase
              .from("questions")
              .select("*", { count: "exact", head: true })
              .in("section_id", sectionIds);

            results.questionsCount = qCount || 0;
          }

          // 3. Attempts Count
          const { count: aCount, data: attemptsData } = await supabase
            .from("exam_attempts")
            .select("student_id", { count: "exact" })
            .in("exam_id", examIds);

          results.attemptsCount = aCount || 0;

          // 4. Unique Students
          if (attemptsData) {
            const uniqueIds = new Set(attemptsData.map((a: any) => a.student_id));
            results.uniqueStudents = uniqueIds.size;
          }
        }

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        // Don't throw, return partial results
      }

      return results;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
