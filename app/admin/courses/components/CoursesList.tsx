"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutGrid,
    List as ListIcon,
    Search,
    Plus,
    MoreVertical,
    Edit,
    Trash,
    BookOpen,
    Users,
    Clock,
    DollarSign,
    BarChart,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CourseLearnersDialog } from "../CourseLearnersDialog";
import { formatDistanceToNow } from "date-fns";
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDeleteCourse } from "@/hooks/admin/useAdminCourses";
import { CommunityToggle } from "@/components/admin/CommunityToggle";
import { useCommunityModal } from "@/context/CommunityModalContext";

interface Course {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string | null;
    level: string | null;
    is_published: boolean;
    thumbnail_url: string | null;
    created_at: string;
    creator_id: string;
    community_enabled: boolean;
}

interface CoursesListProps {
    initialCourses: Course[];
}

export default function CoursesList({ initialCourses }: CoursesListProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [courses, setCourses] = useState(initialCourses);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const deleteCourse = useDeleteCourse();
    const isDeleting = deleteCourse.isPending;

    const handleDelete = async () => {
        if (!courseToDelete) return;

        try {
            await deleteCourse.mutateAsync(courseToDelete.id);
            setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
            router.refresh();
        } catch (error) {
            // Error handling is done in the hook
            console.error(error);
        } finally {
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        }
    };

    const confirmDelete = (course: Course) => {
        setCourseToDelete(course);
        setDeleteDialogOpen(true);
    };

    const handleToggleCommunity = (courseId: string, enabled: boolean) => {
        setCourses(prev => prev.map(c =>
            c.id === courseId ? { ...c, community_enabled: enabled } : c
        ));
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search courses..."
                        className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-md transition-all ${viewMode === "grid"
                                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-md transition-all ${viewMode === "list"
                                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <Link href="/admin/courses/create">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-4 w-4" /> Create Course
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {filteredCourses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700"
                    >
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No courses found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search terms</p>
                    </motion.div>
                ) : viewMode === "grid" ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {filteredCourses.map((course, index) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                index={index}
                                onDelete={() => confirmDelete(course)}
                                onToggle={(enabled) => handleToggleCommunity(course.id, enabled)}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
                    >
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredCourses.map((course, index) => (
                                <CourseRow
                                    key={course.id}
                                    course={course}
                                    index={index}
                                    onDelete={() => confirmDelete(course)}
                                    onToggle={(enabled) => handleToggleCommunity(course.id, enabled)}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course
                            <span className="font-bold text-slate-900 dark:text-white"> "{courseToDelete?.title}" </span>
                            and remove all associated data including lessons and enrollments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                        >
                            {isDeleting ? "Deleting..." : "Delete Course"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CourseCard({ course, index, onDelete, onToggle }: { course: Course; index: number; onDelete: () => void; onToggle: (enabled: boolean) => void }) {
    const { openCommunity } = useCommunityModal();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Card className="group h-full flex flex-col border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <CourseThumbnail
                        src={course.thumbnail_url}
                        title={course.title}
                        category={course.category || "Course"}
                        className="w-full h-full"
                        variant="card"
                    />
                    <div className="absolute top-3 right-3">
                        <Badge
                            variant={course.is_published ? "default" : "secondary"}
                            className={course.is_published
                                ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20"
                                : "bg-slate-500 hover:bg-slate-600 shadow-lg shadow-slate-500/20 text-white"}
                        >
                            {course.is_published ? "Published" : "Draft"}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                            <h3 className="font-bold text-lg line-clamp-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {course.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {course.category || "General"}
                                </span>
                                <span>•</span>
                                <span>{course.level || "All Levels"}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-grow">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                        {course.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center">
                            {course.price > 0 ? (
                                <>
                                    <DollarSign className="h-3.5 w-3.5" />
                                    {course.price}
                                </>
                            ) : (
                                <span className="text-green-600 dark:text-green-400">Free</span>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3 mt-auto">
                    {/* Community Toggle */}
                    <CommunityToggle
                        courseId={course.id}
                        initialEnabled={course.community_enabled || false}
                        onToggle={onToggle}
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-1">
                            <CourseLearnersDialog courseId={course.id} courseTitle={course.title} />
                        </div>
                        <div className="flex items-center gap-2">
                            {course.community_enabled && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 border-slate-200 dark:border-slate-700"
                                    onClick={() => openCommunity({ courseId: course.id, isAdmin: true })}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" /> Community
                                </Button>
                            )}
                            <Link href={`/admin/courses/${course.id}/builder`}>
                                <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 border-slate-200 dark:border-slate-700">
                                    <Edit className="h-4 w-4 mr-2" /> Manage
                                </Button>
                            </Link>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                        onClick={onDelete}
                                    >
                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}

function CourseRow({ course, index, onDelete, onToggle }: { course: Course; index: number; onDelete: () => void; onToggle: (enabled: boolean) => void }) {
    const { openCommunity } = useCommunityModal();
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                <CourseThumbnail
                    src={course.thumbnail_url}
                    title={course.title}
                    category={course.category || "Course"}
                    className="w-full h-full"
                    variant="card"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                    </h3>
                    <Badge
                        variant="outline"
                        className={course.is_published
                            ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                            : "text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"}
                    >
                        {course.is_published ? "Published" : "Draft"}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <BarChart className="h-3.5 w-3.5" />
                        {course.level || "All Levels"}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right">
                    <div className="font-semibold text-slate-900 dark:text-white">
                        {course.price > 0 ? `$${course.price}` : "Free"}
                    </div>
                    <div className="text-xs text-slate-500">Price</div>
                </div>

                <div className="flex items-center gap-2">
                    <CourseLearnersDialog courseId={course.id} courseTitle={course.title} />
                    <Link href={`/admin/courses/${course.id}/builder`}>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                            Manage
                        </Button>
                    </Link>
                    {course.community_enabled && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                            onClick={() => openCommunity({ courseId: course.id, isAdmin: true })}
                        >
                            <MessageSquare className="h-4 w-4 mr-2" /> Community
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                onClick={onDelete}
                            >
                                <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
}
