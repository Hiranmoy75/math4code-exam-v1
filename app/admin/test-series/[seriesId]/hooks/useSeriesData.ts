"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { addExamToSeries, removeExamFromSeries, publishTestSeries, reorderExamsInSeries } from "../../actions";
import { toast } from "sonner";

export function useSeriesExams(seriesId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["series-exams", seriesId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("test_series_exams")
                .select("*, exams(*)")
                .eq("test_series_id", seriesId)
                .order("exam_order", { ascending: true });

            if (error) throw error;
            return data;
        },
    });
}

export function useAvailableExams(seriesId: string) {
    const supabase = createClient();

    return useQuery({
        queryKey: ["available-exams", seriesId],
        queryFn: async () => {
            // First get exams already in the series
            const { data: seriesExams } = await supabase
                .from("test_series_exams")
                .select("exam_id")
                .eq("test_series_id", seriesId);

            const addedExamIds = new Set(seriesExams?.map((se) => se.exam_id) || []);

            // Then get all published exams
            const { data: allExams, error } = await supabase
                .from("exams")
                .select("*")
                .eq("status", "published")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Filter out added exams
            return allExams?.filter((exam) => !addedExamIds.has(exam.id)) || [];
        },
    });
}

export function useSeriesMutations(seriesId: string) {
    const queryClient = useQueryClient();

    const addExam = useMutation({
        mutationFn: async ({ examId, order }: { examId: string; order: number }) => {
            await addExamToSeries(seriesId, examId, order);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["series-exams", seriesId] });
            queryClient.invalidateQueries({ queryKey: ["available-exams", seriesId] });
            toast.success("Exam added to series");
        },
        onError: (error) => {
            toast.error("Failed to add exam: " + error.message);
        },
    });

    const removeExam = useMutation({
        mutationFn: async (examId: string) => {
            await removeExamFromSeries(seriesId, examId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["series-exams", seriesId] });
            queryClient.invalidateQueries({ queryKey: ["available-exams", seriesId] });
            toast.success("Exam removed from series");
        },
        onError: (error) => {
            toast.error("Failed to remove exam: " + error.message);
        },
    });

    const publishSeries = useMutation({
        mutationFn: async () => {
            await publishTestSeries(seriesId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["series", seriesId] });
            toast.success("Test series published successfully");
        },
        onError: (error) => {
            toast.error("Failed to publish series: " + error.message);
        },
    });

    const reorderExams = useMutation({
        mutationFn: async (reorderedExams: { id: string; exam_id: string; exam_order: number }[]) => {
            await reorderExamsInSeries(seriesId, reorderedExams);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["series-exams", seriesId] });
            toast.success("Exams reordered successfully");
        },
        onError: (error) => {
            toast.error("Failed to reorder exams: " + error.message);
        },
    });

    return { addExam, removeExam, publishSeries, reorderExams };
}
