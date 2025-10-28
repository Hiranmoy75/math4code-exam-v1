"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Eye } from "lucide-react"

export default function QuickActionsCard() {
  return (
    <Card className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 shadow-md backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl lg:col-span-1">
     <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-red-400/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Get started quickly</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Link href="/admin/exams/create">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-slate-800/60 dark:hover:bg-indigo-600 dark:text-white">
            <Plus className="mr-2 h-4 w-4" /> Create New Exam
          </Button>
        </Link>
        <Link href="/admin/exams">
          <Button variant="outline" className="w-full">
            <Eye className="mr-2 h-4 w-4" /> View All Exams
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
