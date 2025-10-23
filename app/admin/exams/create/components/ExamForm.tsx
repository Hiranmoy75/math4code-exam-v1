"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ExamForm() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("180")
  const [totalMarks, setTotalMarks] = useState("300")
  const [negativeMarking, setNegativeMarking] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { data, error: insertError } = await supabase
        .from("exams")
        .insert({
          admin_id: user.id,
          title,
          description,
          duration_minutes: Number.parseInt(durationMinutes),
          total_marks: Number.parseInt(totalMarks),
          negative_marking: Number.parseFloat(negativeMarking),
          status: "draft",
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/admin/exams/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create exam")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>Enter basic information about your exam</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateExam} className="space-y-6">
          <FormField label="Exam Title" value={title} onChange={setTitle} placeholder="e.g., IIT JEE Main 2024 - Test 1" required />
          <FormField label="Description" value={description} onChange={setDescription} placeholder="Describe the exam" textarea rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} type="number" required />
            <FormField label="Total Marks" value={totalMarks} onChange={setTotalMarks} type="number" required />
          </div>
          <FormField label="Negative Marking (per wrong answer)" value={negativeMarking} onChange={setNegativeMarking} type="number" step="0.25" />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Exam"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  rows,
  step,
  required,
}: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} step={step} required={required} />
      )}
    </div>
  )
}
