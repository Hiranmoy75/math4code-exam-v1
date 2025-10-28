'use client'

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  BarChart2,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TestSeriesDetails({ params }: { params: { seriesId: string } }) {
  const [loading, setLoading] = useState(true)
  const [seriesInfo, setSeriesInfo] = useState<any>(null)
  const [tests, setTests] = useState<any[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)

  const supabase = createClient()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.5 },
    }),
  }

  useEffect(() => {
    async function fetchSeries() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return setLoading(false)

      // Fetch series info
      const { data: series, error: seriesErr } = await supabase
        .from("test_series")
        .select("*")
        .eq("id", params.seriesId)
        .single()

      if (seriesErr || !series) {
        setSeriesInfo(null)
        setLoading(false)
        return
      }

      // Check enrollment
      const { data: enrollment } = await supabase
        .from("test_series_enrollments")
        .select("*")
        .eq("test_series_id", params.seriesId)
        .eq("student_id", user.id)
        .single()

      setIsEnrolled(!!enrollment)

      // Fetch exams in this series
      const { data: exams } = await supabase
        .from("test_series_exams")
        .select("*, exams(*)")
        .eq("test_series_id", params.seriesId)
        .order("exam_order", { ascending: true })

      // Format exams with status
      const formattedTests =
        exams?.map((item: any, index: number) => {
          const status =
            index === 0
              ? "Ongoing"
              : !isEnrolled
              ? "Locked"
              : index < 2
              ? "Completed"
              : "Locked"

          return {
            id: item.exams.id,
            name: item.exams.title,
            duration: `${item.exams.duration_minutes} mins`,
            marks: item.exams.total_marks,
            status,
            score: status === "Completed" ? Math.floor(Math.random() * item.exams.total_marks) : null,
          }
        }) || []

      setSeriesInfo(series)
      setTests(formattedTests)
      setLoading(false)
    }

    fetchSeries()
  }, [params.seriesId, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh] text-slate-500 dark:text-slate-300">
        Loading test series details...
      </div>
    )
  }

  if (!seriesInfo) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400">
        Test Series not found.
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen transition-colors duration-700">
      {/* Series Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={0}
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

      {/* Test Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tests.map((test, idx) => (
          <motion.div
            key={test.id}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={idx + 1}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-white/70 dark:bg-slate-800/60 shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-all"
          >
            {/* Header */}
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
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  test.status === "Completed"
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
                  Score:{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {test.score}/{test.marks}
                  </span>
                </p>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  ✅ Completed
                </span>
              </div>
            )}

            {/* Locked */}
            {test.status === "Locked" && (
              <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400 gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Unlock after completing previous test</span>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex justify-between items-center">
              {test.status === "Completed" && (
                <Link href={`/student/exam/${test.id}/result`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold shadow-md"
                  >
                    <BarChart2 className="w-4 h-4" />
                    View Result
                  </motion.button>
                </Link>
              )}

              {test.status === "Ongoing" && (
                <Link href={`/student/exam/${test.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold shadow-md"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Test
                  </motion.button>
                </Link>
              )}

              {test.status === "Locked" && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  disabled
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-500 text-sm font-semibold cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" /> Locked
                </motion.button>
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
        custom={tests.length + 1}
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
