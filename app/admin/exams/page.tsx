"use client";

import { Suspense } from "react";
import ExamsTable from "./components/ExamsTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ExamsTableSkeleton from "./components/ExamsTableSkeleton";
import ImportExam from "./ImportExam";
import { motion } from "framer-motion";
import { Plus, FileText, TrendingUp } from "lucide-react";
import useExams from "@/hooks/admin/exams/useExams";

function ExamsHeader() {
  const { data: exams } = useExams();

  const stats = {
    total: exams?.length || 0,
    published: exams?.filter((e: any) => e.status === "published").length || 0,
    draft: exams?.filter((e: any) => e.status === "draft").length || 0,
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Exams</h1>
              <p className="text-indigo-100 mt-1">
                Create, manage, and track your test series
              </p>
            </div>
          </div>
        </div>

        <Link href="/admin/exams/create">
          <Button
            size="lg"
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Stats Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative mt-6 grid grid-cols-3 gap-4"
      >
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <p className="text-sm text-indigo-100">Total Exams</p>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <p className="text-sm text-indigo-100 mb-1">Published</p>
          <p className="text-2xl font-bold">{stats.published}</p>
        </div>
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <p className="text-sm text-indigo-100 mb-1">Drafts</p>
          <p className="text-2xl font-bold">{stats.draft}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ExamsPage() {
  return (
    <div className="space-y-8 p-2 md:p-1">
      {/* Premium Header */}
      <ExamsHeader />

      {/* Import Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ImportExam />
      </motion.div>

      {/* Exams Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Suspense fallback={<ExamsTableSkeleton />}>
          <ExamsTable />
        </Suspense>
      </motion.div>
    </div>
  );
}
