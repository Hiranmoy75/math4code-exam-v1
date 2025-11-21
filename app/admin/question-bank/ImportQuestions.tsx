"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { parseExcelQuestions } from "@/lib/import/excel";
import { parseWordQuestions } from "@/lib/import/word";
import { parseLatexQuestions } from "@/lib/import/latex";
import type { ImportedQuestion } from "@/lib/import/types";
import { createClient } from "@/lib/supabase/client";
import { downloadSampleQuestionsFile } from "@/lib/utils/sampleQuestions";

interface ImportQuestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string;
  onSuccess?: () => void;
}

export function ImportQuestionsDialog({
  open,
  onOpenChange,
  adminId,
  onSuccess,
}: ImportQuestionsDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const downloadSampleFile = () => {
    downloadSampleQuestionsFile();
    toast.success("Sample file downloaded!", {
      description: "Open it in Excel to see the format and add your questions",
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      let parsed: ImportedQuestion[] = [];

      // Parse based on file type
      if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        setProgress(20);
        parsed = await parseExcelQuestions(selectedFile);
      } else if (selectedFile.name.endsWith(".docx")) {
        setProgress(20);
        parsed = await parseWordQuestions(selectedFile);
      } else if (selectedFile.name.endsWith(".tex")) {
        setProgress(20);
        parsed = await parseLatexQuestions(selectedFile);
      } else {
        toast.error("Unsupported file format", {
          description: "Please upload .xlsx, .xls, .docx, or .tex files",
        });
        setUploading(false);
        return;
      }

      if (parsed.length === 0) {
        toast.warning("No questions found in file");
        setUploading(false);
        return;
      }

      setProgress(40);

      const supabase = createClient();
      let imported = 0;
      const total = parsed.length;

      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];

        const { data: qb, error } = await supabase
          .from("question_bank")
          .insert({
            admin_id: adminId,
            title: q.title,
            question_text: q.question_text,
            question_type: q.question_type,
            marks: q.marks,
            negative_marks: q.negative_marks,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Error inserting question", error);
          continue;
        }

        if (q.options?.length) {
          const options = q.options.map((opt, idx) => ({
            question_id: qb.id,
            option_text: opt.text,
            option_order: idx + 1,
            is_correct: opt.is_correct ?? false,
          }));
          await supabase.from("question_bank_options").insert(options);
        }

        imported++;
        setProgress(40 + (imported / total) * 60);
      }

      toast.success(`Successfully imported ${imported} questions!`, {
        description: `${imported} out of ${total} questions were added to the question bank`,
      });

      setSelectedFile(null);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import questions", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Upload className="h-6 w-6 text-indigo-600" />
            Import Questions
          </DialogTitle>
          <DialogDescription>
            Upload Excel, Word, or LaTeX files to bulk import questions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Download Sample */}
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Need a template?
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Download our sample file to see the required format
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={downloadSampleFile}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download Sample
            </Button>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
              : "border-slate-300 dark:border-slate-700 hover:border-indigo-400"
              }`}
          >
            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.docx,.tex"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />

            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.label
                  key="empty"
                  htmlFor="file-upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Supports .xlsx, .xls, .docx, .tex files
                  </p>
                </motion.label>
              )}
            </AnimatePresence>
          </div>

          {/* Progress */}
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Importing questions...
                </span>
                <span className="font-medium text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || uploading}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Import Questions
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
