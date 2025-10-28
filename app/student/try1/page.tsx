'use client'
import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  PlayCircle,
  CheckCircle2,
  Clock,
  Star,
} from "lucide-react";

export default function MyTestSeries() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6 },
    }),
  };

  const testSeries = [
    {
      id: 1,
      title: "JEE Advanced 2025 Test Series",
      subject: "Physics • Chemistry • Math",
      progress: 80,
      testsGiven: 10,
      totalTests: 12,
      nextTest: "5 Nov 2025",
      status: "Ongoing",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: 2,
      title: "CBSE Board Mathematics Booster",
      subject: "Class 12 Math",
      progress: 45,
      testsGiven: 5,
      totalTests: 12,
      nextTest: "8 Nov 2025",
      status: "Ongoing",
      color: "from-blue-500 to-sky-500",
    },
    {
      id: 3,
      title: "Aptitude + Logical Reasoning Series",
      subject: "Competitive Exams",
      progress: 100,
      testsGiven: 15,
      totalTests: 15,
      nextTest: "Completed",
      status: "Completed",
      color: "from-green-500 to-emerald-500",
    },
  ];

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
            View your purchased test series, progress, and upcoming exams.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-md"
        >
          + Buy New Test Series
        </motion.button>
      </motion.div>

      {/* Test Series Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {testSeries.map((series, idx) => (
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
                {series.subject}
              </p>
            </div>

            {/* Progress Bar */}
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

            {/* Info Row */}
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
                <span>{series.progress < 100 ? "Active" : "Finished"}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-between items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold shadow-md"
              >
                <PlayCircle className="w-4 h-4" />
                {series.progress < 100 ? "Start Test" : "Review Results"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <BookOpen className="w-4 h-4" /> View Details
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Completed Message */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={testSeries.length + 1}
        className="rounded-3xl mt-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 text-center shadow-xl"
      >
        <h4 className="text-lg font-semibold">Keep it up! 🚀</h4>
        <p className="text-sm opacity-90 mt-1">
          You’re consistently improving. Complete your series and unlock new badges!
        </p>
      </motion.div>
    </div>
  );
}
