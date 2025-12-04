"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queryKeys";

export function useCourses(filters?: { status?: string; search?: string }) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.courses.list(JSON.stringify(filters)),
        queryFn: async () => {
            let query = supabase
                .from("courses")
                .select("id, title, description, price, is_free, thumbnail_url, status, created_at")
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

export function useCourse(courseId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.courses.detail(courseId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("id", courseId!)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!courseId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useEnrolledCourses(userId: string | undefined) {
    const supabase = createClient();

    return useQuery({
        queryKey: queryKeys.courses.enrolled(userId!),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("enrollments")
                .select(`
          id,
          enrolled_at,
          progress,
          completed,
          courses (
            id,
            title,
            description,
            thumbnail_url,
            price
          )
        `)
                .eq("user_id", userId!)
                .eq("status", "active")
                .order("enrolled_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 3, // 3 minutes
    });
}
