"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMyTestSeries } from "@/hooks/useMyTestSeries"
import {
  BookOpen,
  Calendar,
  PlayCircle,
  Clock,
  Grid,
  List,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MyTestSeries() {
  const { data: seriesData = [], isLoading, isFetching, refetch } = useMyTestSeries()
  const [activeTab, setActiveTab] = useState("all")
  const [viewType, setViewType] = useState<"grid" | "list">("grid")

  const filteredSeries =
    activeTab === "all"
      ? seriesData
      : seriesData.filter((s) =>
          activeTab === "ongoing"
            ? s.status === "Ongoing"
            : s.status === "Completed"
        )

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  }

 // ✅ Skeleton Component
  const SkeletonCard = () => (
    <div className="rounded-3xl p-6 bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-lg animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      </div>
      <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
      <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
      <div className="flex justify-between items-center">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    </div>
  )

  const SkeletonHeader = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="flex gap-3 mt-3">
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
    </div>
  )

  // ✅ Loading Skeleton View
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen">
        <SkeletonHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen transition-colors duration-700 overflow-x-hidden">
      {/* Header */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
              My Test Series
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track your enrolled series, progress & upcoming tests.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Tabs & Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="w-full overflow-x-auto no-scrollbar">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="w-max min-w-full sm:min-w-0 flex-nowrap bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full flex-wrap">
  <Button
    variant="outline"
    size="sm"
    onClick={() =>
      setViewType(viewType === "grid" ? "list" : "grid")
    }
    className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 flex-shrink-0"
  >
    {viewType === "grid" ? (
      <List className="w-4 h-4" />
    ) : (
      <Grid className="w-4 h-4" />
    )}
    <span className="ml-2 hidden xs:inline">
      {viewType === "grid" ? "List" : "Grid"}
    </span>
  </Button>

  <Link href="/student/test-series">
    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-md flex-shrink-0">
      + Buy New
    </Button>
  </Link>
</div>

        </div>
      </motion.div>

      {/* Cards */}
      {filteredSeries.length > 0 ? (
        <div
          className={
            viewType === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          <AnimatePresence>
            {filteredSeries.map((series, idx) => (
              <motion.div
                key={series.id}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                custom={idx}
                whileHover={{ scale: 1.02 }}
                className={`rounded-3xl ${
                  viewType === "grid"
                    ? "p-6"
                    : "p-4 sm:p-6 flex flex-col sm:flex-row justify-between"
                } bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg shadow-lg border border-slate-100 dark:border-slate-700 transition-all`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                      {series.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        series.status === "Completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300"
                          : "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300"
                      }`}
                    >
                      {series.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {series.description || "All Subjects"}
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>
                        {series.testsGiven}/{series.totalTests} Tests
                      </span>
                      <span>{series.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${series.progress}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-2 rounded-full bg-gradient-to-r bg-gradient-to-r from-green-500 to-emerald-600`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-500" />
                      <span>
                        Next Test:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {series.nextTest}
                        </strong>
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>
                        {series.progress < 100 ? "Active" : "Finished"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-0 flex sm:flex-col justify-between sm:justify-center gap-3 sm:gap-2 sm:ml-6">
                  <Link href={`/student/my-series/${series.id}`}>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm shadow-md w-full sm:w-auto">
                      <PlayCircle className="w-4 h-4" />
                      {series.progress < 100 ? "Start" : "Review"}
                    </Button>
                  </Link>

                  <Link href={`/student/test-series/${series.id}`}>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-sm border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 w-full sm:w-auto"
                    >
                      <BookOpen className="w-4 h-4" />
                      View
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400">
          <p className="text-lg mb-3">
            You haven’t enrolled in any test series yet.
          </p>
          <Link href="/student/test-series">
            <Button className="bg-gradient-to-r from-green-500 to-purple-500 text-white font-semibold shadow-md">
              Browse Available Series
            </Button>
          </Link>
        </div>
      )}

      {seriesData.length > 0 && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={seriesData.length + 1}
          className="rounded-3xl mt-10 bg-gradient-to-br from-green-500 to-purple-600 text-white p-6 text-center shadow-xl"
        >
          <h4 className="text-lg font-semibold">
            Keep it up! <CheckCircle2 className="inline-block w-5 h-5 ml-1" />
          </h4>
          <p className="text-sm opacity-90 mt-1">
            You’re improving steadily — finish your series and earn new
            achievements!
          </p>
        </motion.div>
      )}
    </div>
  )
}
