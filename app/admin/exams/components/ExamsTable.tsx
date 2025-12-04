"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExamRow from "./ExamRow";
import EmptyExams from "./EmptyExams";
import useExams from "@/hooks/admin/exams/useExams";
import useDeleteExam from "@/hooks/admin/exams/useDeleteExam";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  AlertCircle,
  Loader2
} from "lucide-react";

export default function ExamsTable() {
  const { data: exams, isLoading, isError, error } = useExams();
  const deleteExamMutation = useDeleteExam();
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleDeleteConfirm = async () => {
    if (!selectedExam) return;
    await deleteExamMutation.mutateAsync(selectedExam.id);
    setSelectedExam(null);
  };

  // Filter exams
  const filteredExams = exams?.filter((exam: any) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: exams?.length || 0,
    draft: exams?.filter((e: any) => e.status === "draft").length || 0,
    published: exams?.filter((e: any) => e.status === "published").length || 0,
    archived: exams?.filter((e: any) => e.status === "archived").length || 0,
  };

  return (
    <>
      <Card className="border-none shadow-xl bg-white dark:bg-slate-800 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Your Exams
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  {exams?.length || 0} {exams?.length === 1 ? "exam" : "exams"} created
                </CardDescription>
              </div>
            </div>

            {/* Search and Filters */}
            {exams && exams.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "draft", "published", "archived"] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className={statusFilter === status ? "bg-indigo-600" : ""}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-white/20 text-current border-0"
                      >
                        {statusCounts[status]}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
        </div>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading exams...</p>
              </div>
            </div>
          ) : isError ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium">Failed to load exams</p>
                <p className="text-sm opacity-90">{(error as any)?.message}</p>
              </div>
            </motion.div>
          ) : !exams || exams.length === 0 ? (
            <EmptyExams />
          ) : filteredExams?.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                No exams match your filters
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredExams?.map((exam: any, index: number) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ExamRow
                      exam={exam}
                      onDelete={() => setSelectedExam(exam)}
                      deleting={
                        deleteExamMutation.isPending &&
                        deleteExamMutation.variables === exam.id
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!selectedExam} onOpenChange={() => setSelectedExam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong>{selectedExam?.title}</strong>? <br />
              This action cannot be undone and all related sections and questions
              will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteExamMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteExamMutation.isPending}
            >
              {deleteExamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
