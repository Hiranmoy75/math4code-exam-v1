'use client'
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Star,
  PlayCircle,
  Loader2,
} from "lucide-react";

import { useCurrentUser } from "@/hooks/student/useCurrentUser";
import { useStudentStats } from "@/hooks/student/useStudentStats";
import { useStudentTestSeries } from "@/hooks/student/useStudentTestSeries";
import { useLastAttempt } from "@/hooks/student/useLastAttempt";

export default function StudentDashboard() {
  const router = useRouter();

  // Fetch data
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: stats, isLoading: statsLoading } = useStudentStats(user?.id);
  const { data: testSeries, isLoading: seriesLoading } = useStudentTestSeries(user?.id);
  const { data: lastAttempt } = useLastAttempt(user?.id);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6 },
    }),
  };

  const handleContinueTest = () => {
    if (lastAttempt) {
      router.push(`/student/exam/${lastAttempt.examId}/attempt/${lastAttempt.attemptId}`);
    }
  };

  const handleViewSeries = (seriesId: string) => {
    router.push(`/student/test-series/${seriesId}`);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Get icon for test series
  const getSeriesIcon = (index: number) => {
    const icons = [
      <BookOpen key="book" className="w-5 h-5 text-indigo-500" />,
      <Calendar key="cal" className="w-5 h-5 text-green-500" />,
      <Star key="star" className="w-5 h-5 text-yellow-500" />,
    ];
    return icons[index % icons.length];
  };

  const statsData = [
    {
      title: "Total Exams Given",
      value: statsLoading ? "..." : stats?.totalExams.toString() || "0",
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      color: "from-green-50 to-emerald-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Average Score",
      value: statsLoading ? "..." : `${stats?.averageScore || 0}%`,
      icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
      color: "from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Time Spent (hrs)",
      value: statsLoading ? "..." : `${stats?.totalTimeSpent || 0}h`,
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      color: "from-yellow-50 to-amber-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Rank",
      value: statsLoading ? "..." : `#${stats?.rank || 0}`,
      icon: <Award className="w-6 h-6 text-purple-500" />,
      color: "from-purple-50 to-pink-100 dark:from-slate-800 dark:to-slate-900",
    },
  ];

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
            Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user?.fullName || "Student"}!</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Keep up the great work! You're progressing steadily towards your goals.
          </p>
        </div>

        {lastAttempt && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleContinueTest}
            className="mt-4 md:mt-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <PlayCircle className="w-5 h-5" />
            <span className="font-medium">Continue Last Test</span>
          </motion.button>
        )}
      </motion.div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsData.map((stat, i) => (
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

        {seriesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : testSeries && testSeries.length > 0 ? (
          <div className="space-y-4">
            {testSeries.map((test, idx) => (
              <motion.div
                key={test.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleViewSeries(test.id)}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-100 dark:bg-slate-700">
                    {getSeriesIcon(idx)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {test.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Next Exam: {test.nextExamName || "No upcoming exams"}
                      {test.nextExamDate && ` - ${formatDate(test.nextExamDate)}`}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-56">
                  <div className="flex justify-between text-xs mb-1 text-slate-500 dark:text-slate-400">
                    <span>Progress ({test.completedExams}/{test.totalExams})</span>
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
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No test series enrolled yet</p>
            <p className="text-sm mt-1">Contact your admin to get enrolled in test series</p>
          </div>
        )}
      </motion.div>

      {/* Achievements Section */}
      {stats && stats.averageScore >= 75 && (
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
                You're performing excellently with {stats.averageScore}% average score!
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push("/student/achievements")}
              className="px-4 py-2 rounded-lg bg-white text-indigo-600 font-semibold shadow-md"
            >
              View Achievements
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
