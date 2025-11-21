"use client";

import { Card } from "@/components/ui/card";
import { FolderPlus, Award, Clock, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/admin/dashboard/useDashboardStats";
import Link from "next/link";

interface Props {
  userId: string;
}

export default function StatsCards({ userId }: Props) {
  const { data, isLoading, isError, error } = useDashboardStats(userId);

  if (isLoading)
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 border-none shadow-sm bg-white/50 dark:bg-slate-800/50">
            <div className="animate-pulse h-16 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </Card>
        ))}
      </div>
    );

  if (isError)
    return (
      <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm text-center">
        Failed to load stats: {(error as any).message}
      </div>
    );

  const { examsCount, questionsCount, attemptsCount, uniqueStudents } = data ?? {
    examsCount: 0,
    questionsCount: 0,
    attemptsCount: 0,
    uniqueStudents: 0,
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  const stats = [
    {
      title: "Total Exams",
      value: examsCount,
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Questions",
      value: questionsCount,
      icon: <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Total Attempts",
      value: attemptsCount,
      icon: <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Active Students",
      value: uniqueStudents,
      icon: <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={0}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard Overview
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              Track your exam performance, student engagement, and question bank growth all in one place.
            </p>
          </div>

          <Link href="/admin/exams/create">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Create New Exam</span>
            </motion.button>
          </Link>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={i + 1}
            whileHover={{ y: -4 }}
            className={`p-6 rounded-2xl bg-white dark:bg-slate-800 border ${stat.border} shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {stat.value.toLocaleString()}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
