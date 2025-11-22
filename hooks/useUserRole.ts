import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useUserRole() {
    const supabase = createClient()
    return useQuery({
        queryKey: ["userRole"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return null
            const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
            return data?.role
        },
        staleTime: Infinity,
    })
}
