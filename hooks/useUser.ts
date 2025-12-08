import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        const getUser = async () => {
            try {
                // Get session from local storage first (faster)
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);

                        // Fetch profile in background to unblock UI
                        fetchProfile(session.user.id);
                    } else {
                        // Fallback to getUser if no session (only if session is null)
                        const { data: { user } } = await supabase.auth.getUser();
                        if (mounted) setUser(user);
                        if (user) fetchProfile(user.id);
                    }
                }
            } catch (error) {
                console.error("Error getting user:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const fetchProfile = async (userId: string) => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (mounted) setProfile(profile);
        }

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, profile, loading };
}
