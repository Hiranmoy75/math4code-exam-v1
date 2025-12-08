"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlayCircle, FileText, ChevronLeft, ChevronRight, HelpCircle, Menu, X, PanelLeftClose, PanelLeft, CheckCircle, BookOpen, Video, Share2, User, Book, Users, Lock } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useLessonProgress, useMarkLessonComplete } from "@/hooks/student/useLessonProgress"
import { ModeToggle } from "@/components/mode-toggle"
import { useCommunityModal } from "@/context/CommunityModalContext"
import { useCourse } from "@/hooks/useCourse"
import { useLessons } from "@/hooks/useLessons"

interface CoursePlayerClientProps {
    courseId: string
    user: any
    profile: any
    isEnrolled: boolean
    children: React.ReactNode
}

export function CoursePlayerClient({
    courseId,
    user,
    profile,
    isEnrolled,
    children
}: CoursePlayerClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false)
    const [userId, setUserId] = useState<string | null>(user?.id || null)
    const [progressPercentage, setProgressPercentage] = useState(0)
    const { openCommunity } = useCommunityModal()

    // LAYER 2 OPTIMIZATION: Use Hooks with Cached Data
    const { data: course } = useCourse(courseId);
    const { data: modules } = useLessons(courseId);

    const searchParams = useSearchParams();
    const lessonIdParam = searchParams.get("lessonId");

    // Flatten lessons logic moved here
    const allLessons = useMemo(() => {
        if (!modules) return [];
        return modules.flatMap((m: any) => m.lessons); // Lessons are sorted in the hook
    }, [modules]);

    // Determine Current Lesson
    const currentLesson = useMemo(() => {
        if (!allLessons.length) return null;
        if (lessonIdParam) {
            return allLessons.find((l: any) => l.id === lessonIdParam) || null;
        }
        return allLessons[0]; // Default to first lesson if not specified
    }, [allLessons, lessonIdParam]);

    // Refetch user execution handled by hooks/props usually, keeping legacy effect for safety or removal
    useEffect(() => {
        if (!userId) {
            const getUser = async () => {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUserId(user.id)
                }
            }
            getUser()
        }
    }, [userId])

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

    // Render loading or empty states if data isn't hydrated yet (should not happen with hydration)
    if (!course || !modules) {
        return null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: desktopSidebarCollapsed ? 0 : 320 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-r border-border bg-card hidden md:flex flex-col overflow-hidden z-20"
            >
                <div className="p-6 border-b border-border bg-card">
                    <div className="flex items-center gap-3 mb-6">
                        <Link href="/student/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                        <h2 className="font-bold truncate text-lg text-foreground tracking-tight">{course.title}</h2>
                    </div>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                            <span>Progress</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/30 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full bg-emerald-500"
                            />
                        </div>
                    </div>
                </div>
                <ScrollArea className="flex-1 min-h-0 bg-muted/5">
                    <TooltipProvider delayDuration={0}>
                        <Accordion type="single" collapsible className="w-full space-y-2 p-2" defaultValue={modules[0]?.id}>
                            {modules.map((module: any) => (
                                <AccordionItem key={module.id} value={module.id} className="border-none">
                                    <AccordionTrigger className="px-3 hover:no-underline hover:bg-muted/50 py-3 rounded-lg text-foreground/80 data-[state=open]:text-foreground transition-all">
                                        <div className="flex items-center justify-between w-full pr-2">
                                            <div className="text-left text-sm font-semibold tracking-tight line-clamp-1 mr-2">
                                                {module.title}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-1 pb-0">
                                        <div className="space-y-1">
                                            {module.lessons.map((lesson: any) => {
                                                const isActive = currentLesson?.id === lesson.id;
                                                const isCompleted = isLessonCompleted(lesson.id);
                                                const isLocked = !isEnrolled && !lesson.is_free_preview;

                                                let Icon = BookOpen;
                                                let typeLabel = "Reading";
                                                if (lesson.content_type === "video") { Icon = Video; typeLabel = "Video"; }
                                                if (lesson.content_type === "quiz") { Icon = HelpCircle; typeLabel = "Quiz"; }
                                                if (lesson.content_type === "pdf") { Icon = FileText; typeLabel = "PDF"; }

                                                if (isLocked) {
                                                    return (
                                                        <div
                                                            key={lesson.id}
                                                            className={cn(
                                                                "group flex items-start gap-3 py-3 px-4 text-sm transition-all rounded-lg border-l-4 border-transparent text-muted-foreground/50 cursor-not-allowed bg-muted/10",
                                                            )}
                                                        >
                                                            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium line-clamp-2 leading-tight">
                                                                    {lesson.title}
                                                                </div>
                                                                <div className="text-xs mt-1 text-muted-foreground/40">
                                                                    {typeLabel} • Locked
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                return (
                                                    <Link
                                                        key={lesson.id}
                                                        href={`/learn/${courseId}?lessonId=${lesson.id}`}
                                                        className={cn(
                                                            "group flex items-start gap-3 py-3 px-4 text-sm transition-all rounded-lg border-l-4",
                                                            isActive
                                                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-950 dark:text-emerald-50"
                                                                : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        <Icon className={cn(
                                                            "h-5 w-5 shrink-0 mt-0.5",
                                                            isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"
                                                        )} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className={cn("font-medium line-clamp-2 leading-tight", isActive ? "text-emerald-900 dark:text-emerald-100" : "text-foreground")}>
                                                                {lesson.title}
                                                            </div>
                                                            <div className={cn("text-xs mt-1", isActive ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-muted-foreground/60")}>
                                                                {typeLabel} {lesson.is_free_preview && !isEnrolled && "• Free Preview"}
                                                            </div>
                                                        </div>
                                                        {isCompleted && (
                                                            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 fill-emerald-500/10" />
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </TooltipProvider>
                </ScrollArea>
                <div className="p-4 border-t border-border bg-card text-xs text-muted-foreground">
                    <div className="flex flex-col gap-2">
                        <p>© 2022. All rights reserved.</p>
                        <div className="flex gap-2">
                            <Link href="#" className="hover:text-foreground transition-colors">Help Center</Link>
                            <span>·</span>
                            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                </div>
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
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90] md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-[100] w-80 bg-card shadow-2xl border-r border-border md:hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-border bg-card flex items-center justify-between">
                                <span className="font-bold truncate text-lg text-foreground tracking-tight">{course.title}</span>
                                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <X className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>
                            <ScrollArea className="flex-1 min-h-0 bg-muted/5">
                                <Accordion type="single" collapsible className="w-full space-y-2 p-2" defaultValue={modules[0]?.id}>
                                    {modules.map((module: any) => (
                                        <AccordionItem key={module.id} value={module.id} className="border-none">
                                            <AccordionTrigger className="px-3 hover:no-underline hover:bg-muted/50 py-3 rounded-lg text-foreground/80 data-[state=open]:text-foreground transition-all">
                                                <div className="flex items-center justify-between w-full pr-2">
                                                    <div className="text-left text-sm font-semibold tracking-tight line-clamp-1 mr-2">
                                                        {module.title}
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-1 pb-0">
                                                <div className="space-y-1">
                                                    {module.lessons.map((lesson: any) => {
                                                        const isActive = currentLesson?.id === lesson.id;
                                                        const isCompleted = isLessonCompleted(lesson.id);
                                                        const isLocked = !isEnrolled && !lesson.is_free_preview;

                                                        let Icon = BookOpen;
                                                        let typeLabel = "Reading";
                                                        if (lesson.content_type === "video") { Icon = Video; typeLabel = "Video"; }
                                                        if (lesson.content_type === "quiz") { Icon = HelpCircle; typeLabel = "Quiz"; }
                                                        if (lesson.content_type === "pdf") { Icon = FileText; typeLabel = "PDF"; }

                                                        if (isLocked) {
                                                            return (
                                                                <div
                                                                    key={lesson.id}
                                                                    className={cn(
                                                                        "group flex items-start gap-3 py-3 px-4 text-sm transition-all rounded-lg border-l-4 border-transparent text-muted-foreground/50 cursor-not-allowed bg-muted/10",
                                                                    )}
                                                                >
                                                                    <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium line-clamp-2 leading-tight">
                                                                            {lesson.title}
                                                                        </div>
                                                                        <div className="text-xs mt-1 text-muted-foreground/40">
                                                                            {typeLabel} • Locked
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }

                                                        return (
                                                            <Link
                                                                key={lesson.id}
                                                                href={`/learn/${courseId}?lessonId=${lesson.id}`}
                                                                onClick={() => setSidebarOpen(false)}
                                                                className={cn(
                                                                    "group flex items-start gap-3 py-3 px-4 text-sm transition-all rounded-lg border-l-4",
                                                                    isActive
                                                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-950 dark:text-emerald-50"
                                                                        : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                                )}
                                                            >
                                                                <Icon className={cn(
                                                                    "h-5 w-5 shrink-0 mt-0.5",
                                                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"
                                                                )} />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={cn("font-medium line-clamp-2 leading-tight", isActive ? "text-emerald-900 dark:text-emerald-100" : "text-foreground")}>
                                                                        {lesson.title}
                                                                    </div>
                                                                    <div className={cn("text-xs mt-1", isActive ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-muted-foreground/60")}>
                                                                        {typeLabel} {lesson.is_free_preview && !isEnrolled && "• Free Preview"}
                                                                    </div>
                                                                </div>
                                                                {isCompleted && (
                                                                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 fill-emerald-500/10" />
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
                            <div className="p-4 border-t border-border bg-card text-xs text-muted-foreground">
                                <div className="flex flex-col gap-2">
                                    <p>© 2022. All rights reserved.</p>
                                    <div className="flex gap-2">
                                        <Link href="#" className="hover:text-foreground transition-colors">Help Center</Link>
                                        <span>·</span>
                                        <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Navigation Bar */}
                <div className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <Menu className="h-5 w-5 text-muted-foreground" />
                        </button>
                        {/* Desktop sidebar toggle */}
                        <button
                            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                            className="hidden md:block p-2 hover:bg-accent rounded-lg transition-colors"
                            title={desktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                        >
                            {desktopSidebarCollapsed ? (
                                <PanelLeft className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
                            )}
                        </button>

                        {/* Breadcrumbs */}
                        <Breadcrumb className="hidden md:flex">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/student/dashboard" className="flex items-center gap-1">
                                        <Book className="h-4 w-4" />
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={`/courses/${courseId}`} className="max-w-[150px] truncate">
                                        {course.title}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="max-w-[200px] truncate font-medium">
                                        {currentLesson?.title}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 border-border bg-transparent">
                                    <User className="h-4 w-4" />
                                    <span className="max-w-[100px] truncate">{profile?.full_name || user?.email || "User"}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem>Settings</DropdownMenuItem>
                                <DropdownMenuItem>Log out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            onClick={() => openCommunity()}
                        >
                            <Users className="h-4 w-4" />
                            Community
                        </Button>

                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 hidden sm:flex">
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>

                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || "User"} />
                            <AvatarFallback>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Content Area */}
                {children}
            </div>
        </div>
    )
}
