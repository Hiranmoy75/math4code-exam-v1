import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface EnrolledCourseWithChannels {
    id: string;
    title: string;
    thumbnail_url: string | null;
    community_enabled: boolean;
    channels: Array<{
        id: string;
        name: string;
        type: string;
        description: string | null;
    }>;
}

export const useEnrolledCourses = (userId?: string) => {
    return useQuery({
        queryKey: ["enrolled-courses", userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID is required");

            // Fetch enrollments with course details
            const { data: enrollments, error: enrollmentsError } = await supabase
                .from("enrollments")
                .select(`
          course_id,
          courses (
            id,
            title,
            thumbnail_url,
            community_enabled
          )
        `)
                .eq("user_id", userId);

            if (enrollmentsError) throw enrollmentsError;

            // Filter courses with community enabled
            const coursesWithCommunity = enrollments
                ?.map((e: any) => e.courses)
                .filter((c: any) => c && c.community_enabled) || [];

            // Fetch channels for each course
            const coursesWithChannels = await Promise.all(
                coursesWithCommunity.map(async (course: any) => {
                    const { data: channels } = await supabase
                        .from("community_channels")
                        .select("id, name, type, description")
                        .eq("course_id", course.id)
                        .order("created_at", { ascending: true });

                    return {
                        ...course,
                        channels: channels || [],
                    };
                })
            );

            return coursesWithChannels as EnrolledCourseWithChannels[];
        },
        enabled: !!userId,
    });
};
