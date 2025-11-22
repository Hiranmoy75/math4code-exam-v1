import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function useSectionInfo(sectionId: string) {
    const supabase = createClient()
    return useQuery({
        queryKey: ["section", sectionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sections")
                .select("*, exams(title)")
                .eq("id", sectionId)
                .single()
            if (error) throw error
            return data
        }
    })
}

export function useSectionQuestions(sectionId: string) {
    const supabase = createClient()
    return useQuery({
        queryKey: ["section-questions", sectionId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("questions")
                .select("*")
                .eq("section_id", sectionId)
                .order("created_at", { ascending: true })
            if (error) throw error
            return data || []
        }
    })
}

export function useRemoveQuestion() {
    const supabase = createClient()
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (questionId: string) => {
            const { error } = await supabase.from("questions").delete().eq("id", questionId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["section-questions"] })
            toast.success("Question removed successfully")
        },
        onError: (err) => {
            toast.error("Failed to remove question: " + (err as Error).message)
        }
    })
}
