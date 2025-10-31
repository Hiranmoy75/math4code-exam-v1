"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Pill } from "../ui";
import { Pencil, Trash2, Eye } from "lucide-react";
import type { BankRow } from "../useQuestionQuery";
import { renderWithLatex } from "@/lib/renderWithLatex";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ScrollArea } from "@/components/ui/scroll-area";

const QuestionForm = dynamic(
  () => import("@/components/question-bank/QuestionForm"),
  { ssr: false }
);

const diffColor = (d?: string | null) =>
  d === "easy" ? "mint" : d === "medium" ? "amber" : d === "hard" ? "red" : "gray";

const typeColor = (t?: string | null) =>
  t === "MCQ" ? "violet" : t === "MSQ" ? "pink" : t === "NAT" ? "mint" : "gray";

export const columns = (
  onDelete: (id: string) => Promise<void> | void
): ColumnDef<BankRow>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-[260px] truncate font-medium">
        {renderWithLatex(row.original.title)}
      </div>
    ),
  },
  {
    accessorKey: "question_text",
    header: "Question",
    cell: ({ row }) => (
      <div className="max-w-[520px] truncate text-sm text-slate-700">
        {renderWithLatex(row.original.question_text)}
      </div>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ getValue }) => <Pill color="blue">{(getValue() as string) || "—"}</Pill>,
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty",
    cell: ({ getValue }) => {
      const v = (getValue() as string) || "—";
      return <Pill color={diffColor(v)}>{v === "—" ? v : v.toUpperCase()}</Pill>;
    },
  },
  {
    accessorKey: "question_type",
    header: "Type",
    cell: ({ getValue }) => {
      const v = (getValue() as string) || "—";
      return <Pill color={typeColor(v)}>{v}</Pill>;
    },
  },
  {
    accessorKey: "marks",
    header: "Marks",
    cell: ({ getValue }) => {
      const marks = getValue<number | null>();
      return <div className="font-medium">{marks ?? "—"}</div>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const question = row.original;
      const [viewOpen, setViewOpen] = useState(false);
      const [editOpen, setEditOpen] = useState(false);
      const [deleteConfirm, setDeleteConfirm] = useState(false);
      const [loading, setLoading] = useState(false);

      const handleDelete = async () => {
        try {
          setLoading(true);
          await onDelete(question.id);
          setDeleteConfirm(false);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="flex items-center justify-end gap-2">
          {/* =================== VIEW DIALOG =================== */}
          <Button variant="outline" size="sm" onClick={() => setViewOpen(true)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>

          <AlertDialog open={viewOpen} onOpenChange={setViewOpen}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-semibold">
                  {renderWithLatex(question.title || "Untitled Question")}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <ScrollArea className="mt-4 max-h-[65vh] pr-2">
                    <div className="space-y-4 text-sm text-slate-700">
                      {/* Question */}
                      <div>
                        <strong>Question:</strong>
                        <div className="mt-1">
                          {renderWithLatex(question.question_text)}
                        </div>
                      </div>

                      {/* Options */}
                      {question.question_bank_options?.length ? (
                        <div>
                          <strong>Options:</strong>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            {question.question_bank_options.map((opt: any) => (
                              <li
                                key={opt.id}
                                className={
                                  opt.is_correct
                                    ? "font-semibold text-emerald-600"
                                    : "text-slate-700"
                                }
                              >
                                {renderWithLatex(opt.option_text)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic mt-2">
                          No options available.
                        </p>
                      )}

                      {/* Correct answer (for NAT type or fallback) */}
                      {question.correct_answer && (
                        <p>
                          <strong>Correct Answer:</strong>{" "}
                          <span className="text-emerald-600">
                            {question.correct_answer}
                          </span>
                        </p>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div>
                          <strong>Explanation:</strong>
                          <p className="mt-1 text-slate-600">
                            {renderWithLatex(question.explanation)}
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* =================== EDIT SHEET =================== */}
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-2xl flex flex-col max-h-screen"
            >
              <SheetHeader>
                <SheetTitle>Edit Question</SheetTitle>
              </SheetHeader>

              {/* ✅ Scrollable form */}
              <div className="mt-4 flex-1 overflow-y-auto pr-2">
                <QuestionForm
                  questionId={question.id}
                  onSuccess={() => setEditOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* =================== DELETE DIALOG =================== */}
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:text-red-700"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The question and its options will
                  be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    },
  },
];
