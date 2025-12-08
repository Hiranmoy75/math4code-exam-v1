"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Course, Module, Lesson } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
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
import {
    Plus, Trash, Edit, Sparkles, Eye, ChevronDown, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { DeleteModuleDialog } from "./DeleteModuleDialog";
import { ModuleList } from "./ModuleList";
import { LessonEditor } from "./LessonEditor";
import { generateCourseOutline } from "@/app/actions/generateCourseOutline";
import { useCourseModules, ModuleWithLessons } from "@/hooks/useCourseModules";

interface CourseBuilderProps {
    course: Course;
    initialModules: ModuleWithLessons[];
}

export default function CourseBuilder({ course, initialModules }: CourseBuilderProps) {
    const {
        modules,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        reorderModules,
        reorderLessons,
        isAddingModule
    } = useCourseModules(course.id, initialModules);

    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
        initialModules.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
    );
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isCreatingModule, setIsCreatingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [editingModule, setEditingModule] = useState<{ id: string, title: string } | null>(null);
    const [deletingModule, setDeletingModule] = useState<{ id: string, title: string } | null>(null);
    const [isPublished, setIsPublished] = useState(course.is_published);
    const supabase = createClient();
    const router = useRouter();

    const togglePublish = async () => {
        try {
            const { error } = await supabase
                .from("courses")
                .update({ is_published: !isPublished })
                .eq("id", course.id);

            if (error) throw error;

            setIsPublished(!isPublished);
            toast.success(!isPublished ? "Course published" : "Course unpublished");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update course status");
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleCreateModule = () => {
        const titleToSave = newModuleTitle.trim();
        if (!titleToSave) return;

        setNewModuleTitle("");
        setIsCreatingModule(false);

        addModule(titleToSave, {
            onError: () => {
                toast.error(`Failed to add '${titleToSave}'!`, {
                    duration: Infinity,
                    action: {
                        label: "Retry",
                        onClick: () => {
                            toast.info("Retrying...");
                            addModule(titleToSave);
                        }
                    }
                });
            }
        });
    };

    const handleUpdateModule = (moduleId: string, newTitle: string) => {
        setEditingModule(null);
        updateModule({ id: moduleId, title: newTitle }, {
            onError: () => {
                toast.error(`Rename to '${newTitle}' failed!`, {
                    duration: Infinity,
                    action: {
                        label: "Retry",
                        onClick: () => {
                            toast.info("Retrying...");
                            updateModule({ id: moduleId, title: newTitle });
                        }
                    }
                });
            }
        });
    };

    const handleDeleteModule = (moduleId: string) => {
        deleteModule(moduleId);
        setDeletingModule(null);
        if (selectedLesson && modules.find(m => m.id === moduleId)?.lessons.some(l => l.id === selectedLesson.id)) {
            setSelectedLesson(null);
        }
    };

    const handleDeleteLesson = (lessonId: string) => {
        const lesson = modules.flatMap(m => m.lessons).find(l => l.id === lessonId);
        if (!lesson) return;

        deleteLesson(lesson);
        if (selectedLesson?.id === lessonId) setSelectedLesson(null);
    };

    // AI Outline Generation States
    const [isGenerating, setIsGenerating] = useState(false);
    const [showOutlinePreview, setShowOutlinePreview] = useState(false);
    const [generatedOutline, setGeneratedOutline] = useState<any>(null);
    const [editingOutlineItem, setEditingOutlineItem] = useState<{ type: 'module' | 'lesson', mIndex: number, lIndex?: number, title: string } | null>(null);
    const [deletingOutlineItem, setDeletingOutlineItem] = useState<{ type: 'module' | 'lesson', mIndex: number, lIndex?: number } | null>(null);

    const handleGenerateOutline = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCourseOutline(course.title);
            if (result.success) {
                setGeneratedOutline(result.outline);
                setShowOutlinePreview(true);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate outline");
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmDeleteOutlineItem = () => {
        if (!deletingOutlineItem) return;
        const { type, mIndex, lIndex } = deletingOutlineItem;
        const newModules = [...generatedOutline.modules];

        if (type === 'module') {
            newModules.splice(mIndex, 1);
        } else if (type === 'lesson' && typeof lIndex === 'number') {
            newModules[mIndex].lessons.splice(lIndex, 1);
        }

        setGeneratedOutline({ ...generatedOutline, modules: newModules });
        setDeletingOutlineItem(null);
    };

    const saveOutlineItemEdit = () => {
        if (!editingOutlineItem || !editingOutlineItem.title.trim()) return;
        const { type, mIndex, lIndex, title } = editingOutlineItem;
        const newModules = [...generatedOutline.modules];

        if (type === 'module') {
            newModules[mIndex].title = title;
        } else if (type === 'lesson' && typeof lIndex === 'number') {
            newModules[mIndex].lessons[lIndex].title = title;
        }

        setGeneratedOutline({ ...generatedOutline, modules: newModules });
        setEditingOutlineItem(null);
    };

    const handleApplyOutline = async () => {
        if (!generatedOutline) return;
        setIsGenerating(true);
        const toastId = toast.loading("Creating course structure...");

        try {
            // Get current max module order
            let currentOrder = modules.length > 0 ? Math.max(...modules.map(m => m.module_order)) : 0;

            // Cast modules to any[] to avoid implicit any errors on loop variable
            const modulesList = generatedOutline.modules as any[];
            for (const moduleData of modulesList) {
                currentOrder++;
                // Create module
                const { data: module, error: moduleError } = await supabase
                    .from("modules")
                    .insert({
                        course_id: course.id,
                        title: moduleData.title,
                        module_order: currentOrder,
                    })
                    .select()
                    .single();

                if (moduleError) throw moduleError;

                // Create lessons
                if (moduleData.lessons && moduleData.lessons.length > 0) {
                    const lessonsToInsert = moduleData.lessons.map((lesson: any, index: number) => ({
                        module_id: module.id,
                        title: lesson.title,
                        content_type: lesson.content_type || "text",
                        lesson_order: index + 1,
                        is_free_preview: false,
                        content_text: lesson.content_type === "text" ? "Upcoming content..." : "",
                        content_url: (lesson.content_type === "video" || lesson.content_type === "pdf") ? "https://placeholder.com/upcoming" : "",
                    }));

                    const { error: lessonsError } = await supabase
                        .from("lessons")
                        .insert(lessonsToInsert);

                    if (lessonsError) throw lessonsError;
                }
            }

            toast.success("Course structure created successfully", { id: toastId });
            setShowOutlinePreview(false);
            setGeneratedOutline(null);
            router.refresh(); // Refresh to show new modules

            // Reload window to ensure full state sync (simpler than manual state update for complex nested data)
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to apply outline: " + error.message, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0f1117]">
            {/* Left Sidebar */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] sticky top-0 z-10">
                    <h2 className="font-semibold text-lg truncate text-slate-900 dark:text-white" title={course.title}>{course.title}</h2>
                    <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => router.push("/admin/courses")} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                            Back
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/courses/${course.id}`)} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                            <Eye className="h-4 w-4 mr-1" /> Preview
                        </Button>
                        <Button
                            size="sm"
                            variant={isPublished ? "secondary" : "default"}
                            onClick={togglePublish}
                            className={cn(
                                isPublished
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                        >
                            {isPublished ? "Published" : "Publish"}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {/* Module List Component */}
                    <div className="space-y-4">
                        <ModuleList
                            modules={modules}
                            expandedModules={expandedModules}
                            toggleModule={toggleModule}
                            editingModule={editingModule}
                            setEditingModule={setEditingModule}
                            handleUpdateModule={handleUpdateModule}
                            handleDeleteModuleRequest={(id, title) => setDeletingModule({ id, title })}
                            selectedLesson={selectedLesson}
                            setSelectedLesson={setSelectedLesson}
                            addLesson={addLesson}
                            reorderModules={reorderModules}
                            reorderLessons={reorderLessons}
                        />
                    </div>

                    <div className="mt-4 px-2">
                        {isCreatingModule ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    autoFocus
                                    placeholder="Chapter Title"
                                    value={newModuleTitle}
                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                    className="h-8 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                                />
                                <Button size="sm" onClick={handleCreateModule} disabled={!newModuleTitle.trim()}>Add</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsCreatingModule(false)}>X</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10"
                                    onClick={() => setIsCreatingModule(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add new chapter
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-500/10"
                                    onClick={handleGenerateOutline}
                                    disabled={isGenerating}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {isGenerating ? "Generating..." : "Generate with AI"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Outline Preview Dialog */}
            <Dialog open={showOutlinePreview} onOpenChange={setShowOutlinePreview}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto dark:bg-[#161b22] dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            AI Generated Outline
                        </DialogTitle>
                        <DialogDescription>
                            Review the generated structure below. Click "Apply" to add these chapters and lessons to your course.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {generatedOutline?.modules.map((module: any, mIndex: number) => (
                            <div key={mIndex} className="border dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg dark:text-white">{module.title}</h3>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingOutlineItem({ type: 'module', mIndex, title: module.title })} className="h-8 w-8 p-0">
                                            <Edit className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDeletingOutlineItem({ type: 'module', mIndex })} className="h-8 w-8 p-0">
                                            <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                                <ul className="space-y-2 pl-4 text-slate-600 dark:text-slate-400">
                                    {module.lessons.map((lesson: any, lIndex: number) => (
                                        <li key={lIndex} className="flex items-center justify-between group bg-white dark:bg-slate-800 p-2 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                <span>{lesson.title}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                                                    {lesson.content_type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingOutlineItem({ type: 'lesson', mIndex, lIndex, title: lesson.title })} className="h-6 w-6 p-0">
                                                    <Edit className="h-3 w-3 text-blue-500" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingOutlineItem({ type: 'lesson', mIndex, lIndex })} className="h-6 w-6 p-0">
                                                    <Trash className="h-3 w-3 text-red-500" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOutlinePreview(false)} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</Button>
                        <Button onClick={handleApplyOutline} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {isGenerating ? "Creating..." : "Apply Outline"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Outline Item Dialog */}
            <Dialog open={!!editingOutlineItem} onOpenChange={(open) => !open && setEditingOutlineItem(null)}>
                <DialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Edit {editingOutlineItem?.type === 'module' ? 'Chapter' : 'Lesson'} Title</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={editingOutlineItem?.title || ""}
                            onChange={(e) => setEditingOutlineItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                            placeholder="Enter title"
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                            onKeyDown={(e) => e.key === 'Enter' && saveOutlineItemEdit()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditingOutlineItem(null)}>Cancel</Button>
                        <Button onClick={saveOutlineItemEdit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog for Outline */}
            <AlertDialog open={!!deletingOutlineItem} onOpenChange={(open) => !open && setDeletingOutlineItem(null)}>
                <AlertDialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this {deletingOutlineItem?.type === 'module' ? 'chapter and all its lessons' : 'lesson'} from the generated outline.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteOutlineItem} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Module Dialog (from sidebar) */}
            <DeleteModuleDialog
                open={!!deletingModule}
                onOpenChange={(open) => !open && setDeletingModule(null)}
                onConfirm={() => deletingModule && handleDeleteModule(deletingModule.id)}
                moduleTitle={deletingModule?.title || ""}
            />

            {/* Right Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-[#0f1117]">
                {selectedLesson ? (
                    <LessonEditor
                        key={selectedLesson.id}
                        lesson={selectedLesson}
                        course={course}
                        onUpdate={(updates) => updateLesson({ id: selectedLesson.id, ...updates })}
                        onDelete={handleDeleteLesson}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-[#0f1117]">
                        <div className="text-center">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Select a lesson to edit</h3>
                            <p className="text-sm mt-1 text-slate-500 dark:text-slate-600">Click on a lesson in the sidebar to edit its content.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
