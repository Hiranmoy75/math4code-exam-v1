"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import ExamForm from "./components/ExamForm";
import ExamFormSkeleton from "./components/ExamFormSkeleton";
import { FileText, Sparkles } from "lucide-react";

export default function CreateExamPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold">Create New Exam</h1>
          </div>
          <p className="text-indigo-100 text-lg max-w-2xl">
            Design a comprehensive exam with customizable settings. Add sections, questions, and configure grading parameters.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <Sparkles className="absolute top-8 right-8 w-8 h-8 text-white/30" />
      </motion.div>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Suspense fallback={<ExamFormSkeleton />}>
          <ExamForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
