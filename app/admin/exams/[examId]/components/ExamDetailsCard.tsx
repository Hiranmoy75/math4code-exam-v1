"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  Award,
  TrendingDown,
  Edit3,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  rows?: number;
  step?: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function ExamDetailsCard() {
  const params = useParams();
  const examId = params.examId as string;

  const [exam, setExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    total_marks: "",
    negative_marking: "",
  });

  const loadExamData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: examData, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (!error && examData) {
      setExam(examData);
      setEditData({
        title: examData.title,
        description: examData.description || "",
        duration_minutes: examData.duration_minutes.toString(),
        total_marks: examData.total_marks.toString(),
        negative_marking: examData.negative_marking.toString(),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadExamData();
  }, [examId]);


  const handleUpdateExam = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("exams")
        .update({
          title: editData.title,
          description: editData.description,
          duration_minutes: Number(editData.duration_minutes),
          total_marks: Number(editData.total_marks),
          negative_marking: Number(editData.negative_marking),
        })
        .eq("id", examId);

      if (updateError) throw updateError;

      setEditMode(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadExamData();
    } catch (err: any) {
      setError(err.message || "Failed to update exam");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishExam = async () => {
    try {
      setIsPublishing(true);
      setError(null);
      setShowPublishConfirm(false);

      const supabase = createClient();

      // Update exam status to published
      const { error: updateError } = await supabase
        .from("exams")
        .update({ status: "published" })
        .eq("id", examId);

      if (updateError) throw updateError;

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadExamData();
    } catch (err: any) {
      setError(err.message || "Failed to publish exam");
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      draft: { variant: "secondary", label: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
      published: { variant: "default", label: "Published", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      archived: { variant: "outline", label: "Archived", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    };
    const config = variants[status] || variants.draft;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (isLoading) return null;

  return (
    <>
      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Exam updated successfully!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-none shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6" />
                <CardTitle className="text-2xl font-bold text-white">
                  {exam?.title || "Exam Details"}
                </CardTitle>
                {exam?.status && getStatusBadge(exam.status)}
              </div>
              <CardDescription className="text-indigo-100">
                {editMode ? "Edit exam information below" : "View and manage exam configuration"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <Button
                    onClick={handleUpdateExam}
                    disabled={isSaving}
                    className="bg-white text-indigo-600 hover:bg-indigo-50"
                  >
                    {isSaving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setError(null);
                    }}
                    disabled={isSaving}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setEditMode(true)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {exam?.status === "draft" && (
                    <Button
                      onClick={handlePublishExam}
                      disabled={isPublishing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isPublishing ? (
                        <>Publishing...</>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {editMode ? (
            <div className="space-y-6">
              <FormField
                label="Exam Title"
                value={editData.title}
                onChange={(v) => setEditData({ ...editData, title: v })}
                icon={<FileText className="w-5 h-5 text-slate-400" />}
                description="The main title of your exam"
              />
              <FormField
                label="Description"
                value={editData.description}
                onChange={(v) => setEditData({ ...editData, description: v })}
                textarea
                rows={3}
                description="Optional: Provide additional context about the exam"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Duration (minutes)"
                  value={editData.duration_minutes}
                  onChange={(v) => setEditData({ ...editData, duration_minutes: v })}
                  type="number"
                  icon={<Clock className="w-5 h-5 text-slate-400" />}
                />
                <FormField
                  label="Total Marks"
                  value={editData.total_marks}
                  onChange={(v) => setEditData({ ...editData, total_marks: v })}
                  type="number"
                  icon={<Award className="w-5 h-5 text-slate-400" />}
                />
              </div>
              <FormField
                label="Negative Marking"
                value={editData.negative_marking}
                onChange={(v) => setEditData({ ...editData, negative_marking: v })}
                type="number"
                step="0.25"
                icon={<TrendingDown className="w-5 h-5 text-slate-400" />}
                description="Marks deducted per incorrect answer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoItem
                icon={<FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                label="Title"
                value={exam.title}
              />
              <InfoItem
                icon={<Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                label="Duration"
                value={`${exam.duration_minutes} minutes`}
              />
              <InfoItem
                icon={<Award className="w-5 h-5 text-green-600 dark:text-green-400" />}
                label="Total Marks"
                value={exam.total_marks}
              />
              <InfoItem
                icon={<TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                label="Negative Marking"
                value={exam.negative_marking}
              />
              {exam.description && (
                <div className="md:col-span-2">
                  <InfoItem
                    icon={<FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                    label="Description"
                    value={exam.description}
                  />
                </div>
              )}
              {exam.created_at && (
                <InfoItem
                  icon={<Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  label="Created"
                  value={formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  rows,
  step,
  icon,
  description,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      <div className="relative">
        {icon && !textarea && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        {textarea ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="resize-none border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            step={step}
            className={`border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500 ${icon ? "pl-10" : ""
              }`}
          />
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  );
}
