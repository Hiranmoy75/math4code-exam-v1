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
        // প্রতিটি টেবিল নাম চেক করো তোমার আসল schema অনুযায়ী
        const exams = await supabase
          .from("exams") // যদি test_series হয়, এই নাম বদলাও
          .select("*", { count: "exact" })
          .eq("admin_id", userId);
        if (!exams.error) results.examsCount = exams.count ?? 0;

        const questions = await supabase
          .from("questions") // যদি sections বা অন্য নাম হয়, ঠিক করো
          .select("*", { count: "exact" })
          .eq("admin_id", userId);
        if (!questions.error) results.questionsCount = questions.count ?? 0;

        const attempts = await supabase
          .from("attempts") // যদি attempt_records হয়, ঠিক করো
          .select("*", { count: "exact" })
          .eq("admin_id", userId);
        if (!attempts.error) results.attemptsCount = attempts.count ?? 0;

        const students = await supabase
          .from("results") // যদি submissions হয়, ঠিক করো
          .select("student_id", { count: "exact", head: false })
          .eq("admin_id", userId);
        if (!students.error) {
          const uniqueIds = new Set(students.data?.map((s: any) => s.student_id));
          results.uniqueStudents = uniqueIds.size;
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        throw err;
      }

      return results;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};
