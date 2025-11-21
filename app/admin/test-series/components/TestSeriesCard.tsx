"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit, Trash2, FileText, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { useTransition } from "react";

export default function TestSeriesCard({ series, handleDelete }: any) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-700">
      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {series.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {series.description || "No description provided"}
            </p>
          </div>
          <Badge
            variant={series.status === "published" ? "default" : "secondary"}
            className={series.status === "published" ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"}
          >
            {series.status === "published" ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Published
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Draft
              </div>
            )}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <FileText className="w-4 h-4 text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Exams</span>
              <span className="font-semibold text-sm">{series.total_exams}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <IndianRupee className="w-4 h-4 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Price</span>
              <span className="font-semibold text-sm">
                {series.is_free ? "Free" : `₹${series.price}`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Link href={`/admin/test-series/${series.id}`} className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow group-hover:translate-y-[-1px] transition-all">
              <Edit className="w-4 h-4 mr-2" /> Manage
            </Button>
          </Link>

          <form
            action={(formData) => startTransition(() => handleDelete(formData))}
          >
            <input type="hidden" name="id" value={series.id} />
            <Button
              variant="outline"
              size="icon"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
