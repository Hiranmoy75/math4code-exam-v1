"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Props { userId: string }

export default function RecentAttemptsCard({ userId }: Props) {
  const supabase = createClientComponentClient()
  const [attempts, setAttempts] = useState<any[]>([])

  useEffect(() => {
    async function fetchAttempts() {
      const { data } = await supabase
        .from("exam_attempts")
        .select("*, exams(title), profiles(full_name, email, avatar_url)")
        .order("started_at", { ascending: false })
        .limit(5)
      setAttempts(data || [])
    }

    fetchAttempts()
  }, [userId, supabase])

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "default"
      case "in_progress": return "secondary"
      case "pending": return "destructive"
      default: return "outline"
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").toUpperCase()
    if (email) return email[0].toUpperCase()
    return "U"
  }

  return (
    <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl lg:col-span-2">
     <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-red-400/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader>
        <CardTitle>Recent Student Attempts</CardTitle>
        <CardDescription>Latest submissions</CardDescription>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <p>No attempts yet</p>
        ) : (
          attempts.map(a => (
            <div key={a.id} className="flex justify-between border-b pb-4 last:border-0">
              <div className="flex gap-3 items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={a.profiles?.avatar_url} />
                  <AvatarFallback>{getInitials(a.profiles?.full_name, a.profiles?.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{a.profiles?.full_name || a.profiles?.email}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{a.exams?.title}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={getStatusVariant(a.status)}>{a.status}</Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
