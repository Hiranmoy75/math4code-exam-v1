import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlayCircle, FileText, HelpCircle, Check, Copy, ChevronLeft, ChevronRight, Video, AlignLeft, Users } from "lucide-react";
import { EmbeddedExam } from "@/components/EmbeddedExam";
import { CoursePlayerClient } from "@/components/CoursePlayerClient";
import { LessonTracker } from "@/components/LessonTracker";
import VideoPlayer from "@/components/VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LessonNavigation } from "@/components/LessonNavigation";
import ConceptCard from "@/components/ConceptCard";
import { QuizPlayer } from "@/components/QuizPlayer";
import { LessonSummary } from "@/components/LessonSummary";
import CustomPDFViewer from "@/components/CustomPDFViewer";
import { CommunityModalProvider } from "@/context/CommunityModalContext";
import { CommunityModal } from "@/components/community/CommunityModal";
import { CommunityButton } from "@/components/CommunityButton";

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

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch course details
    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

    // Fetch course author profile
    const { data: authorProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", course.user_id)
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
    let currentLesson: any = null;
    let nextLessonId = null;
    let prevLessonId = null;

    // Flatten lessons for easier navigation
    const allLessons = modulesWithSortedLessons.flatMap(m => m.lessons);

    // Fetch lesson progress for smart navigation
    const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .eq("course_id", courseId);

    const completedLessonIds = new Set(progressData?.filter(p => p.completed).map(p => p.lesson_id) || []);

    if (lessonId) {
        const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId);
        if (currentIndex !== -1) {
            currentLesson = allLessons[currentIndex];
            prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
            nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;
        }
    } else if (allLessons.length > 0) {
        // Smart Navigation: Find first incomplete lesson
        const firstIncomplete = allLessons.find((l: any) => !completedLessonIds.has(l.id));

        if (firstIncomplete) {
            currentLesson = firstIncomplete;
        } else {
            // All completed, start from beginning
            currentLesson = allLessons[0];
        }

        // Set next/prev based on the found lesson
        const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson.id);
        prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
        nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;
    }


    const iconMap = {
        video: <PlayCircle className="h-6 w-6" />,
        pdf: <FileText className="h-6 w-6" />,
        text: <AlignLeft className="h-6 w-6" />,
    } as const;

    const key = (currentLesson?.content_type ?? "text") as keyof typeof iconMap;
    const icon = iconMap[key];

    const isQuiz = currentLesson?.content_type === "quiz";
    let examData = null;
    let examAttempts: any[] = [];
    let questionsCount = 0;

    if (isQuiz && (currentLesson as any).exam_id) {
        const examId = (currentLesson as any).exam_id;

        // Fetch exam details
        const { data: exam } = await supabase
            .from("exams")
            .select("*")
            .eq("id", examId)
            .single();

        examData = exam;

        // Fetch attempts
        if (user) {
            const { data: attempts } = await supabase
                .from("exam_attempts")
                .select("*, result:results(*)")
                .eq("exam_id", examId)
                .eq("user_id", user.id);
            examAttempts = attempts || [];
        }

        // Fetch questions count
        const { data: sections } = await supabase
            .from("sections")
            .select("id, questions:questions(id)")
            .eq("exam_id", examId);

        if (sections) {
            questionsCount = sections.reduce((acc: number, section: any) => acc + (section.questions?.length || 0), 0);
        }
    }

    return (
        <CommunityModalProvider>
            <CoursePlayerClient
                course={course}
                modules={modulesWithSortedLessons}
                currentLesson={currentLesson}
                nextLessonId={nextLessonId}
                prevLessonId={prevLessonId}
                courseId={courseId}
                user={user}
                profile={profile}
            >
                <LessonTracker
                    key={currentLesson?.id}
                    lessonId={currentLesson?.id || ""}
                    courseId={courseId}
                    moduleId={currentLesson?.module_id}
                    contentType={currentLesson?.content_type as any}
                >
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col items-center bg-background">
                        {currentLesson ? (
                            <div className="w-full max-w-4xl space-y-8">

                                {/* Lesson Header - Hide for Quiz */}
                                {!isQuiz && (
                                    <div className="border-b border-border pb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 rounded-full px-3 border-none font-medium">
                                                {course.level || "Beginner"}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {currentLesson.duration ? `${Math.round(currentLesson.duration / 60)} min read` : "5 min read"}
                                            </span>
                                            <span className="text-sm text-muted-foreground">•</span>
                                            <span className="text-sm text-muted-foreground">
                                                Last updated {new Date(currentLesson.updated_at || currentLesson.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h1 className="text-4xl font-bold tracking-tight mb-6 text-foreground">{currentLesson.title}</h1>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-border">
                                                <AvatarImage src={authorProfile?.avatar_url || "https://github.com/shadcn.png"} />
                                                <AvatarFallback>{authorProfile?.full_name?.substring(0, 2).toUpperCase() || "AU"}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-foreground">
                                                By {authorProfile?.full_name || "Unknown Instructor"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Main Content */}
                                <div className="space-y-8">
                                    {/* Video Content */}
                                    {currentLesson.content_type === "video" && (
                                        <>
                                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative border border-border ring-1 ring-border/50">
                                                {currentLesson.content_url ? (
                                                    <VideoPlayer url={currentLesson.content_url} />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                        <PlayCircle className="h-20 w-20 opacity-20 mb-4" />
                                                        <span className="text-lg font-medium">Video Content Placeholder</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* PDF Content */}
                                    {currentLesson.content_type === "pdf" && (
                                        <div className="space-y-4">
                                            {currentLesson?.content_url ? (
                                                <CustomPDFViewer
                                                    url={currentLesson.content_url}
                                                    title={currentLesson.title}
                                                    allowDownload={currentLesson.is_downloadable ?? true}
                                                />
                                            ) : (
                                                <div className="aspect-video flex flex-col items-center justify-center bg-card rounded-xl border border-border text-muted-foreground">
                                                    <FileText className="h-20 w-20 opacity-20 mb-4" />
                                                    <span className="text-lg font-medium">PDF Content Not Available</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {currentLesson.content_type === "text" && (
                                        <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-relaxed">


                                            {currentLesson.content_text ? (
                                                <>
                                                    <style>{`
                                                        .rich-text-content ul {
                                                            list-style-type: disc !important;
                                                            padding-left: 1.5em !important;
                                                            margin-top: 0.5em !important;
                                                            margin-bottom: 0.5em !important;
                                                        }
                                                        .rich-text-content ol {
                                                            list-style-type: decimal !important;
                                                            padding-left: 1.5em !important;
                                                            margin-top: 0.5em !important;
                                                            margin-bottom: 0.5em !important;
                                                        }
                                                        .rich-text-content li {
                                                            display: list-item !important;
                                                            margin-bottom: 0.25em !important;
                                                        }
                                                        .rich-text-content font[color], .rich-text-content span[style*="color"] {
                                                            color: inherit !important;
                                                        }
                                                    `}</style>
                                                    <div
                                                        dangerouslySetInnerHTML={{ __html: currentLesson.content_text }}
                                                        className="rich-text-content"
                                                    />
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
                                                    <FileText className="h-20 w-20 opacity-20 mb-4" />
                                                    <span className="text-lg font-medium">Text Content Not Available</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Quiz/Exam Content */}
                                    {currentLesson.content_type === "quiz" && (
                                        <div className="space-y-6">
                                            {(currentLesson as any).exam_id && examData ? (
                                                <QuizPlayer
                                                    exam={examData}
                                                    attempts={examAttempts}
                                                    userId={user.id}
                                                    questionsCount={questionsCount}
                                                />
                                            ) : (
                                                <div className="p-8 rounded-xl bg-card border border-border text-center">
                                                    <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                                    <p className="text-muted-foreground">Quiz not configured yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Key Concept Box - Hide for Quiz */}
                                {!isQuiz && (
                                    <>
                                        <ConceptCard
                                            title={currentLesson?.title}
                                            contentType={currentLesson?.content_type}
                                            icon={icon}
                                        >
                                            {currentLesson?.description}
                                        </ConceptCard>

                                    </>
                                )}

                                {/* Footer Navigation */}
                                <LessonNavigation
                                    courseId={courseId}
                                    currentLessonId={currentLesson.id}
                                    prevLessonId={prevLessonId}
                                    nextLessonId={nextLessonId}
                                />

                                {/* Bottom Tabs - Hide for Quiz */}
                                {!isQuiz && (
                                    <div className="mt-16">
                                        <Tabs defaultValue="resources" className="w-full">
                                            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto rounded-none">
                                                <TabsTrigger value="resources" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-6 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all">
                                                    Resources
                                                </TabsTrigger>
                                                <TabsTrigger value="discussion" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-6 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all">
                                                    Discussion (3)
                                                </TabsTrigger>
                                                <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-6 py-3 text-muted-foreground data-[state=active]:text-foreground font-medium transition-all">
                                                    Notes
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="resources" className="pt-8">
                                                <div className="p-8 border border-dashed border-border rounded-xl text-center">
                                                    <p className="text-muted-foreground">Additional resources for this lesson will appear here.</p>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="discussion" className="pt-8">
                                                <div className="p-8 border border-dashed border-border rounded-xl text-center flex flex-col items-center gap-4">
                                                    <div className="bg-emerald-100 dark:bg-emerald-900/20 p-4 rounded-full">
                                                        <Users className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-2">Join the Discussion</h3>
                                                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                                            Connect with other learners, ask questions, and share your progress in our community channels.
                                                        </p>
                                                        <CommunityButton />
                                                    </div>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="notes" className="pt-8">
                                                <div className="p-8 border border-dashed border-border rounded-xl text-center">
                                                    <p className="text-muted-foreground">Personal notes placeholder.</p>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <FileText className="h-20 w-20 opacity-20 mb-4" />
                                <span className="text-lg font-medium">No Lesson Selected</span>
                            </div>
                        )}
                    </div>
                </LessonTracker>
            </CoursePlayerClient>
            <CommunityModal />
        </CommunityModalProvider>
    );
}
