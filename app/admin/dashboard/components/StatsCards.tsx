"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BookMarked, HelpCircle, Users, UserCheck } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex justify-between pb-2">
          <CardTitle>Total Exams</CardTitle>
          <BookMarked className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{examsCount ?? "..."}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between pb-2">
          <CardTitle>Total Questions</CardTitle>
          <HelpCircle className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{questionsCount ?? "..."}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between pb-2">
          <CardTitle>Student Attempts</CardTitle>
          <Users className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{attemptsCount ?? "..."}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex justify-between pb-2">
          <CardTitle>Unique Students</CardTitle>
          <UserCheck className="h-5 w-5 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{uniqueStudents ?? "..."}</div>
        </CardContent>
      </Card>
    </div>
  )
}
