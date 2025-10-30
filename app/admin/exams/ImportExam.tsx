"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { importExamToSupabase, parseExamWord } from "@/lib/import/examWord";
import { importExamLatex, parseExamLatex } from "@/lib/import/examLatex";
import { motion, AnimatePresence } from "framer-motion";
import { renderWithLatex } from "@/lib/renderWithLatex";



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

  // preview state
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
      let inserted = 0;

      const simulateProgress = setInterval(() => {
        setProgress((p) => Math.min(90, p + 5));
      }, 400);

      if (fileKind === "word") {
        const result = await importExamToSupabase(fileForImport, adminId);
        inserted = total;
        clearInterval(simulateProgress);
        setProgress(100);
        alert(`✅ Imported Word exam: ${result.title}`);
      } else {
        const result = await importExamLatex(fileForImport, adminId);
        inserted = total;
        clearInterval(simulateProgress);
        setProgress(100);
        alert(`✅ Imported LaTeX exam: ${result.title}`);
      }

      setTimeout(() => {
        setShowPreview(false);
        setPreview(null);
        setFileForImport(null);
        setFileKind(null);
        setProgress(0);
      }, 800);
    } catch (e: any) {
      console.error(e);
      alert("❌ Import failed: " + (e?.message ?? "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg text-white space-y-4">
      <p className="text-xl font-bold">📥 Import Exam</p>
      <p className="text-sm opacity-90">Upload a Word (.docx) or LaTeX (.tex) file to preview and import exams.</p>

      <input
        type="file"
        accept=".docx,.tex"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleChooseFile(f);
        }}
        disabled={loading}
        className="block w-full text-sm text-gray-100 
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-emerald-700 file:text-white
                   hover:file:bg-emerald-800"
      />

      {parseError && (
        <p className="text-sm text-red-200">⚠️ {parseError}</p>
      )}
      {loading && <p className="text-sm">⏳ Processing…</p>}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-4xl rounded-2xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {preview.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {preview.description}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Duration: {preview.duration_minutes}m</span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Marks: {preview.total_marks}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Status: {preview.status}</span>
                    <span>Q: {totalQuestions}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  ✕
                </button>
              </div>

              {/* Sections */}
              {/* Sections */}
<div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
  {preview.sections.map((sec, idx) => {
    const secTotal = sec.questions.reduce((s, q) => s + (q.marks || 0), 0);
    return (
      <div key={idx} className="border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-emerald-700 dark:text-emerald-300">
            {sec.section_order}. {sec.title}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300 space-x-2">
            <span>Q: {sec.questions.length}</span>
            <span>Marks: {secTotal}</span>
          </div>
        </div>
        <ul className="mt-3 space-y-3 text-sm">
          {sec.questions.slice(0, 3).map((q, qi) => (
            <li key={qi} className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                  {q.question_type}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Marks: {q.marks} • Neg: {q.negative_marks} • {q.difficulty}
                </span>
              </div>
              {/* Question text */}
              <div className="mb-2">
  {renderWithLatex(q.question_text)}
</div>


              {/* Options */}
              {q.question_type !== "NAT" && q.options?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((op, oi) => (
                    <div
                      key={oi}
                      className={`flex items-center gap-2 p-2 rounded-md border ${
                        op.is_correct
                          ? "bg-green-50 border-green-400"
                          : "bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <span className="font-semibold">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      <span className="flex-1">{renderWithLatex(op.text)}</span>
                      {op.is_correct && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-600 text-white flex items-center gap-1">
                          ✅ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* NAT Answer */}
              {q.question_type === "NAT" && q.correct_answer && (
                <div className="mt-2">
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    Answer: {q.correct_answer}
                  </span>
                </div>
              )}

              {/* Explanation */}
              {q.explanation && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                  {q.explanation}
                </div>
              )}
            </li>
          ))}
          {sec.questions.length > 3 && (
            <li className="text-xs text-gray-400">+ {sec.questions.length - 3} more…</li>
          )}
        </ul>
      </div>
    );
  })}
</div>


              {/* Progress bar during import */}
              {loading && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 rounded-md border text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md hover:opacity-90 text-sm"
                  disabled={loading || !adminId}
                >
                  {loading ? "Importing…" : "Confirm & Import"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
