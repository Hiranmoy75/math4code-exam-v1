import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CourseBuilder from "./CourseBuilder";

export default async function CourseBuilderPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch course details
    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

    if (!course) {
        redirect("/admin/courses");
    }

    if (course.creator_id !== user.id) {
        redirect("/admin/courses");
    }

    // Fetch modules and lessons
    const { data: modules } = await supabase
        .from("modules")
        .select(`
      *,
      lessons (*)
    `)
        .eq("course_id", courseId)
        .order("module_order", { ascending: true });

    // Sort lessons within modules (supabase order() on nested resource is tricky, better to sort in JS)
    const modulesWithSortedLessons = modules?.map((module) => ({
        ...module,
        lessons: module.lessons?.sort((a: any, b: any) => a.lesson_order - b.lesson_order) || [],
    })) || [];

    return (
        <div className="container mx-auto py-6">
            <CourseBuilder course={course} initialModules={modulesWithSortedLessons} />
        </div>
    );
}
