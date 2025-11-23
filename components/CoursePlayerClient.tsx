"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { PlayCircle, FileText, ChevronLeft, ChevronRight, HelpCircle, Menu, X, PanelLeftClose, PanelLeft, CheckCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useLessonProgress, useMarkLessonComplete } from "@/hooks/student/useLessonProgress"

interface CoursePlayerClientProps {
    course: any
    modules: any[]
    currentLesson: any
    nextLessonId: string | null
    prevLessonId: string | null
    courseId: string
    children: React.ReactNode
}

export function CoursePlayerClient({
    course,
    modules,
    currentLesson,
    nextLessonId,
    prevLessonId,
    courseId,
    children
}: CoursePlayerClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [progressPercentage, setProgressPercentage] = useState(0)

    // Get user ID
    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
            }
        }
        getUser()
    }, [])

    // Fetch lesson progress
    const { data: lessonProgress } = useLessonProgress(userId || undefined, courseId)

    // Fetch enrollment progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!userId) return

            const supabase = createClient()
            const { data } = await supabase
                .from("enrollments")
                .select("progress_percentage")
                .eq("user_id", userId)
                .eq("course_id", courseId)
                .single()

            if (data) {
                setProgressPercentage(data.progress_percentage || 0)
            }
        }
        fetchProgress()
    }, [userId, courseId, lessonProgress])

    // Check if lesson is completed
    const isLessonCompleted = (lessonId: string) => {
        return lessonProgress?.some(p => p.lesson_id === lessonId && p.completed) || false
    }

    // Mutation to mark lesson complete
    const { mutate: markComplete } = useMarkLessonComplete()

    const handleNextLesson = () => {
        console.log("handleNextLesson called", { currentLesson, userId, courseId });
        if (currentLesson && userId) {
            markComplete({
                userId,
                lessonId: currentLesson.id,
                courseId
            }, {
                onSuccess: () => console.log("Lesson marked complete successfully"),
                onError: (err) => console.error("Failed to mark lesson complete:", err)
            })
        } else {
            console.warn("Cannot mark complete: Missing userId or currentLesson");
        }
    }

    return (
        <div className="flex h-screen bg-[#0f1117] text-white overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: desktopSidebarCollapsed ? 0 : 320 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-r border-slate-800 bg-[#161b22] hidden md:flex flex-col overflow-hidden"
            >
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                        <Link href="/student/dashboard" className="text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                        <span className="font-semibold truncate text-sm">{course.title}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Course Progress</span>
                            <span>{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-700">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                        </div>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <Accordion type="single" collapsible className="w-full" defaultValue={modules[0]?.id}>
                        {modules.map((module) => (
                            <AccordionItem key={module.id} value={module.id} className="border-b border-slate-800">
                                <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-800/50 py-3 text-slate-300 data-[state=open]:text-white">
                                    <div className="text-left text-sm font-medium">
                                        {module.title}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0 pb-0">
                                    <div>
                                        {module.lessons.map((lesson: any) => {
                                            const isActive = currentLesson?.id === lesson.id;
                                            const isCompleted = isLessonCompleted(lesson.id);
                                            return (
                                                <Link
                                                    key={lesson.id}
                                                    href={`/learn/${courseId}?lessonId=${lesson.id}`}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 pl-6 text-sm transition-colors border-l-2",
                                                        isActive
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                            : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                                    )}
                                                >
                                                    {lesson.content_type === "video" ? (
                                                        <PlayCircle className="h-4 w-4 shrink-0" />
                                                    ) : lesson.content_type === "quiz" ? (
                                                        <HelpCircle className="h-4 w-4 shrink-0 text-purple-400" />
                                                    ) : (
                                                        <FileText className="h-4 w-4 shrink-0" />
                                                    )}
                                                    <span className="line-clamp-1 flex-1">{lesson.title}</span>
                                                    {isCompleted && (
                                                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </ScrollArea>
            </motion.div>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-80 bg-[#161b22] shadow-2xl border-r border-slate-800 md:hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                                <span className="font-semibold truncate text-sm">{course.title}</span>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-800 rounded-full">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            <ScrollArea className="flex-1">
                                <Accordion type="single" collapsible className="w-full" defaultValue={modules[0]?.id}>
                                    {modules.map((module) => (
                                        <AccordionItem key={module.id} value={module.id} className="border-b border-slate-800">
                                            <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-800/50 py-3 text-slate-300 data-[state=open]:text-white">
                                                <div className="text-left text-sm font-medium">
                                                    {module.title}
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-0 pb-0">
                                                <div>
                                                    {module.lessons.map((lesson: any) => {
                                                        const isActive = currentLesson?.id === lesson.id;
                                                        return (
                                                            <Link
                                                                key={lesson.id}
                                                                href={`/learn/${courseId}?lessonId=${lesson.id}`}
                                                                onClick={() => setSidebarOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 pl-6 text-sm transition-colors border-l-2",
                                                                    isActive
                                                                        ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                                        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                                                )}
                                                            >
                                                                {lesson.content_type === "video" ? (
                                                                    <PlayCircle className="h-4 w-4 shrink-0" />
                                                                ) : lesson.content_type === "quiz" ? (
                                                                    <HelpCircle className="h-4 w-4 shrink-0 text-purple-400" />
                                                                ) : (
                                                                    <FileText className="h-4 w-4 shrink-0" />
                                                                )}
                                                                <span className="line-clamp-1">{lesson.title}</span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </ScrollArea>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Navigation Bar */}
                <div className="h-16 border-b border-slate-800 bg-[#0f1117] flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Menu className="h-5 w-5 text-slate-400" />
                        </button>
                        {/* Desktop sidebar toggle */}
                        <button
                            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                            className="hidden md:block p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            title={desktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                        >
                            {desktopSidebarCollapsed ? (
                                <PanelLeft className="h-5 w-5 text-slate-400" />
                            ) : (
                                <PanelLeftClose className="h-5 w-5 text-slate-400" />
                            )}
                        </button>
                        <Link href="/student/dashboard" className="md:hidden">
                            <ChevronLeft className="h-5 w-5 text-slate-400" />
                        </Link>
                        <span className="font-semibold truncate text-sm md:hidden">{course.title}</span>
                    </div>

                    <div className="hidden md:block text-lg font-medium truncate max-w-xl">
                        {currentLesson?.title}
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                            disabled={!prevLessonId}
                            asChild={!!prevLessonId}
                        >
                            {prevLessonId ? (
                                <Link href={`/learn/${courseId}?lessonId=${prevLessonId}`}>
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                </Link>
                            ) : (
                                <span><ChevronLeft className="h-4 w-4 mr-1" /> Previous</span>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!nextLessonId}
                            onClick={handleNextLesson}
                            asChild={!!nextLessonId}
                        >
                            {nextLessonId ? (
                                <Link href={`/learn/${courseId}?lessonId=${nextLessonId}`}>
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                            ) : (
                                <span>Next <ChevronRight className="h-4 w-4 ml-1" /></span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                {children}
            </div>
        </div>
    )
}
