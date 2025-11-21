"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Layers, Clock, Award, Loader2, FileQuestion, GripVertical } from "lucide-react";
import SectionItem from "./SectionItem";
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

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SortableSectionProps {
  section: any;
  examId: string;
  onUpdate: () => void;
  index: number;
}

function SortableSection({ section, examId, onUpdate, index }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

        <SectionItem section={section} examId={examId} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

export default function SectionsCard() {
  const params = useParams();
  const examId = params.examId as string;

  const [sections, setSections] = useState<any[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    duration_minutes: "",
    total_marks: "",
  });

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

  const loadSections = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("exam_id", examId)
      .order("section_order", { ascending: true });
    setSections(data || []);
  };

  useEffect(() => {
    loadSections();
  }, [examId]);

  const handleAddSection = async () => {
    if (!newSection.title || !newSection.duration_minutes || !newSection.total_marks) {
      return;
    }

    setIsAdding(true);
    const supabase = createClient();
    await supabase.from("sections").insert({
      exam_id: examId,
      title: newSection.title,
      duration_minutes: Number(newSection.duration_minutes),
      total_marks: Number(newSection.total_marks),
      section_order: sections.length + 1,
    });
    setNewSection({ title: "", duration_minutes: "", total_marks: "" });
    setShowAddSection(false);
    setIsAdding(false);
    loadSections();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);

    // Update section_order in database
    const supabase = createClient();
    const updates = newSections.map((section, index) => ({
      id: section.id,
      section_order: index + 1,
    }));

    // Update all sections with new order
    for (const update of updates) {
      await supabase
        .from("sections")
        .update({ section_order: update.section_order })
        .eq("id", update.id);
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Exam Sections
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Organize your exam into sections. Drag to reorder.
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddSection(!showAddSection)}
            className={`${showAddSection
                ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
          >
            {showAddSection ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Add Section Form */}
        <AnimatePresence>
          {showAddSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl p-6 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-4">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  New Section
                </h3>
                <FormField
                  label="Section Title"
                  value={newSection.title}
                  onChange={(v) => setNewSection({ ...newSection, title: v })}
                  icon={<FileQuestion className="w-5 h-5 text-slate-400" />}
                  description="e.g., Mathematics, Physics, Chemistry"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Duration (minutes)"
                    value={newSection.duration_minutes}
                    onChange={(v) => setNewSection({ ...newSection, duration_minutes: v })}
                    type="number"
                    icon={<Clock className="w-5 h-5 text-slate-400" />}
                  />
                  <FormField
                    label="Total Marks"
                    value={newSection.total_marks}
                    onChange={(v) => setNewSection({ ...newSection, total_marks: v })}
                    type="number"
                    icon={<Award className="w-5 h-5 text-slate-400" />}
                  />
                </div>
                <Button
                  onClick={handleAddSection}
                  disabled={isAdding || !newSection.title}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Section...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Section
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sections List with Drag and Drop */}
        {sections.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No sections yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Add a section to organize your exam questions
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4 pl-12">
                {sections.map((section, index) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    examId={examId}
                    onUpdate={loadSections}
                    index={index}
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

function FormField({
  label,
  value,
  onChange,
  type = "text",
  icon,
  description,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          className={`border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 ${icon ? "pl-10" : ""
            }`}
        />
      </div>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
