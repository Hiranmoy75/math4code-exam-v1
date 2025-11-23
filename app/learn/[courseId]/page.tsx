import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlayCircle, FileText, HelpCircle } from "lucide-react";
import { EmbeddedExam } from "@/components/EmbeddedExam";
import { CoursePlayerClient } from "@/components/CoursePlayerClient";
import { LessonTracker } from "@/components/LessonTracker";

export default async function CoursePlayerPage({
    params,
    searchParams,
}: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ lessonId?: string }>;
}) {
    const { courseId } = await params;
    const { lessonId } = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/auth/login?next=/learn/${courseId}`);
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .single();

    if (!enrollment) {
        redirect(`/courses/${courseId}`);
    }

    // Fetch course details
    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

    // Fetch modules and lessons
    const { data: modules } = await supabase
        .from("modules")
        .select(`
      *,
      lessons (*)
    `)
        .eq("course_id", courseId)
        .order("module_order", { ascending: true });

    // Sort lessons
    const modulesWithSortedLessons = modules?.map((module) => ({
        ...module,
        lessons: module.lessons?.sort((a: any, b: any) => a.lesson_order - b.lesson_order) || [],
    })) || [];

    // Find current lesson
    let currentLesson = null;
    let nextLessonId = null;
    let prevLessonId = null;

    // Flatten lessons for easier navigation
    const allLessons = modulesWithSortedLessons.flatMap(m => m.lessons);

    if (lessonId) {
        const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
        if (currentIndex !== -1) {
            currentLesson = allLessons[currentIndex];
            prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
            nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;
        }
    } else if (allLessons.length > 0) {
        currentLesson = allLessons[0];
        nextLessonId = allLessons.length > 1 ? allLessons[1].id : null;
    }

    return (
        <CoursePlayerClient
            course={course}
            modules={modulesWithSortedLessons}
            currentLesson={currentLesson}
            nextLessonId={nextLessonId}
            prevLessonId={prevLessonId}
            courseId={courseId}
        >
            <LessonTracker lessonId={currentLesson?.id || ""} courseId={courseId}>
                <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
                    {currentLesson ? (
                        <div className="w-full max-w-5xl space-y-6">
                            {/* Video Content */}
                            {currentLesson.content_type === "video" && (
                                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative border border-slate-800">
                                    {currentLesson.content_url ? (
                                        <iframe
                                            src={currentLesson.content_url}
                                            className="w-full h-full"
                                            allowFullScreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                            <PlayCircle className="h-20 w-20 opacity-20 mb-4" />
                                            <span className="text-lg font-medium">Video Content Placeholder</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PDF Content */}
                            {currentLesson.content_type === "pdf" && (
                                <div className="space-y-4">
                                    {currentLesson.content_url ? (
                                        <>
                                            <div className="aspect-video bg-[#161b22] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                                                <iframe
                                                    src={currentLesson.content_url}
                                                    className="w-full h-full"
                                                    title={currentLesson.title}
                                                />
                                            </div>
                                            <div className="flex justify-center">
                                                <a
                                                    href={currentLesson.content_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    Download / Open PDF
                                                </a>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="aspect-video flex flex-col items-center justify-center bg-[#161b22] rounded-xl border border-slate-800 text-slate-500">
                                            <FileText className="h-20 w-20 opacity-20 mb-4" />
                                            <span className="text-lg font-medium">PDF Content Not Available</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Text Content */}
                            {currentLesson.content_type === "text" && (
                                <div className="prose prose-invert max-w-none p-8 rounded-xl bg-[#161b22] border border-slate-800">
                                    {currentLesson.content_text ? (
                                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content_text }} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                            <FileText className="h-20 w-20 opacity-20 mb-4" />
                                            <span className="text-lg font-medium">Text Content Not Available</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quiz/Exam Content */}
                            {currentLesson.content_type === "quiz" && (
                                <div className="space-y-6">
                                    {(currentLesson as any).exam_id ? (
                                        <EmbeddedExam examId={(currentLesson as any).exam_id} />
                                    ) : (
                                        <div className="p-8 rounded-xl bg-[#161b22] border border-slate-800 text-center">
                                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-500 opacity-50" />
                                            <p className="text-slate-500">Quiz not configured yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <FileText className="h-20 w-20 opacity-20 mb-4" />
                            <span className="text-lg font-medium">No Lesson Selected</span>
                        </div>
                    )}
                </div>
            </LessonTracker>
        </CoursePlayerClient>
    );
}
