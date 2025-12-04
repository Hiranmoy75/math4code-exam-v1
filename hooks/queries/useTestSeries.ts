"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export function useTestSeries(filters?: { status?: string; search?: string }) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.testSeries.list(JSON.stringify(filters)),
        queryFn: async () => {
            let query = supabase
                .from("test_series")
                .select("id, title, description, price, is_free, status, created_at")
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

export function useTestSeriesDetail(seriesId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.testSeries.detail(seriesId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("test_series")
                .select("*")
                .eq("id", seriesId!)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!seriesId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useEnrolledTestSeries(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.testSeries.enrolled(userId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("test_series_enrollments")
                .select(`
          id,
          enrolled_at,
          status,
          test_series (
            id,
            title,
            description,
            price
          )
        `)
                .eq("student_id", userId!)
                .eq("status", "active")
                .order("enrolled_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 3, // 3 minutes
    });
}

export function useTestSeriesExams(seriesId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.testSeries.exams(seriesId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("test_series_exams")
                .select(`
          id,
          exam_order,
          max_attempts,
          exams (
            id,
            title,
            description,
            duration_minutes,
            total_marks,
            negative_marks
          )
        `)
                .eq("test_series_id", seriesId!)
                .order("exam_order", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!seriesId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
