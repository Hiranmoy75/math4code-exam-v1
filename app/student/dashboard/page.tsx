'use client'
import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Star,
  PlayCircle,
} from "lucide-react";

export default function StudentDashboard() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6 },
    }),
  };

  const stats = [
    {
      title: "Total Exams Given",
      value: "18",
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      color: "from-green-50 to-emerald-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Average Score",
      value: "82%",
      icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
      color: "from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Time Spent (hrs)",
      value: "45h",
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      color: "from-yellow-50 to-amber-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Rank",
      value: "#12",
      icon: <Award className="w-6 h-6 text-purple-500" />,
      color: "from-purple-50 to-pink-100 dark:from-slate-800 dark:to-slate-900",
    },
  ];

  const testSeries = [
    {
      id: 1,
      name: "JEE Advanced Mock Test 2025",
      progress: 75,
      nextExam: "2 Nov 2025",
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
    },
    {
      id: 2,
      name: "CBSE Board Math Series",
      progress: 40,
      nextExam: "5 Nov 2025",
      icon: <Calendar className="w-5 h-5 text-green-500" />,
    },
    {
      id: 3,
      name: "Aptitude & Reasoning Practice",
      progress: 60,
      nextExam: "10 Nov 2025",
      icon: <Star className="w-5 h-5 text-yellow-500" />,
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen transition-colors duration-700">
      {/* Welcome Section */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={0}
        className="rounded-3xl p-6 md:p-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">Hiranmoy!</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Keep up the great work! You’re progressing steadily towards your goals.
          </p>
        </div>
       
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="mt-4 md:mt-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <PlayCircle className="w-5 h-5" />
          <span className="font-medium">Continue Last Test</span>
        </motion.div>
      </motion.div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={i + 1}
            whileHover={{ scale: 1.03 }}
            className={`p-5 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-between`}
          >
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
            </div>
            {stat.icon}
          </motion.div>
        ))}
      </div>

      {/* Test Series Progress */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={5}
        className="rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg p-6 shadow-xl border border-slate-100 dark:border-slate-700"
      >
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
          Your Test Series
        </h3>
        <div className="space-y-4">
          {testSeries.map((test, idx) => (
            <motion.div
              key={test.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-100 dark:bg-slate-700">
                  {test.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white">
                    {test.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Next Exam: {test.nextExam}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-56">
                <div className="flex justify-between text-xs mb-1 text-slate-500 dark:text-slate-400">
                  <span>Progress</span>
                  <span>{test.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${test.progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={6}
        className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">Congratulations! 🎉</h3>
            <p className="text-sm opacity-90">
              You’re among the top 10% scorers this month.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 rounded-lg bg-white text-indigo-600 font-semibold shadow-md"
          >
            View Achievements
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
