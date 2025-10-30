"use client"
import React from "react"

export default function ExamResultSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="w-28 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="w-28 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          <div className="w-24 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>

      {/* Section Blocks */}
      {[...Array(3)].map((_, s) => (
        <div key={s} className="space-y-3">
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3"
            >
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
