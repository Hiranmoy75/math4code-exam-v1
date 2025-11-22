"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  BarChart2,
  Lock,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { useTestSeriesDetails } from "@/hooks/useTestSeriesDetails"

export default function TestSeriesDetails({
  params,
}: {
  params: Promise<{ seriesId: string }>
}) {
  const { seriesId } = use(params)
  const { data, isLoading, isFetching } = useTestSeriesDetails(seriesId)

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  }

  // 🦴 Skeleton Loader
  const SkeletonCard = () => (
    <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-lg animate-pulse">
      <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-5"></div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
      <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  )

  const SkeletonHeader = () => (
    <div className="rounded-3xl p-6 bg-white/60 dark:bg-slate-800/50 animate-pulse">
      <div className="h-7 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
      <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
      <div className="flex gap-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen">
        <SkeletonHeader />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.seriesInfo) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
        Test Series not found.
      </div>
    )
  }

  const { seriesInfo, tests } = data

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen transition-colors duration-700">
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg p-6 shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
          {seriesInfo.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          {seriesInfo.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-4 h-4" />
            <span>Total Tests: {tests.length}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Completed: {tests.filter((t) => t.status === "Completed").length}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.map((test, idx) => (
          <motion.div
            key={test.id}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={idx}
            className="p-6 rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-lg transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {test.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Duration: {test.duration} • Marks: {test.marks}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${test.status === "Completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300"
                    : test.status === "Ongoing"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400"
                  }`}
              >
                {test.status}
              </span>
            </div>

            {/* Score */}
            {test.status === "Completed" && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  Score:
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {test.score}/{test.marks}
                  </span>
                </p>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  ✅ Completed
                </span>
              </div>
            )}

            {test.status === "Locked" && (
              <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Unlock after completing previous test</span>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-between items-center gap-3">
              {test.status === "Completed" && (
                <>
                  <Link href={`/student/results`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold shadow-md"
                    >
                      <BarChart2 className="w-4 h-4" /> View Result
                    </motion.button>
                  </Link>
                  {test.canReattempt && (
                    <Link href={`/student/exams/${test.id}?retake=true`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold shadow-md"
                      >
                        <RefreshCw className="w-4 h-4" /> Retake Exam
                      </motion.button>
                    </Link>
                  )}
                </>
              )}
              {test.status === "Ongoing" && (
                <Link href={`/student/exams/${test.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold shadow-md"
                  >
                    <PlayCircle className="w-4 h-4" /> Resume Test
                  </motion.button>
                </Link>
              )}
              {test.status === "Not Started" && (
                <Link href={`/student/exams/${test.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold shadow-md"
                  >
                    <PlayCircle className="w-4 h-4" /> Start Test
                  </motion.button>
                </Link>
              )}
              {test.status === "Locked" && (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-500 text-sm font-semibold cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" /> Locked
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Motivation Banner */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="rounded-3xl mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 flex flex-col md:flex-row items-center justify-between shadow-xl"
      >
        <div>
          <h4 className="text-lg font-semibold">Keep Going 💪</h4>
          <p className="text-sm opacity-90">
            Complete your pending tests and climb higher in your ranking.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="mt-4 md:mt-0 px-4 py-2 rounded-lg bg-white text-indigo-600 font-semibold shadow-md"
        >
          View Leaderboard
        </motion.button>
      </motion.div>
    </div>
  )
}
