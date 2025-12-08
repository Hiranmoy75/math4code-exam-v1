"use client";

import { useState, useEffect } from "react";
import { ModuleWithLessons } from "@/hooks/useCourseModules";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ChevronDown, ChevronRight, Edit, Trash, Video, FileText, File, HelpCircle,
    GripVertical
} from "lucide-react";
import { AddContentModal } from "./AddContentModal";
import { cn } from "@/lib/utils";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    reorderModules: (items: { id: string, module_order: number }[]) => Promise<void>;
    reorderLessons: (items: { id: string, lesson_order: number, module_id: string }[]) => Promise<void>;
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
    addLesson,
    reorderModules,
    reorderLessons
}: ModuleListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="space-y-4">
                {modules.map((module) => (
                    <div key={module.id} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#161b22] opacity-50">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{module.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;
        if (active.id === over.id) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Reordering Modules
        if (activeData?.type === 'module') {
            if (overData?.type !== 'module') return;

            const oldIndex = modules.findIndex((m) => m.id === active.id);
            const newIndex = modules.findIndex((m) => m.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newModules = arrayMove(modules, oldIndex, newIndex);
                // Update Order
                const updates = newModules.map((m, index) => ({
                    id: m.id,
                    module_order: index + 1
                }));
                reorderModules(updates);
            }
        }

        // Reordering Lessons
        if (activeData?.type === 'lesson') {
            if (overData?.type !== 'lesson') return;

            const moduleId = activeData.moduleId;
            const overModuleId = overData.moduleId;

            // Only allow reorder within same module for now
            if (moduleId === overModuleId) {
                const module = modules.find(m => m.id === moduleId);
                if (module) {
                    const oldIndex = module.lessons.findIndex(l => l.id === active.id);
                    const newIndex = module.lessons.findIndex(l => l.id === over.id);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
                        const updates = newLessons.map((l, index) => ({
                            id: l.id,
                            lesson_order: index + 1,
                            module_id: moduleId
                        }));
                        reorderLessons(updates);
                    }
                }
            }
        }
    };

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
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={modules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {modules.map((module) => (
                        <SortableModuleItem
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
            </SortableContext>
        </DndContext>
    );
}

interface SortableModuleItemProps {
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

function SortableModuleItem({
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
}: SortableModuleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: module.id,
        data: {
            type: 'module'
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : "auto",
        position: isDragging ? "relative" as "relative" : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-[#161b22]">
            <div
                className="p-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2 flex-1">
                    {/* Drag Handle */}
                    <button className="cursor-grab touch-none p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" {...attributes} {...listeners}>
                        <GripVertical className="h-4 w-4" />
                    </button>

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
                    <SortableContext
                        items={module.lessons.map(l => l.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {module.lessons.map((lesson) => (
                                <SortableLessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    isSelected={selectedLessonId === lesson.id}
                                    onSelect={(l) => onSelectLesson(l)}
                                />
                            ))}
                        </div>
                    </SortableContext>

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

function SortableLessonItem({ lesson, isSelected, onSelect }: { lesson: Lesson, isSelected: boolean, onSelect: (l: Lesson) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: lesson.id,
        data: {
            type: 'lesson',
            moduleId: lesson.module_id
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : "auto",
        position: isDragging ? "relative" as "relative" : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => onSelect(lesson)}
            className={cn(
                "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors group",
                isSelected
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            )}
        >
            <button className="cursor-grab touch-none p-1 text-slate-300 hover:text-slate-500" {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}>
                <GripVertical className="h-3 w-3" />
            </button>

            {lesson.content_type === "video" && <Video className="h-4 w-4 shrink-0" />}
            {lesson.content_type === "text" && <FileText className="h-4 w-4 shrink-0" />}
            {lesson.content_type === "pdf" && <File className="h-4 w-4 shrink-0" />}
            {lesson.content_type === "quiz" && <HelpCircle className="h-4 w-4 shrink-0" />}
            <span className="text-sm truncate flex-1">{lesson.title}</span>
            <div className="opacity-0 group-hover:opacity-100 text-xs text-slate-400">
                {lesson.is_free_preview ? "Free" : "Paid"}
            </div>
        </div>
    );
}
