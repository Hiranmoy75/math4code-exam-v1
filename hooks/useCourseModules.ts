import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Module, Lesson } from "@/lib/types";
import { toast } from "sonner";

export interface ModuleWithLessons extends Module {
    lessons: Lesson[];
}

export const useCourseModules = (courseId: string, initialData: ModuleWithLessons[]) => {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const queryKey = ["course-modules", courseId];

    // Main Query
    const { data: modules = initialData, isLoading, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            // OPTIMIZED: Use RPC first
            const { data, error } = await supabase
                .rpc('get_course_structure', { target_course_id: courseId });

            if (error) {
                console.warn("RPC fetch failed in useCourseModules, falling back", error);
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from("modules")
                    .select("*, lessons(*)")
                    .eq("course_id", courseId)
                    .order("module_order", { ascending: true });

                if (fallbackError) throw fallbackError;

                // Sort lessons by order
                return fallbackData.map((m: any) => ({
                    ...m,
                    lessons: (m.lessons || []).sort((a: any, b: any) => a.lesson_order - b.lesson_order)
                })) as ModuleWithLessons[];
            }

            // RPC returns fully structured data
            return data as ModuleWithLessons[];
        },
        initialData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Helper to optimistically update cache
    const updateCache = (updater: (old: ModuleWithLessons[]) => ModuleWithLessons[]) => {
        queryClient.setQueryData(queryKey, (old: ModuleWithLessons[] | undefined) => {
            return updater(old || []);
        });
    };

    // --- Module Mutations ---

    const addModuleMutation = useMutation({
        mutationFn: async (title: string) => {
            const currentModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey) || [];
            const newOrder = currentModules.length > 0 ? currentModules[currentModules.length - 1].module_order + 1 : 1;

            const { data, error } = await supabase
                .from("modules")
                .insert({ course_id: courseId, title, module_order: newOrder })
                .select()
                .single();

            if (error) throw error;
            return { ...data, lessons: [] } as ModuleWithLessons;
        },
        onMutate: async (title) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            updateCache((old) => [
                ...old,
                {
                    id: tempId,
                    course_id: courseId,
                    title,
                    module_order: (old.length || 0) + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    lessons: []
                } as unknown as ModuleWithLessons
            ]);

            return { previousModules };
        },
        onError: (err, title, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to add module");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const updateModuleMutation = useMutation({
        mutationFn: async ({ id, title }: { id: string; title: string }) => {
            const { error } = await supabase
                .from("modules")
                .update({ title })
                .eq("id", id);
            if (error) throw error;
            return { id, title };
        },
        onMutate: async ({ id, title }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            updateCache((old) => old.map(m => m.id === id ? { ...m, title } : m));

            return { previousModules };
        },
        onError: (err, vars, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to update module");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteModuleMutation = useMutation({
        mutationFn: async (moduleId: string) => {
            const { error } = await supabase.from("modules").delete().eq("id", moduleId);
            if (error) throw error;
        },
        onMutate: async (moduleId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            updateCache((old) => old.filter(m => m.id !== moduleId));
            toast.success("Chapter deleted"); // Instant feedback

            return { previousModules };
        },
        onError: (err, moduleId, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to delete chapter");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // --- Lesson Mutations ---

    const deleteLessonMutation = useMutation({
        mutationFn: async (lesson: Lesson) => {
            // Background Bunny.net deletion
            if (lesson.video_provider === 'bunny' && lesson.bunny_video_id) {
                // Non-blocking fetch - we catch errors but don't stop the flow
                fetch('/api/bunny/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId: lesson.bunny_video_id })
                }).catch(err => console.error("Background bunny deletion failed", err));
            }

            const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);
            if (error) throw error;
        },
        onMutate: async (lesson) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            // Optimistic Remove
            updateCache((old) => old.map(m => ({
                ...m,
                lessons: m.lessons.filter(l => l.id !== lesson.id)
            })));

            toast.success("Lesson deleted");

            return { previousModules };
        },
        onError: (err, lesson, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to delete lesson");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const addLessonMutation = useMutation({
        mutationFn: async (lessonData: Partial<Lesson>) => {
            const { data, error } = await supabase
                .from("lessons")
                .insert(lessonData)
                .select()
                .single();
            if (error) throw error;
            return data as Lesson;
        },
        onMutate: async (lessonData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            const tempId = `temp-${Date.now()}`;
            const optimisticLesson = {
                ...lessonData,
                id: tempId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_free_preview: false,
                content_text: lessonData.content_type === "text" ? "Upcoming content..." : "",
                content_url: "",
            } as Lesson;

            updateCache((old) => old.map(m => {
                if (m.id === lessonData.module_id) {
                    return {
                        ...m,
                        lessons: [...m.lessons, optimisticLesson]
                    };
                }
                return m;
            }));

            return { previousModules };
        },
        onSuccess: () => {
            // Invalidate to get the real ID
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey });
            }, 100); // Small delay to smoothing transition if needed, or immediate
        },
        onError: (err, newLesson, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to add lesson: " + err.message);
        }
    });

    const updateLessonMutation = useMutation({
        mutationFn: async (lesson: Partial<Lesson> & { id: string }) => {
            const { data, error } = await supabase
                .from("lessons")
                .update(lesson)
                .eq("id", lesson.id)
                .select()
                .single();
            if (error) throw error;
            return data as Lesson;
        },
        onMutate: async (updatedLesson) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            updateCache((old) => old.map(m => ({
                ...m,
                lessons: m.lessons.map(l => l.id === updatedLesson.id ? { ...l, ...updatedLesson } as Lesson : l)
            })));

            return { previousModules };
        },
        onError: (err, vars, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to update lesson");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    // --- Reorder Mutations ---

    const reorderModulesMutation = useMutation({
        mutationFn: async (orderedModules: { id: string; module_order: number }[]) => {
            const updates = orderedModules.map((m) =>
                supabase.from("modules").update({ module_order: m.module_order }).eq("id", m.id)
            );
            await Promise.all(updates);
        },
        onMutate: async (orderedModules) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            updateCache((old) => {
                const orderMap = new Map(orderedModules.map((m) => [m.id, m.module_order]));
                const newModules = [...old].map((m) => ({
                    ...m,
                    module_order: orderMap.get(m.id) ?? m.module_order,
                }));
                return newModules.sort((a, b) => a.module_order - b.module_order);
            });

            return { previousModules };
        },
        onError: (err, _, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to reorder modules");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const reorderLessonsMutation = useMutation({
        mutationFn: async (orderedLessons: { id: string; lesson_order: number; module_id: string }[]) => {
            // Ensure all lessons belong to the correct module just in case
            const updates = orderedLessons.map((l) =>
                supabase.from("lessons").update({ lesson_order: l.lesson_order, module_id: l.module_id }).eq("id", l.id)
            );
            await Promise.all(updates);
        },
        onMutate: async (orderedLessons) => {
            await queryClient.cancelQueries({ queryKey });
            const previousModules = queryClient.getQueryData<ModuleWithLessons[]>(queryKey);

            updateCache((old) => {
                return old.map((m) => {
                    const lessonsUpdateMap = new Map(orderedLessons.filter(l => l.module_id === m.id).map(l => [l.id, l.lesson_order]));

                    const newLessons = m.lessons.map(l => {
                        const newOrder = orderedLessons.find(ol => ol.id === l.id);
                        if (newOrder) {
                            return { ...l, lesson_order: newOrder.lesson_order, module_id: newOrder.module_id };
                        }
                        return l;
                    });

                    if (lessonsUpdateMap.size > 0) {
                        return {
                            ...m,
                            lessons: newLessons.sort((a, b) => a.lesson_order - b.lesson_order)
                        };
                    }
                    return m;
                });
            });

            return { previousModules };
        },
        onError: (err, _, context) => {
            if (context?.previousModules) {
                queryClient.setQueryData(queryKey, context.previousModules);
            }
            toast.error("Failed to reorder lessons");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return {
        modules,
        isLoading,
        refetch,
        addModule: addModuleMutation.mutateAsync,
        isAddingModule: addModuleMutation.isPending,
        updateModule: updateModuleMutation.mutateAsync,
        deleteModule: deleteModuleMutation.mutateAsync,
        addLesson: addLessonMutation.mutateAsync,
        isAddingLesson: addLessonMutation.isPending,
        updateLesson: updateLessonMutation.mutateAsync,
        reorderModules: reorderModulesMutation.mutateAsync,
        reorderLessons: reorderLessonsMutation.mutateAsync,
        deleteLesson: deleteLessonMutation.mutateAsync,
    };
};
