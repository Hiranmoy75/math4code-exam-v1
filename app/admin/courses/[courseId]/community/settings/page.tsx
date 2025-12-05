import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CommunitySettingsClient from "./CommunitySettingsClient";

interface CommunitySettingsPageProps {
    params: {
        courseId: string;
    };
}

export default async function CommunitySettingsPage({ params }: CommunitySettingsPageProps) {
    const supabase = await createClient();

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login");
    }

    // Get user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "instructor")) {
        redirect("/student/dashboard");
    }

    // Verify user owns this course
    const { data: course } = await supabase
        .from("courses")
        .select("id, title, community_enabled")
        .eq("id", params.courseId)
        .eq("creator_id", user.id)
        .single();

    if (!course) {
        redirect("/admin/courses");
    }

    // Get channels
    const { data: channels } = await supabase
        .from("community_channels")
        .select("*")
        .eq("course_id", params.courseId)
        .order("created_at", { ascending: true });

    return (
        <CommunitySettingsClient
            courseId={params.courseId}
            courseTitle={course.title}
            communityEnabled={course.community_enabled}
            initialChannels={channels || []}
        />
    );
}
