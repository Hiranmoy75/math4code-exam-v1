import { createClient } from "@/lib/supabase/server";
import CoursesList from "./components/CoursesList";

export default async function CoursesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: courses } = await supabase
        .from("courses")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Courses</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Manage your curriculum, track learners, and publish content.
                </p>
            </div>

            <CoursesList initialCourses={courses || []} />
        </div>
    );
}
