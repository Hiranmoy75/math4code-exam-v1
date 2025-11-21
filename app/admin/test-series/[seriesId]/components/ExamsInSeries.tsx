"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Clock, FileText, Loader2, Search, GripVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSeriesExams, useAvailableExams, useSeriesMutations } from "../hooks/useSeriesData";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function ExamsInSeries({ seriesId }: { seriesId: string }) {
  const { data: seriesExams, isLoading: examsLoading } = useSeriesExams(seriesId);
  const { data: availableExams, isLoading: availableLoading } = useAvailableExams(seriesId);
  const { addExam, removeExam, reorderExams } = useSeriesMutations(seriesId);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (seriesExams) {
      setItems(seriesExams);
    }
  }, [seriesExams]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Prepare data for server update
        const reorderedData = newItems.map((item, index) => ({
          id: item.id,
          exam_id: item.exam_id,
          exam_order: index + 1,
        }));

        // Call mutation to update order in DB
        // We do this here to ensure we have the latest items state
        reorderExams.mutate(reorderedData);

        return newItems;
      });
    }
  };

  const filteredAvailableExams = availableExams?.filter((exam: any) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddExam = (examId: string) => {
    addExam.mutate({ examId, order: (items?.length || 0) + 1 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Exams in Series */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Exams in Series
            </CardTitle>
            <CardDescription>
              Manage and reorder the exams included in this test series.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : items && items.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {items.map((se: any, index: number) => (
                      <SortableExamItem
                        key={se.id}
                        id={se.id}
                        index={index}
                        exam={se.exams}
                        onRemove={() => removeExam.mutate(se.exams.id)}
                        isRemoving={removeExam.isPending}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500">No exams added yet.</p>
                <p className="text-sm text-slate-400 mt-1">
                  Select exams from the list to add them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Available Exams */}
      <div className="space-y-6">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Add Exams</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search exams..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {availableLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : filteredAvailableExams && filteredAvailableExams.length > 0 ? (
                <div className="space-y-2">
                  {filteredAvailableExams.map((exam: any) => (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm truncate" title={exam.title}>
                          {exam.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {exam.duration_minutes}m
                          </span>
                          <span>•</span>
                          <span>{exam.total_marks} marks</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                        onClick={() => handleAddExam(exam.id)}
                        disabled={addExam.isPending}
                      >
                        {addExam.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 py-8">
                  No available exams found.
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SortableExamItem({
  id,
  index,
  exam,
  onRemove,
  isRemoving,
}: {
  id: string;
  index: number;
  exam: any;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        className={`flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all ${isDragging ? "shadow-xl ring-2 ring-indigo-500 ring-opacity-50" : ""
          }`}
      >
        <div className="flex items-center gap-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <GripVertical className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {exam.title}
            </h4>
            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
              <Badge variant="secondary" className="text-xs font-normal">
                {exam.duration_minutes} mins
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {exam.total_marks} marks
              </Badge>
            </div>
          </div>
        </div>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Exam?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove "{exam.title}" from this series?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onRemove();
                  setIsOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
