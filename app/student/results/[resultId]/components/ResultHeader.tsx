'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye } from "lucide-react"

type ResultHeaderProps = {
  title: string
  attemptId?: string
}

export function ResultHeader({ title, attemptId }: ResultHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center overflow-hidden justify-between gap-4 bg-gradient-to-r from-indigo-50 via-white to-sky-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 p-6 md:p-8 rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 transition-all">
      
      {/* Left side: Title & Subtitle */}
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Detailed performance analysis
        </p>
      </div>

      {/* Right side: Buttons */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* More View Button */}
        <Link href={`/student/results/attempt/${attemptId}`}>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:shadow-md transition-all"
          >
            <Eye className="w-4 h-4" />
            More View
          </Button>
        </Link>

        {/* Back to Results Button */}
        <Link href="/student/results">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white font-medium px-5 py-2 rounded-xl shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Button>
        </Link>
      </div>
    </div>
  )
}
