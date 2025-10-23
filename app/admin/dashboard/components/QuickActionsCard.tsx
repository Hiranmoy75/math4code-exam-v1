"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Eye } from "lucide-react"

export default function QuickActionsCard() {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Get started quickly</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Link href="/admin/exams/create">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white">
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
