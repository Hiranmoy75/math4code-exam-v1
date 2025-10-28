"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BookMarked, HelpCircle, Users, UserCheck, FolderPlus } from "lucide-react"
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { motion } from "framer-motion";

interface Props {
  userId: string
}

export default function StatsCards({ userId }: Props) {
  const supabase = createClientComponentClient()
  const [examsCount, setExamsCount] = useState<number | null>(null)
  const [questionsCount, setQuestionsCount] = useState<number | null>(null)
  const [attemptsCount, setAttemptsCount] = useState<number | null>(null)
  const [uniqueStudents, setUniqueStudents] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStats() {
      // Exams count
      const { count: exams } = await supabase
        .from("exams")
        .select("*", { count: "exact" })
        .eq("admin_id", userId)
      setExamsCount(exams || 0)

      // Sections -> questions count
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("admin_id", userId) // optional filter
      const { count: questions } = await supabase
        .from("questions")
        .select("*", { count: "exact" })
        .in("section_id", sections?.map(s => s.id) || [])
      setQuestionsCount(questions || 0)

      // Attempts
      const { data: attemptsData, count: attempts } = await supabase
        .from("exam_attempts")
        .select("student_id", { count: "exact" })
        .in("exam_id", sections?.map(s => s.id) || [])
      setAttemptsCount(attempts || 0)
      setUniqueStudents(new Set(attemptsData?.map(a => a.student_id)).size || 0)
    }

    fetchStats()
  }, [userId, supabase])

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
      title: "Total Exams created",
      value: examsCount ?? "...",
      icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
      color: "from-green-50 to-emerald-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Total Questions",
      value: questionsCount ?? "...",
      icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
      color: "from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Student Attempts",
      value: attemptsCount ?? "...",
      icon: <Clock className="w-6 h-6 text-yellow-500" />,
      color: "from-yellow-50 to-amber-100 dark:from-slate-800 dark:to-slate-900",
    },
    {
      title: "Unique Students",
      value: uniqueStudents ?? "...",
      icon: <Award className="w-6 h-6 text-purple-500" />,
      color: "from-purple-50 to-pink-100 dark:from-slate-800 dark:to-slate-900",
    },
  ];

  return (
    <>
     
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
          <FolderPlus className="w-5 h-5"/>
          <span className="font-medium">Creat Exam</span>
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
     
</>
  )
}
