"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pill } from "../ui"
import { Pencil, Trash2, ArrowUpRight } from "lucide-react"
import type { BankRow } from "../useQuestionQuery"
import { renderWithLatex } from "@/lib/renderWithLatex"

const diffColor = (d?: string | null) =>
  d === "easy" ? "mint" : d === "medium" ? "amber" : d === "hard" ? "red" : "gray"

const typeColor = (t?: string | null) =>
  t === "MCQ" ? "violet" : t === "MSQ" ? "pink" : t === "NAT" ? "mint" : "gray"

export const columns = (onDelete: (id: string) => void): ColumnDef<BankRow>[] => [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div className="max-w-[260px] truncate font-medium">{renderWithLatex(row.original.title)}</div>,
  },
  {
    accessorKey: "question_text",
    header: "Question",
    cell: ({ row }) => <div className="max-w-[520px] truncate text-sm text-slate-700">{renderWithLatex(row.original.question_text)}</div>,
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
      const v = (getValue() as string) || "—"
      return <Pill color={diffColor(v)}>{v === "—" ? v : v.toUpperCase()}</Pill>
    },
  },
  {
    accessorKey: "question_type",
    header: "Type",
    cell: ({ getValue }) => {
      const v = (getValue() as string) || "—"
      return <Pill color={typeColor(v)}>{v}</Pill>
    },
  },
 {
  accessorKey: "marks",
  header: "Marks",
  cell: ({ getValue }) => {
    const marks = getValue<number | null>();  // 👈 tell TS it’s a number (or null)
    return <div className="font-medium">{marks ?? "—"}</div>;
  },
},
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const id = row.original.id
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/question-bank/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          <Link href={`/admin/question-bank/${id}/edit`}>
            <Button size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )
    },
  },
]
