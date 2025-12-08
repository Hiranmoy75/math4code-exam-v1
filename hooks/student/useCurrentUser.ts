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

            if (error || !profile) {
                // Production Standard: Do not fake the profile.
                // If profile is missing, it likely means the DB Trigger hasn't finished yet.
                // We throw an error to trigger the 'retry' mechanism below.
                throw new Error("Profile not found in database yet.");
            }

            return {
                id: profile.id,
                email: profile.email,
                fullName: profile.full_name || "Student",
                role: profile.role,
            };
        },
        // Production Policy: Retry 3 times with delay to wait for DB Trigger
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // 1s, 2s, 3s
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
