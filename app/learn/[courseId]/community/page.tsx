import CommunityClient from "./CommunityClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Course Community | Math4Code",
    description: "Connect with other learners and instructors",
};

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CommunityPage({ params }: PageProps) {
    const { courseId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect(`/auth/login?next=/learn/${courseId}/community`);
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return <CommunityClient courseId={courseId} userProfile={profile} />;
}
