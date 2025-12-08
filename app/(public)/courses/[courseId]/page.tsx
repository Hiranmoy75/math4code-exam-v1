import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, PlayCircle, FileText, Lock, Unlock } from "lucide-react";
import EnrollButton from "./EnrollButton";
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";

export default async function CourseLandingPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Fetch course details
    const { data: course } = await supabase
        .from("courses")
        .select("*, profiles:creator_id(full_name)")
        .eq("id", courseId)
        .single();

    if (!course) {
        redirect("/courses");
    }

    // Fetch modules and lessons (Optimized RPC)
    let { data: modulesData, error: modulesError } = await supabase
        .rpc('get_course_structure', { target_course_id: courseId });

    if (modulesError) {
        console.warn("RPC fetch failed, falling back to standard query:", modulesError);
        const { data: fallbackData } = await supabase
            .from("modules")
            .select(`
                *,
                lessons (*)
            `)
            .eq("course_id", courseId)
            .order("module_order", { ascending: true });

        // Manually sort since standard query doesn't sort nested by default in all cases or if needed
        if (fallbackData) {
            modulesData = fallbackData.map((m: any) => ({
                ...m,
                lessons: (m.lessons || []).sort((a: any, b: any) => a.lesson_order - b.lesson_order)
            }));
        } else {
            modulesData = [];
        }
    }

    // Check enrollment
    let isEnrolled = false;
    if (user) {
        const { data: enrollment } = await supabase
            .from("enrollments")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();
        isEnrolled = !!enrollment;
    }

    // RPC returns presorted data via SQL
    const modulesWithSortedLessons = (modulesData || []).map((module: any) => ({
        ...module,
        lessons: module.lessons || []
    }));

    return (
        <div className="min-h-screen bg-background font-sans">
            <main className="pb-20">
                {/* Hero Section */}
                <div className="relative bg-[#FBFBFD] overflow-hidden">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-indigo-50 to-transparent opacity-50 -z-10" />
                    <div className="absolute top-20 left-10 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10" />

                    <div className="container mx-auto px-4 md:px-6 pt-24 pb-24 md:pt-32 md:pb-48 relative z-10">
                        <div className="grid lg:grid-cols-3 gap-12 items-start">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="space-y-4">
                                    <Badge className="bg-indigo-50 text-[#1F2A6B] hover:bg-indigo-100 border-indigo-100 px-3 py-1 text-sm">
                                        {course.category}
                                    </Badge>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-[#1F2A6B]">
                                        {course.title}
                                    </h1>
                                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl">
                                        {course.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-[#1F2A6B] flex items-center justify-center font-bold text-white text-lg ring-4 ring-indigo-50">
                                            {(course.profiles as any)?.full_name?.[0] || "I"}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Created by</p>
                                            <p className="font-bold text-slate-900">{(course.profiles as any)?.full_name || "Instructor"}</p>
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-slate-200" />
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <FileText className="h-5 w-5 text-indigo-500" />
                                        <span className="font-medium">{modulesWithSortedLessons.reduce((acc: any, m: any) => acc + m.lessons.length, 0)} Lessons</span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop Sidebar Placeholder */}
                            <div className="hidden lg:block relative">
                                {/* This will be handled by the grid layout */}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 md:px-6 -mt-10 lg:-mt-32 relative z-20">
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-12">
                            {/* Course Content */}
                            <div className="bg-card rounded-xl border shadow-sm p-6 md:p-8">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <span className="bg-primary/10 p-2 rounded-lg text-primary">
                                        <FileText className="h-6 w-6" />
                                    </span>
                                    Course Curriculum
                                </h2>
                                <Accordion type="single" collapsible className="w-full space-y-4">
                                    {modulesWithSortedLessons.map((module: any) => (
                                        <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-2 overflow-hidden data-[state=open]:bg-muted/30">
                                            <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 rounded-md transition-colors">
                                                <div className="flex flex-col items-start text-left gap-1">
                                                    <div className="font-semibold text-lg">{module.title}</div>
                                                    <div className="text-sm text-muted-foreground font-normal flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {module.lessons.length} lessons
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 pb-4 px-4">
                                                <div className="space-y-2">
                                                    {module.lessons.map((lesson: any) => {
                                                        const isAccessible = isEnrolled || lesson.is_free_preview;

                                                        const content = (
                                                            <>
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-full ${lesson.content_type === "video" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                                        {lesson.content_type === "video" ? (
                                                                            <PlayCircle className="h-4 w-4" />
                                                                        ) : (
                                                                            <FileText className="h-4 w-4" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`font-medium text-sm transition-colors ${isAccessible ? "group-hover:text-primary" : ""}`}>{lesson.title}</span>
                                                                </div>
                                                                <div>
                                                                    {lesson.is_free_preview ? (
                                                                        <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
                                                                            <Unlock className="h-3 w-3" /> Preview
                                                                        </Badge>
                                                                    ) : (
                                                                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                                                                    )}
                                                                </div>
                                                            </>
                                                        );

                                                        if (isAccessible) {
                                                            return (
                                                                <Link
                                                                    key={lesson.id}
                                                                    href={`/learn/${courseId}?lessonId=${lesson.id}`}
                                                                    className="flex items-center justify-between p-3 rounded-md border border-transparent transition-all group w-full hover:bg-background hover:border-border cursor-pointer"
                                                                >
                                                                    {content}
                                                                </Link>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={lesson.id}
                                                                className="flex items-center justify-between p-3 rounded-md border border-transparent transition-all group w-full opacity-75 cursor-default"
                                                            >
                                                                {content}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-card rounded-xl border shadow-lg overflow-hidden">
                                    <div className="aspect-video bg-muted relative">
                                        <CourseThumbnail
                                            src={course.thumbnail_url}
                                            title={course.title}
                                            category={course.category || "Course"}
                                            className="w-full h-full"
                                        />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                                            <div className="bg-white/90 p-4 rounded-full shadow-xl transform scale-90 hover:scale-100 transition-transform">
                                                <PlayCircle className="h-8 w-8 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-primary">
                                                    {course.price === 0 ? "Free" : `₹ ${course.price}`}
                                                </span>
                                                {course.price > 0 && (
                                                    <span className="text-muted-foreground line-through text-sm">
                                                        ₹ {Math.round(course.price * 1.5)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Full lifetime access • Certificate of completion
                                            </p>
                                        </div>

                                        <EnrollButton
                                            courseId={course.id}
                                            price={course.price}
                                            isEnrolled={isEnrolled}
                                            isLoggedIn={!!user}
                                        />

                                        <div className="space-y-3 pt-4 border-t">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span>Access on mobile and TV</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span>Full lifetime access</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span>Certificate of completion</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 lg:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <div className="text-2xl font-bold text-[#1F2A6B]">
                                {course.price === 0 ? "Free" : `₹ ${course.price}`}
                            </div>
                            {course.price > 0 && (
                                <div className="text-xs text-slate-500 line-through">
                                    ₹ {Math.round(course.price * 1.5)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <EnrollButton
                                courseId={course.id}
                                price={course.price}
                                isEnrolled={isEnrolled}
                                isLoggedIn={!!user}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
