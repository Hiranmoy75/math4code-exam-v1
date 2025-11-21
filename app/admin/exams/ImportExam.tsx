"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { importExamToSupabase, parseExamWord } from "@/lib/import/examWord";
import { importExamLatex, parseExamLatex } from "@/lib/import/examLatex";
import { motion, AnimatePresence } from "framer-motion";
import { renderWithLatex } from "@/lib/renderWithLatex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Award,
  FileQuestion,
  Loader2
} from "lucide-react";

type PreviewExam = {
  title: string;
  description?: string | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number;
  status: "draft" | "published" | "archived";
  start_time?: string | null;
  end_time?: string | null;
  sections: {
    title: string;
    section_order: number;
    questions: {
      question_text: string;
      question_type: "MCQ" | "MSQ" | "NAT";
      marks: number;
      negative_marks: number;
      topic?: string | null;
      difficulty?: "easy" | "medium" | "hard";
      options: { text: string; is_correct: boolean }[];
      correct_answer?: string | null;
      explanation?: string | null;
    }[];
  }[];
};

export default function ImportExam() {
  const supabase = createClient();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileForImport, setFileForImport] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<"word" | "latex" | null>(null);
  const [preview, setPreview] = useState<PreviewExam | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminId(user?.id ?? null);
    })();
  }, [supabase]);

  const totalQuestions = useMemo(
    () => preview?.sections.reduce((s, sec) => s + sec.questions.length, 0) ?? 0,
    [preview]
  );

  const handleChooseFile = async (file: File) => {
    setParseError(null);
    setPreview(null);
    setFileForImport(null);
    setFileKind(null);
    if (!file) return;

    setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith(".docx")) {
        const parsed = await parseExamWord(file);
        setPreview(parsed as unknown as PreviewExam);
        setFileForImport(file);
        setFileKind("word");
        setShowPreview(true);
      } else if (file.name.toLowerCase().endsWith(".tex")) {
        const parsed = await parseExamLatex(file);
        setPreview(parsed as unknown as PreviewExam);
        setFileForImport(file);
        setFileKind("latex");
        setShowPreview(true);
      } else {
        setParseError("Unsupported file type. Please upload .docx or .tex");
      }
    } catch (e: any) {
      console.error(e);
      setParseError(e?.message ?? "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!adminId || !fileForImport || !fileKind) return;
    setLoading(true);
    setProgress(10);
    try {
      const total = totalQuestions || 1;

      const simulateProgress = setInterval(() => {
        setProgress((p) => Math.min(90, p + 5));
      }, 400);

      if (fileKind === "word") {
        const result = await importExamToSupabase(fileForImport, adminId);
        clearInterval(simulateProgress);
        setProgress(100);
      } else {
        const result = await importExamLatex(fileForImport, adminId);
        clearInterval(simulateProgress);
        setProgress(100);
      }

      setTimeout(() => {
        setShowPreview(false);
        setPreview(null);
        setFileForImport(null);
        setFileKind(null);
        setProgress(0);
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      console.error(e);
      setParseError("Import failed: " + (e?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="border-none shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-b border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Import Exam
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Upload a Word (.docx) or LaTeX (.tex) file to import exams with questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* File Upload Area */}
            <div className="relative">
              <input
                type="file"
                accept=".docx,.tex"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleChooseFile(f);
                }}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all duration-300 ${loading
                    ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-not-allowed"
                    : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 cursor-pointer"
                  }`}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Processing file...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Supports .docx and .tex files
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Error Message */}
            {parseError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">{parseError}</p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !loading && setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{preview.title}</h2>
                    {preview.description && (
                      <p className="text-emerald-100 text-sm">{preview.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <Badge className="bg-white/20 text-white border-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {preview.duration_minutes} min
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0">
                        <Award className="w-3 h-3 mr-1" />
                        {preview.total_marks} marks
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0">
                        <FileQuestion className="w-3 h-3 mr-1" />
                        {totalQuestions} questions
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0">
                        Status: {preview.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    disabled={loading}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {preview.sections.map((sec, idx) => {
                    const secTotal = sec.questions.reduce((s, q) => s + (q.marks || 0), 0);
                    return (
                      <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50 dark:bg-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {sec.section_order}. {sec.title}
                          </h3>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{sec.questions.length} questions</Badge>
                            <Badge variant="outline">{secTotal} marks</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {sec.questions.slice(0, 3).map((q, qi) => (
                            <div key={qi} className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                  {q.question_type}
                                </Badge>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {q.marks} marks • -{q.negative_marks} • {q.difficulty}
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                {renderWithLatex(q.question_text)}
                              </div>
                              {q.question_type !== "NAT" && q.options?.length > 0 && (
                                <div className="grid grid-cols-1 gap-2">
                                  {q.options.map((op, oi) => (
                                    <div
                                      key={oi}
                                      className={`flex items-center gap-2 p-2 rounded-md text-sm ${op.is_correct
                                          ? "bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800"
                                          : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                        }`}
                                    >
                                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                                        {String.fromCharCode(65 + oi)}.
                                      </span>
                                      <span className="flex-1">{renderWithLatex(op.text)}</span>
                                      {op.is_correct && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {sec.questions.length > 3 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                              + {sec.questions.length - 3} more questions...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
                {loading && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Importing exam...
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={loading || !adminId}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Confirm & Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
