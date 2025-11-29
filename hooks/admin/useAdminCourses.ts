import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useDeleteCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (courseId: string) => {
            const supabase = createClient();
            const { error } = await supabase.from("courses").delete().eq("id", courseId);

            if (error) {
                throw new Error(error.message);
            }
            return courseId;
        },
        onSuccess: (deletedCourseId) => {
            toast.success("Course deleted successfully");
            // Invalidate queries if needed, or we can just rely on the local state update in the component
            // But invalidating is safer for consistency
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
        },
        onError: (error) => {
            console.error("Error deleting course:", error);
            toast.error(error.message || "Failed to delete course");
        },
    });
};
