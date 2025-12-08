
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Exam } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useExams = (examId?: string) => {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const router = useRouter();

    // Fetch single exam if examId is provided
    const { data: exam, isLoading, refetch } = useQuery({
        queryKey: ["exam", examId],
        queryFn: async () => {
            if (!examId) return null;
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId)
                .single();

            if (error) throw error;
            return data as Exam;
        },
        enabled: !!examId,
    });

    // Create Exam Mutation
    const createExamMutation = useMutation({
        mutationFn: async (examData: Partial<Exam> & { admin_id?: string }) => {
            // Get current user if we need to verify auth, though usually passed or handled by RLS
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const payload: any = {
                ...examData,
                admin_id: user.id, // DB column seems to be admin_id based on existing code
                status: examData.status || "draft",
            };

            // Clean up undefined
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            const { data, error } = await supabase
                .from("exams")
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            return data as Exam;
        },
        onSuccess: (data) => {
            toast.success("Exam created successfully");
            // We return data so components can decide to route or not, 
            // but we can also optimize here if we want default behavior.
            // For now, let component handle routing or do it here. 
            // We'll let component handle routing to be more flexible.
        },
        onError: (error) => {
            toast.error("Failed to create exam: " + error.message);
        }
    });

    // Update Exam Mutation
    const updateExamMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Exam> }) => {
            const { error } = await supabase
                .from("exams")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
            return { id, ...updates };
        },
        onMutate: async ({ id, updates }) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["exam", id] });

            // Snapshot the previous value
            const previousExam = queryClient.getQueryData<Exam>(["exam", id]);

            // Optimistically update to the new value
            queryClient.setQueryData(["exam", id], (old: Exam | undefined) => {
                if (!old) return old;
                return { ...old, ...updates };
            });

            // Return a context object with the snapshotted value
            return { previousExam };
        },
        onError: (err, newTodo, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousExam) {
                queryClient.setQueryData(["exam", newTodo.id], context.previousExam);
            }
            toast.error("Failed to update exam");
        },
        onSettled: (data, error, { id }) => {
            // Always refetch after error or success:
            queryClient.invalidateQueries({ queryKey: ["exam", id] });
        },
    });

    // Delete Exam Mutation
    const deleteExamMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("exams").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Exam deleted");
            // Optional: Redirect to list
        },
        onError: (error) => {
            toast.error("Failed to delete exam: " + error.message);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
        }
    });

    // Create Test Series Mutation (Grouping here as part of Assessment/Exam system)
    const createTestSeriesMutation = useMutation({
        mutationFn: async (seriesData: { title: string; description: string; price: number; is_free: boolean; status: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("test_series")
                .insert([{
                    admin_id: user.id,
                    ...seriesData
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success("Test series created successfully");
        },
        onError: (error) => {
            toast.error("Failed to create test series: " + error.message);
        }
    });

    return {
        exam,
        isLoading,
        refetch,
        createExam: createExamMutation.mutateAsync,
        isCreating: createExamMutation.isPending,
        updateExam: updateExamMutation.mutateAsync,
        isUpdating: updateExamMutation.isPending,
        deleteExam: deleteExamMutation.mutateAsync,
        isDeleting: deleteExamMutation.isPending,
        createTestSeries: createTestSeriesMutation.mutateAsync,
        isCreatingTestSeries: createTestSeriesMutation.isPending,
    };
};
