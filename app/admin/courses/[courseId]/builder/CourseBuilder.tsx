"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Course, Module, Lesson } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Plus, Trash, Video, FileText, File, Edit, HelpCircle,
    ChevronDown, ChevronRight, Sparkles, X, Save, Eye
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/RichTextEditor";
import VideoPlayer from "@/components/VideoPlayer";
import { generateCourseOutline } from "@/app/actions/generateCourseOutline";
import { ExamSettingsDialog } from "@/components/ExamSettingsDialog";

interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

interface CourseBuilderProps {
    course: Course;
    initialModules: ModuleWithLessons[];
}

export default function CourseBuilder({ course, initialModules }: CourseBuilderProps) {
    const [modules, setModules] = useState<ModuleWithLessons[]>(initialModules);
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
        initialModules.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
    );
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isCreatingModule, setIsCreatingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [editingModule, setEditingModule] = useState<{ id: string, title: string } | null>(null);
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

    const handleCreateModule = async () => {
        if (!newModuleTitle.trim()) return;
        setIsCreatingModule(true);

        try {
            const newOrder = modules.length > 0 ? modules[modules.length - 1].module_order + 1 : 1;

            const { data, error } = await supabase
                .from("modules")
                .insert({
                    course_id: course.id,
                    title: newModuleTitle,
                    module_order: newOrder,
                })
                .select()
                .single();

            if (error) throw error;

            setModules([...modules, { ...data, lessons: [] }]);
            setNewModuleTitle("");
            setExpandedModules(prev => ({ ...prev, [data.id]: true }));
            toast.success("Chapter created");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create chapter");
        } finally {
            setIsCreatingModule(false);
        }
    };

    const handleUpdateModule = async (moduleId: string, newTitle: string) => {
        try {
            const { error } = await supabase
                .from("modules")
                .update({ title: newTitle })
                .eq("id", moduleId);

            if (error) throw error;

            setModules(modules.map(m => m.id === moduleId ? { ...m, title: newTitle } : m));
            setEditingModule(null);
            toast.success("Chapter updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update chapter");
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        try {
            const { error } = await supabase.from("modules").delete().eq("id", moduleId);
            if (error) throw error;

            setModules(modules.filter((m) => m.id !== moduleId));
            if (selectedLesson && modules.find(m => m.id === moduleId)?.lessons.some(l => l.id === selectedLesson.id)) {
                setSelectedLesson(null);
            }
            toast.success("Chapter deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete chapter");
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm("Are you sure you want to delete this lesson?")) return;

        try {
            const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
            if (error) throw error;

            setModules(modules.map(m => ({
                ...m,
                lessons: m.lessons.filter(l => l.id !== lessonId)
            })));

            if (selectedLesson?.id === lessonId) {
                setSelectedLesson(null);
            }
            toast.success("Lesson deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete lesson");
        }
    };

    const handleLessonAdded = (moduleId: string, newLesson: Lesson) => {
        setModules(modules.map(m => {
            if (m.id === moduleId) {
                return { ...m, lessons: [...m.lessons, newLesson] };
            }
            return m;
        }));
        setSelectedLesson(newLesson);
    };

    const handleLessonUpdated = (updatedLesson: Lesson) => {
        setModules(modules.map(m => ({
            ...m,
            lessons: m.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
        })));
        setSelectedLesson(updatedLesson);
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [showOutlinePreview, setShowOutlinePreview] = useState(false);
    const [generatedOutline, setGeneratedOutline] = useState<any>(null);

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

    const [editingOutlineItem, setEditingOutlineItem] = useState<{ type: 'module' | 'lesson', mIndex: number, lIndex?: number, title: string } | null>(null);
    const [deletingOutlineItem, setDeletingOutlineItem] = useState<{ type: 'module' | 'lesson', mIndex: number, lIndex?: number } | null>(null);

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

            for (const moduleData of generatedOutline.modules) {
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
                    {modules.map((module) => (
                        <div key={module.id} className="mb-2">
                            <div
                                className="flex items-center py-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-md cursor-pointer group transition-colors"
                            >
                                <button className="mr-1 text-slate-400 dark:text-slate-500" onClick={() => toggleModule(module.id)}>
                                    {expandedModules[module.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <span className="font-medium text-sm flex-1 truncate text-slate-700 dark:text-slate-200" onClick={() => toggleModule(module.id)}>{module.title}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                    <button
                                        className="p-1 hover:text-blue-500 text-slate-400 dark:text-slate-500 dark:hover:text-blue-400 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingModule({ id: module.id, title: module.title });
                                        }}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </button>
                                    <DeleteModuleDialog
                                        moduleId={module.id}
                                        moduleTitle={module.title}
                                        onDelete={handleDeleteModule}
                                    />
                                </div>
                            </div>

                            {expandedModules[module.id] && (
                                <div className="ml-6 border-l-2 border-slate-100 dark:border-slate-800 pl-2 mt-1 space-y-1">
                                    {module.lessons.map((lesson) => (
                                        <div
                                            key={lesson.id}
                                            onClick={() => setSelectedLesson(lesson)}
                                            className={cn(
                                                "flex items-center py-1.5 px-2 text-sm rounded-md cursor-pointer group transition-colors",
                                                selectedLesson?.id === lesson.id
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                            )}
                                        >
                                            {lesson.content_type === "video" && <Video className="h-3 w-3 mr-2 text-blue-500 dark:text-blue-400" />}
                                            {lesson.content_type === "text" && <FileText className="h-3 w-3 mr-2 text-green-500 dark:text-green-400" />}
                                            {lesson.content_type === "pdf" && <File className="h-3 w-3 mr-2 text-red-500 dark:text-red-400" />}
                                            {lesson.content_type === "quiz" && <HelpCircle className="h-3 w-3 mr-2 text-purple-500 dark:text-purple-400" />}
                                            <span className="truncate flex-1">{lesson.title}</span>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 dark:hover:text-red-400 text-slate-400 dark:text-slate-500 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLesson(lesson.id);
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="pt-1">
                                        <AddContentModal
                                            moduleId={module.id}
                                            lessonCount={module.lessons.length}
                                            onLessonAdded={(lesson) => handleLessonAdded(module.id, lesson)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

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
            </div >

            {/* AI Outline Preview Dialog */}
            < Dialog open={showOutlinePreview} onOpenChange={setShowOutlinePreview} >
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

            {/* Delete Confirmation Dialog */}
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

            {/* Edit Module Dialog */}
            < Dialog open={!!editingModule
            } onOpenChange={(open) => !open && setEditingModule(null)}>
                <DialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">Edit Chapter Name</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Chapter Name</Label>
                            <Input
                                value={editingModule?.title || ""}
                                onChange={(e) => setEditingModule(editingModule ? { ...editingModule, title: e.target.value } : null)}
                                placeholder="Enter chapter name"
                                autoFocus
                                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingModule(null)} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</Button>
                        <Button onClick={() => editingModule && handleUpdateModule(editingModule.id, editingModule.title)}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Right Content Area */}
            < div className="flex-1 overflow-hidden bg-slate-50 dark:bg-[#0f1117]" >
                {
                    selectedLesson ? (
                        <LessonEditor
                            key={selectedLesson.id}
                            lesson={selectedLesson}
                            onUpdate={handleLessonUpdated}
                            onDelete={handleDeleteLesson}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-[#0f1117]">
                            <div className="text-center">
                                <Sparkles className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Select a lesson to edit</h3>
                                <p className="text-sm mt-1 text-slate-500 dark:text-slate-600">Click on a lesson in the sidebar to edit its content.</p>
                            </div >
                        </div >
                    )}
            </div >
        </div >
    );
}

function DeleteModuleDialog({ moduleId, moduleTitle, onDelete }: { moduleId: string, moduleTitle: string, onDelete: (id: string) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <button
                className="p-1 hover:text-red-500 text-slate-400 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <Trash className="h-3 w-3" />
            </button>
            <AlertDialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-white">Delete Chapter</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-slate-400">
                        Are you sure you want to delete "{moduleTitle}"? This will permanently delete all lessons in this chapter. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            onDelete(moduleId);
                            setOpen(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function AddContentModal({ moduleId, lessonCount, onLessonAdded }: { moduleId: string, lessonCount: number, onLessonAdded: (lesson: Lesson) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"select" | "details">("select");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    const supabase = createClient();

    const contentOptions = [
        { id: "video", label: "Video", icon: Video, description: "Add YouTube or Vimeo video" },
        { id: "text", label: "Text", icon: FileText, description: "Add text content" },
        { id: "pdf", label: "PDF", icon: File, description: "Upload PDF file" },
        { id: "quiz", label: "Quiz/Exam", icon: HelpCircle, description: "Add quiz or exam" },
    ];

    const handleTypeSelect = async (typeId: string) => {
        setSelectedType(typeId);
        setStep("details");

        // Load available exams if quiz is selected
        if (typeId === "quiz") {
            setIsLoadingExams(true);
            try {
                const { data, error } = await supabase
                    .from("exams")
                    .select("id, title, status")
                    .eq("status", "published")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setAvailableExams(data || []);
            } catch (error) {
                console.error("Error loading exams:", error);
                toast.error("Failed to load exams");
            } finally {
                setIsLoadingExams(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        // Validation for quiz
        if (selectedType === "quiz" && !selectedExamId) {
            toast.error("Please select an exam");
            return;
        }

        setIsLoading(true);
        try {
            let contentUrl = "";

            if (selectedType === "video") {
                contentUrl = convertToEmbedUrl(videoUrl);
            } else if (selectedType === "pdf" && pdfFile) {
                const fileName = `course-content/${Date.now()}-${pdfFile.name.replace(/\s+/g, "_")}`;
                const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, pdfFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
                contentUrl = data.publicUrl;
            }

            const lessonData: any = {
                module_id: moduleId,
                title,
                content_type: selectedType,
                content_url: contentUrl,
                lesson_order: lessonCount + 1,
                is_free_preview: false
            };

            // Add exam_id for quiz type
            if (selectedType === "quiz") {
                lessonData.exam_id = selectedExamId;
            }

            const { data, error } = await supabase
                .from("lessons")
                .insert(lessonData)
                .select()
                .single();

            if (error) throw error;

            onLessonAdded(data as Lesson);
            setIsOpen(false);
            resetForm();
            toast.success("Lesson added successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to add lesson");
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep("select");
        setSelectedType(null);
        setTitle("");
        setVideoUrl("");
        setPdfFile(null);
        setSelectedExamId("");
        setAvailableExams([]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                <button className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors w-full">
                    <Plus className="h-3 w-3 mr-2" /> Add chapter item
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-[#161b22] dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-white">{step === "select" ? "Add Content" : `Add ${contentOptions.find(o => o.id === selectedType)?.label}`}</DialogTitle>
                </DialogHeader>

                {step === "select" ? (
                    <div className="grid grid-cols-3 gap-4 py-4">
                        {contentOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleTypeSelect(option.id)}
                                className="flex flex-col items-start p-4 border dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md mb-3 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                    <option.icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                </div>
                                <span className="font-semibold text-sm mb-1 dark:text-white">{option.label}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{option.description}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter lesson title"
                                required
                                autoFocus
                                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                        </div>

                        {selectedType === "video" && (
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Video URL (YouTube/Vimeo)</Label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    required
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">Paste a YouTube or Vimeo URL</p>
                            </div>
                        )}

                        {selectedType === "pdf" && (
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Upload PDF File</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    required
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                        )}

                        {selectedType === "quiz" && (
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Select Exam/Quiz</Label>
                                {isLoadingExams ? (
                                    <div className="text-sm text-slate-500">Loading exams...</div>
                                ) : availableExams.length > 0 ? (
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={selectedExamId}
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select an exam...</option>
                                        {availableExams.map((exam) => (
                                            <option key={exam.id} value={exam.id}>
                                                {exam.title}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-slate-500">
                                        No published exams available. Please create an exam first.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setStep("select")} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Back</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Adding..." : "Add Lesson"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function LessonEditor({ lesson, onUpdate, onDelete }: { lesson: Lesson, onUpdate: (lesson: Lesson) => void, onDelete: (id: string) => void }) {
    const [title, setTitle] = useState(lesson.title);
    const [contentUrl, setContentUrl] = useState(lesson.content_url || "");
    const [contentText, setContentText] = useState(lesson.content_text || "");
    const [isSaving, setIsSaving] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showExamSettings, setShowExamSettings] = useState(false);
    const supabase = createClient();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalContentUrl = contentUrl;

            // Handle PDF upload if new file selected
            if (lesson.content_type === "pdf" && pdfFile) {
                const fileName = `course-content/${Date.now()}-${pdfFile.name.replace(/\s+/g, "_")}`;
                const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, pdfFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
                finalContentUrl = data.publicUrl;
            }

            // Convert video URL to embed format
            if (lesson.content_type === "video") {
                finalContentUrl = convertToEmbedUrl(contentUrl);
            }

            const { data, error } = await supabase
                .from("lessons")
                .update({
                    title,
                    content_url: finalContentUrl,
                    content_text: contentText,
                    is_downloadable: lesson.is_downloadable,
                })
                .eq("id", lesson.id)
                .select()
                .single();

            if (error) throw error;

            onUpdate(data as Lesson);
            toast.success("Lesson updated successfully");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update lesson");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#161b22]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    {lesson.content_type === "video" && <Video className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                    {lesson.content_type === "text" && <FileText className="h-5 w-5 text-green-500 dark:text-green-400" />}
                    {lesson.content_type === "pdf" && <File className="h-5 w-5 text-red-500 dark:text-red-400" />}
                    {lesson.content_type === "quiz" && <HelpCircle className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0 bg-transparent dark:text-white"
                        placeholder="Lesson Title"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-red-400">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Delete Lesson</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            Are you sure you want to delete "{title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(lesson.id);
                                setShowDeleteDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {lesson.content_type === "video" && (
                        <>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Video URL</Label>
                                <Input
                                    value={contentUrl}
                                    onChange={(e) => setContentUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">Paste a YouTube or Vimeo URL</p>
                            </div>

                            {contentUrl && (
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Preview</Label>
                                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                        {/* <iframe
                                            src={convertToEmbedUrl(contentUrl)}
                                            className="w-full h-full"
                                            allowFullScreen
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        /> */}
                                        <VideoPlayer url={convertToEmbedUrl(contentUrl)} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {lesson.content_type === "pdf" && (
                        <>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Upload New PDF (Optional)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                                {contentUrl && !pdfFile && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Current file: <a href={contentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">View PDF</a>
                                    </p>
                                )}
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="is-downloadable"
                                        checked={lesson.is_downloadable ?? true}
                                        onCheckedChange={(checked) => onUpdate({ ...lesson, is_downloadable: checked })}
                                    />
                                    <Label htmlFor="is-downloadable" className="dark:text-slate-300">Allow Download</Label>
                                </div>
                            </div>

                            {contentUrl && (
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Preview</Label>
                                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <iframe
                                            src={contentUrl}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {lesson.content_type === "text" && (
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Content</Label>
                            <RichTextEditor
                                value={contentText}
                                onChange={setContentText}
                                placeholder="Enter your lesson content here..."
                                className="min-h-[400px] dark:bg-slate-900 dark:border-slate-700"
                            />
                        </div>
                    )}

                    {lesson.content_type === "quiz" && (
                        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Quiz Content</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                This lesson is linked to an exam. Students will see the exam interface when they access this lesson.
                            </p>
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowExamSettings(true)}
                                    className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    Manage Exam Settings
                                </Button>
                            </div>

                            {lesson.exam_id && (
                                <ExamSettingsDialog
                                    open={showExamSettings}
                                    onOpenChange={setShowExamSettings}
                                    examId={lesson.exam_id}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper function to convert YouTube/Vimeo URLs to embed format
function convertToEmbedUrl(url: string): string {
    if (!url) return "";

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
}
