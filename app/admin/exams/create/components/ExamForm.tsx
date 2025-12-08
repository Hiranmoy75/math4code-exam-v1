"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExams } from "@/hooks/useExams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  Award,
  TrendingDown,
  AlertCircle,
  Loader2,
  Save,
  X
} from "lucide-react";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  rows?: number;
  step?: string;
  required?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export default function ExamForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [totalMarks, setTotalMarks] = useState("300");
  const [negativeMarking, setNegativeMarking] = useState("0");
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [_, setIsLoadingLegacy] = useState(false); // Kept for now if other logic uses it, but logic moved to hook
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { createExam, isCreating } = useExams();

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createExam({
        title,
        description,
        duration_minutes: Number.parseInt(durationMinutes),
        total_marks: Number.parseInt(totalMarks),
        status: "draft",
      });
      // createExam hook handles success toast/redirect
    } catch (err: unknown) {
      // createExam hook handles persistent error toast, but we set local error state for UI feedback too if needed
      // Note: useExams onError toast handles the user notification.
      // We can just log it or rely on the hook.
      setError(err instanceof Error ? err.message : "Failed to create exam");
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-800">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700">
        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Exam Configuration
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Enter the basic information and settings for your exam
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleCreateExam} className="space-y-6">
          {/* Title Field */}
          <FormField
            label="Exam Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g., IIT JEE Main 2024 - Mock Test 1"
            required
            icon={<FileText className="w-5 h-5 text-slate-400" />}
            description="Give your exam a clear, descriptive title"
          />

          {/* Description Field */}
          <FormField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Provide details about the exam, topics covered, difficulty level, etc."
            textarea
            rows={4}
            description="Optional: Add context to help students prepare"
          />

          {/* Grid for Duration and Marks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Duration (minutes)"
              value={durationMinutes}
              onChange={setDurationMinutes}
              type="number"
              required
              icon={<Clock className="w-5 h-5 text-slate-400" />}
              description="Total time allowed"
            />
            <FormField
              label="Total Marks"
              value={totalMarks}
              onChange={setTotalMarks}
              type="number"
              required
              icon={<Award className="w-5 h-5 text-slate-400" />}
              description="Maximum possible score"
            />
          </div>



          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Exam...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Exam
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
              className="border-slate-300 dark:border-slate-600"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows,
  step,
  required,
  icon,
  description,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
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
            placeholder={placeholder}
            rows={rows}
            className="resize-none border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
          />
        ) : (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            step={step}
            required={required}
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
