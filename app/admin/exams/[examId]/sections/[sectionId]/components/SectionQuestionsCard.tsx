"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  FileQuestion,
  Award,
  Hash
} from "lucide-react";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  questions: any[];
  isLoading: boolean;
  onRemoveQuestion: (id: string) => void;
  onAddFromBank: () => void;
  onReorder?: (questions: any[]) => void;
}

interface SortableQuestionProps {
  question: any;
  index: number;
  onRemove: (id: string) => void;
}

function SortableQuestion({ question, index, onRemove }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getQuestionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      mcq: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      numerical: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      subjective: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[type?.toLowerCase()] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group relative">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
            <GripVertical className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Question Card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  {index + 1}
                </div>
                <Badge className={getQuestionTypeColor(question.question_type)}>
                  {question.question_type?.toUpperCase() || "QUESTION"}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">{question.marks} marks</span>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                {question.question_text || "No question text"}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(question.id)}
              className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SectionQuestionsCard({
  questions,
  isLoading,
  onRemoveQuestion,
  onAddFromBank,
  onReorder
}: Props) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onReorder) {
      return;
    }

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const newQuestions = arrayMove(questions, oldIndex, newIndex);
    onReorder(newQuestions);
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-xl bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            Loading Questions...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="w-6 h-6 text-indigo-600" />
              Section Questions
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
              {questions.length > 0 ? (
                <span className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    {questions.length} {questions.length === 1 ? "question" : "questions"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {totalMarks} total marks
                  </span>
                </span>
              ) : (
                "No questions added yet. Drag to reorder."
              )}
            </CardDescription>
          </div>
          <Button
            onClick={onAddFromBank}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add from Bank
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {questions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No questions yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Click "Add from Bank" to add questions to this section
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 pl-12">
                {questions.map((question, index) => (
                  <SortableQuestion
                    key={question.id}
                    question={question}
                    index={index}
                    onRemove={onRemoveQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
