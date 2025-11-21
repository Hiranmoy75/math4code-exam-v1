"use client";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface QuestionFilters {
  page: number;
  pageSize: number;
  search?: string;
  subject?: string;
  difficulty?: string;
  qtype?: string;
}

export const useQuestions = (filters: QuestionFilters) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ["questions", filters],
    queryFn: async () => {
      // ✅ Fetch questions + nested options (joined from question_bank_options)
      let query = supabase
        .from("question_bank")
        .select(
          `
          *,
          question_bank_options (
            id,
            option_text,
            option_order,
            is_correct
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      // ✅ Apply filters
      if (filters.search?.trim()) {
        query = query.ilike("question_text", `%${filters.search}%`);
      }
      if (filters.subject && filters.subject !== "all") {
        query = query.eq("subject", filters.subject);
      }
      if (filters.difficulty && filters.difficulty !== "all") {
        query = query.eq("difficulty", filters.difficulty);
      }
      if (filters.qtype && filters.qtype !== "all") {
        query = query.eq("question_type", filters.qtype);
      }

      // ✅ Pagination
      const start = (filters.page - 1) * filters.pageSize;
      const end = start + filters.pageSize - 1;
      query = query.range(start, end);

      // ✅ Execute
      const { data, count, error } = await query;
      if (error) throw error;

      const totalPages = Math.ceil((count ?? 0) / filters.pageSize);
      return {
        rows: data ?? [],
        pages: totalPages,
        total: count ?? 0
      };
    },
    placeholderData: (previousData) => previousData, // smoother pagination
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
};
