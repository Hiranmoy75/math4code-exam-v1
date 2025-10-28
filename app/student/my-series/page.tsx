'use client'
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  BookOpen,
  Calendar,
  PlayCircle,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MyTestSeries() {
  const [loading, setLoading] = useState(true)
  const [seriesData, setSeriesData] = useState<any[]>([])
  const supabase = createClient()

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6 },
    }),
  }

  useEffect(() => {
    async function fetchMySeries() {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("user",user)

      if (!user) {
        setSeriesData([])
        setLoading(false)
        return
      }

      // Get student's enrolled series
      const { data: enrollments } = await supabase
        .from("test_series_enrollments")
        .select("test_series_id, progress, completed_exams, total_exams, next_exam_date")
        .eq("student_id", user.id)

        console.log("enrollments", enrollments)

      const enrolledIds = enrollments?.map((e) => e.test_series_id) || []

      // Get test series infoa
      const { data: testSeries } = await supabase
        .from("test_series")
        .select("*")
        .in("id", enrolledIds)


      // Merge progress info
      const merged = testSeries?.map((series) => {
        const enrollment = enrollments?.find(
          (e) => e.test_series_id === series.id
        )
        const progress =
          enrollment?.progress ||
          Math.round(
            ((enrollment?.completed_exams || 0) /
              (enrollment?.total_exams || 1)) *
              100
          )

        return {
          ...series,
          progress,
          testsGiven: enrollment?.completed_exams || 0,
          totalTests: enrollment?.total_exams || series.total_exams || 0,
          nextTest: enrollment?.next_exam_date || "Upcoming",
          status: progress >= 100 ? "Completed" : "Ongoing",
          color:
            progress >= 100
              ? "from-green-500 to-emerald-500"
              : "from-indigo-500 to-purple-500",
        }
      })

      setSeriesData(merged || [])
      setLoading(false)
    }

    fetchMySeries()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-500 dark:text-slate-300">
        Loading your test series...
      </div>
    )
  }
console.log("seriesData",seriesData)
  return (
    <div className="p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen transition-colors duration-700">
      {/* Page Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={0}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            My Test Series
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View your enrolled test series, progress, and upcoming exams.
          </p>
        </div>
        <Link href="/student/test-series">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md"
          >
            + Buy New Test Series
          </motion.button>
        </Link>
      </motion.div>

      {/* Cards */}
      {seriesData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {seriesData.map((series, idx) => (
            <motion.div
              key={series.id}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={idx + 1}
              whileHover={{ scale: 1.02 }}
              className="rounded-3xl p-6 bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-all"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white leading-tight">
                    {series.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      series.status === "Completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300"
                    }`}
                  >
                    {series.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {series.subject || "All Subjects"}
                </p>
              </div>

              {/* Progress */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>
                    Progress: {series.testsGiven}/{series.totalTests}
                  </span>
                  <span>{series.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${series.progress}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-2 rounded-full bg-gradient-to-r ${series.color}`}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="mt-4 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>
                    Next Test:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {series.nextTest}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>
                    {series.progress < 100 ? "Active" : "Finished"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex justify-between items-center">
                <Link href={`/student/my-series/${series.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {series.progress < 100 ? "Start Test" : "Review Results"}
                  </motion.button>
                </Link>

                <Link href={`/student/test-series/${series.id}`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <BookOpen className="w-4 h-4" /> View Details
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-lg mb-2">You haven’t enrolled in any test series yet.</p>
          <Link href="/student/test-series">
            <Button>Browse Available Series</Button>
          </Link>
        </div>
      )}

      {/* Footer motivational banner */}
      {seriesData.length > 0 && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={seriesData.length + 1}
          className="rounded-3xl mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 text-center shadow-xl"
        >
          <h4 className="text-lg font-semibold">Keep it up! 🚀</h4>
          <p className="text-sm opacity-90 mt-1">
            You’re consistently improving. Complete your series and unlock new badges!
          </p>
        </motion.div>
      )}
    </div>
  )
}
