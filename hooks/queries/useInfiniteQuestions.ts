"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

interface QuestionFilters {
    search?: string;
    type?: string;
    examId?: string;
}

export function useInfiniteQuestions(filters?: QuestionFilters) {
    const supabase = createClient();

    return useInfiniteQuery({
        queryKey: queryKeys.admin.questionBank(JSON.stringify(filters)),
        queryFn: async ({ pageParam = 0 }) => {
            let query = supabase
                .from("questions")
                .select(
                    `
          id,
          question_text,
          question_type,
          marks,
          created_at,
          sections (
            id,
            title,
            exams (
              id,
              title
            )
          )
        `,
                    { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

            if (filters?.search) {
                query = query.ilike("question_text", `%${filters.search}%`);
            }

            if (filters?.type) {
                query = query.eq("question_type", filters.type);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                questions: data,
                nextCursor: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
                totalCount: count,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 0,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
