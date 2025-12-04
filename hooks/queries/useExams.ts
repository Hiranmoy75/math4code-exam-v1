"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export function useExams(filters?: { status?: string; search?: string }) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.exams.list(JSON.stringify(filters)),
        queryFn: async () => {
            let query = supabase
                .from("exams")
                .select("id, title, description, duration_minutes, total_marks, status, created_at")
                .order("created_at", { ascending: false });

            if (filters?.status) {
                query = query.eq("status", filters.status);
            }

            if (filters?.search) {
                query = query.ilike("title", `%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useExam(examId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.exams.detail(examId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId!)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!examId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useExamSections(examId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.exams.sections(examId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sections")
                .select("id, title, duration_minutes, total_marks, section_order")
                .eq("exam_id", examId!)
                .order("section_order", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!examId,
        staleTime: 1000 * 60 * 15, // 15 minutes - sections rarely change
    });
}

export function useExamQuestions(sectionId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.exams.questions(sectionId!),
        queryFn: async () => {
            const { data: questions, error } = await supabase
                .from("questions")
                .select("id, question_text, question_type, marks, correct_answer, created_at")
                .eq("section_id", sectionId!)
                .order("created_at", { ascending: true });

            if (error) throw error;

            // Fetch options for each question
            const questionsWithOptions = await Promise.all(
                (questions || []).map(async (question) => {
                    const { data: options } = await supabase
                        .from("options")
                        .select("id, option_text, is_correct, option_order")
                        .eq("question_id", question.id)
                        .order("option_order", { ascending: true });

                    return {
                        ...question,
                        options: options || [],
                    };
                })
            );

            return questionsWithOptions;
        },
        enabled: !!sectionId,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}
