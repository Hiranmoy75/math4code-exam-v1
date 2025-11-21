"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Clock, Award, ArrowRight, Trash2, Edit3, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function SectionItem({ section, examId, onUpdate }: any) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actualMarks, setActualMarks] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [editData, setEditData] = useState({
    title: section.title,
    duration_minutes: section.duration_minutes.toString(),
    total_marks: section.total_marks.toString(),
  });

  // Fetch actual marks from questions
  useEffect(() => {
    const fetchQuestionStats = async () => {
      const supabase = createClient();
      const { data: questions } = await supabase
        .from("questions")
        .select("marks")
        .eq("section_id", section.id);

      if (questions) {
        const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
        setActualMarks(totalMarks);
        setQuestionCount(questions.length);
      }
    };

    fetchQuestionStats();
  }, [section.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this section? This will also delete all questions in this section.")) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();
    await supabase.from("sections").delete().eq("id", section.id);
    onUpdate?.();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sections")
        .update({
          title: editData.title,
          duration_minutes: Number(editData.duration_minutes),
          total_marks: Number(editData.total_marks),
        })
        .eq("id", section.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
    } catch (err: any) {
      alert(err.message || "Failed to update section");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: section.title,
      duration_minutes: section.duration_minutes.toString(),
      total_marks: section.total_marks.toString(),
    });
    setIsEditing(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:shadow-lg transition-all duration-300">
      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Section Title
              </label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Section title"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={editData.duration_minutes}
                  onChange={(e) => setEditData({ ...editData, duration_minutes: e.target.value })}
                  placeholder="Duration"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Total Marks
                </label>
                <Input
                  type="number"
                  value={editData.total_marks}
                  onChange={(e) => setEditData({ ...editData, total_marks: e.target.value })}
                  placeholder="Marks"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                {section.title}
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {section.duration_minutes} min
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {actualMarks} marks ({questionCount} questions)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => router.push(`/admin/exams/${examId}/sections/${section.id}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Manage Questions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
