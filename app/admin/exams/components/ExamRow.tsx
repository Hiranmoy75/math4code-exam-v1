"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit2, Trash2, Eye, Clock, Award, Calendar, ArrowRight, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ExamRow({
  exam,
  onDelete,
  deleting,
}: {
  exam: any;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      archived: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:shadow-lg transition-all duration-300">
      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                {exam.title}
              </h3>
              {exam.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                  {exam.description}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(exam.status || "draft")}>
              {(exam.status || "draft").charAt(0).toUpperCase() + (exam.status || "draft").slice(1)}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {exam.duration_minutes} min
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {exam.total_marks} marks
              </span>
            </div>
            {exam.created_at && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDistanceToNow(new Date(exam.created_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            disabled={deleting}
            className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Link href={`/admin/exams/${exam.id}/results`}>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Results
            </Button>
          </Link>
          <Link href={`/admin/exams/${exam.id}`}>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Manage
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
