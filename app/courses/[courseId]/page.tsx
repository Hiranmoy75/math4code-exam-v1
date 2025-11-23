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

    // Fetch modules and lessons
    const { data: modules } = await supabase
        .from("modules")
        .select(`
      *,
      lessons (*)
    `)
        .eq("course_id", courseId)
        .order("module_order", { ascending: true });

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

    // Sort lessons
    const modulesWithSortedLessons = modules?.map((module) => ({
        ...module,
        lessons: module.lessons?.sort((a: any, b: any) => a.lesson_order - b.lesson_order) || [],
    })) || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <Link href="/courses" className="font-bold text-xl">
                        Math4Code LMS
                    </Link>
                    <div className="flex gap-4">
                        {user ? (
                            <Link href="/student/dashboard">
                                <Button variant="ghost">Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Button>Log in</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-muted/50 py-16">
                <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Badge className="mb-4">{course.category}</Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
                            {course.title}
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            {course.description}
                        </p>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {(course.profiles as any)?.full_name?.[0] || "I"}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Created by</p>
                                    <p className="font-bold">{(course.profiles as any)?.full_name || "Instructor"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <EnrollButton
                                courseId={course.id}
                                price={course.price}
                                isEnrolled={isEnrolled}
                                isLoggedIn={!!user}
                            />
                        </div>
                    </div>
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden shadow-xl relative">
                        {course.thumbnail_url ? (
                            <img
                                src={course.thumbnail_url}
                                alt={course.title}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                                <PlayCircle className="h-20 w-20" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Curriculum Section */}
            <div className="container mx-auto py-16 max-w-4xl">
                <h2 className="text-3xl font-bold mb-8">Course Curriculum</h2>
                <Accordion type="single" collapsible className="w-full border rounded-lg">
                    {modulesWithSortedLessons.map((module) => (
                        <AccordionItem key={module.id} value={module.id}>
                            <AccordionTrigger className="px-6 hover:no-underline bg-muted/20">
                                <div className="text-left">
                                    <div className="font-semibold text-lg">{module.title}</div>
                                    <div className="text-sm text-muted-foreground font-normal">
                                        {module.lessons.length} lessons
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-0">
                                <div className="divide-y">
                                    {module.lessons.map((lesson: any) => (
                                        <div
                                            key={lesson.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {lesson.content_type === "video" ? (
                                                    <PlayCircle className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-green-500" />
                                                )}
                                                <span>{lesson.title}</span>
                                            </div>
                                            <div>
                                                {lesson.is_free_preview ? (
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <Unlock className="h-3 w-3" /> Preview
                                                    </Badge>
                                                ) : (
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
