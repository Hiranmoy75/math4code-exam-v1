import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminCommunityClient from "./AdminCommunityClient";

interface AdminCommunityPageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function AdminCommunityPage({ params }: AdminCommunityPageProps) {
    const { courseId } = await params;
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
        .select("id, title, community_enabled, creator_id")
        .eq("id", courseId)
        .single();

    if (!course || course.creator_id !== user.id) {
        redirect("/admin/courses");
    }

    if (!course.community_enabled) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Community Not Enabled</h2>
                    <p className="text-muted-foreground">
                        Enable community for this course from the courses page.
                    </p>
                </div>
            </div>
        );
    }

    return <AdminCommunityClient courseId={courseId} userProfile={profile} courseTitle={course.title} />;
}
