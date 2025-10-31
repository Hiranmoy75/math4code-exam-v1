"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit2, Trash2, Eye } from "lucide-react";

export default function ExamRow({
  exam,
  onDelete,
  deleting,
}: {
  exam: any;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{exam.title}</TableCell>
      <TableCell>{exam.duration_minutes} min</TableCell>
      <TableCell>{exam.total_marks}</TableCell>
      <TableCell>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            exam.status === "published"
              ? "bg-green-100 text-green-800"
              : exam.status === "draft"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {exam.status ?? "draft"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/exams/${exam.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>

          <Link href={`/admin/exams/${exam.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit2 className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
