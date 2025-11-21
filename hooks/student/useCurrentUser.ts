"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

export function useCurrentUser() {
    const supabase = createClient();

    return useQuery({
        queryKey: ["current-user"],
        queryFn: async (): Promise<UserProfile | null> => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return null;

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id, email, full_name, role")
                .eq("id", user.id)
                .single();

            if (error || !profile) return null;

            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name || "Student",
                role: profile.role,
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
