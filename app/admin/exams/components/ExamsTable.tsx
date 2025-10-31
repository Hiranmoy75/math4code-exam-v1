"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function ExamsTable() {
  const { data: exams, isLoading, isError, error } = useExams();
  const deleteExamMutation = useDeleteExam();
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const handleDeleteConfirm = async () => {
    if (!selectedExam) return;
    await deleteExamMutation.mutateAsync(selectedExam.id);
    setSelectedExam(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Exams</CardTitle>
          <CardDescription>All exams created by you</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded" />
              <div className="h-40 bg-white rounded shadow-sm p-4">
                <div className="h-6 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>
          ) : isError ? (
            <div className="text-red-500">
              Failed to load exams: {(error as any)?.message}
            </div>
          ) : !exams || exams.length === 0 ? (
            <EmptyExams />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam: any) => (
                  <ExamRow
                    key={exam.id}
                    exam={exam}
                    onDelete={() => setSelectedExam(exam)}
                    deleting={
                      deleteExamMutation.isPending &&
                      deleteExamMutation.variables === exam.id
                    }
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ✅ Delete Confirmation Dialog */}
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
              {deleteExamMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
