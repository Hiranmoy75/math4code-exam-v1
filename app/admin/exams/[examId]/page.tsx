"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import ExamDetailsCard from "./components/ExamDetailsCard";
import SectionsCard from "./components/SectionsCard";
import ExamDetailsSkeleton from "./components/ExamDetailsSkeleton";
import SectionsSkeleton from "./components/SectionsSkeleton";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export default function EditExamPageWrapper() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
      >
        <Link href="/admin/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/admin/exams" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Exams
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 dark:text-white font-medium">Edit Exam</span>
      </motion.div>

      {/* Exam Details Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Suspense fallback={<ExamDetailsSkeleton />}>
          <ExamDetailsCard />
        </Suspense>
      </motion.div>

      {/* Sections Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Suspense fallback={<SectionsSkeleton />}>
          <SectionsCard />
        </Suspense>
      </motion.div>
    </div>
  );
}
