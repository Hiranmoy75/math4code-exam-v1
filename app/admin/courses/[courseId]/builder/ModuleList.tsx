"use client";

import { ModuleWithLessons } from "@/hooks/useCourseModules";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Edit, Trash, Video, FileText, File, HelpCircle } from "lucide-react";
import { AddContentModal } from "./AddContentModal";
import { cn } from "@/lib/utils";

interface ModuleListProps {
    modules: ModuleWithLessons[];
    expandedModules: Record<string, boolean>;
    toggleModule: (id: string) => void;
    editingModule: { id: string, title: string } | null;
    setEditingModule: (m: { id: string, title: string } | null) => void;
    handleUpdateModule: (id: string, title: string) => void;
    handleDeleteModuleRequest: (id: string, title: string) => void;
    selectedLesson: Lesson | null;
    setSelectedLesson: (l: Lesson | null) => void;
    addLesson: (data: any) => Promise<Lesson>;
}

export function ModuleList({
    modules,
    expandedModules,
    toggleModule,
    editingModule,
    setEditingModule,
    handleUpdateModule,
    handleDeleteModuleRequest,
    selectedLesson,
    setSelectedLesson,
    addLesson
}: ModuleListProps) {
    if (modules.length === 0) {
        return (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">
                    No modules yet. Start by creating a module to organize your course content.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {modules.map((module) => (
                <ModuleItem
                    key={module.id}
                    module={module}
                    isExpanded={!!expandedModules[module.id]}
                    onToggle={() => toggleModule(module.id)}
                    isEditing={editingModule?.id === module.id}
                    editingTitle={editingModule?.title || ""}
                    onEditStart={() => setEditingModule({ id: module.id, title: module.title })}
                    onEditChange={(title) => setEditingModule({ ...editingModule!, title })}
                    onEditSave={() => handleUpdateModule(module.id, editingModule!.title)}
                    onEditCancel={() => setEditingModule(null)}
                    onDeleteRequest={() => handleDeleteModuleRequest(module.id, module.title)}
                    selectedLessonId={selectedLesson?.id || null}
                    onSelectLesson={setSelectedLesson}
                    onAddLesson={addLesson}
                />
            ))}
        </div>
    );
}

interface ModuleItemProps {
    module: ModuleWithLessons;
    isExpanded: boolean;
    onToggle: () => void;
    isEditing: boolean;
    editingTitle: string;
    onEditStart: () => void;
    onEditChange: (val: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onDeleteRequest: () => void;
    selectedLessonId: string | null;
    onSelectLesson: (l: Lesson) => void;
    onAddLesson: (data: any) => Promise<Lesson>;
}

function ModuleItem({
    module,
    isExpanded,
    onToggle,
    isEditing,
    editingTitle,
    onEditStart,
    onEditChange,
    onEditSave,
    onEditCancel,
    onDeleteRequest,
    selectedLessonId,
    onSelectLesson,
    onAddLesson
}: ModuleItemProps) {
    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
            <div
                className="p-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3 flex-1">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}

                    {isEditing ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                                value={editingTitle}
                                onChange={(e) => onEditChange(e.target.value)}
                                className="h-8 dark:bg-slate-800 dark:text-white"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") onEditSave();
                                    if (e.key === "Escape") onEditCancel();
                                }}
                            />
                            <Button size="sm" onClick={onEditSave} className="h-8">Save</Button>
                            <Button size="sm" variant="ghost" onClick={onEditCancel} className="h-8">Cancel</Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group flex-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{module.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditStart();
                                    }}
                                >
                                    <Edit className="h-3 w-3" />
                                </button>
                                <button
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRequest();
                                    }}
                                >
                                    <Trash className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{module.lessons.length} lessons</span>
                </div>
            </div>

            {isExpanded && (
                <div className="p-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
                    {module.lessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors group",
                                selectedLessonId === lesson.id
                                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            )}
                        >
                            {lesson.content_type === "video" && <Video className="h-4 w-4 shrink-0" />}
                            {lesson.content_type === "text" && <FileText className="h-4 w-4 shrink-0" />}
                            {lesson.content_type === "pdf" && <File className="h-4 w-4 shrink-0" />}
                            {lesson.content_type === "quiz" && <HelpCircle className="h-4 w-4 shrink-0" />}
                            <span className="text-sm truncate flex-1">{lesson.title}</span>
                            <div className="opacity-0 group-hover:opacity-100 text-xs text-slate-400">
                                {lesson.is_free_preview ? "Free" : "Paid"}
                            </div>
                        </div>
                    ))}

                    <div className="pt-2">
                        <AddContentModal
                            moduleId={module.id}
                            lessonCount={module.lessons.length}
                            onAdd={onAddLesson}
                            onSuccess={onSelectLesson}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
