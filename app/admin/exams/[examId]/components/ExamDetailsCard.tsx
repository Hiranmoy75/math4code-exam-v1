"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"

export default function ExamDetailsCard() {
  const params = useParams()
  const examId = params.examId as string

  const [exam, setExam] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    total_marks: "",
    negative_marking: "",
  })

  const loadExamData = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: examData } = await supabase.from("exams").select("*").eq("id", examId).single()
    setExam(examData)
    setEditData({
      title: examData.title,
      description: examData.description || "",
      duration_minutes: examData.duration_minutes.toString(),
      total_marks: examData.total_marks.toString(),
      negative_marking: examData.negative_marking.toString(),
    })
    setIsLoading(false)
  }

  useEffect(() => {
    loadExamData()
  }, [examId])

  const handleUpdateExam = async () => {
    const supabase = createClient()
    await supabase.from("exams").update({
      title: editData.title,
      description: editData.description,
      duration_minutes: Number(editData.duration_minutes),
      total_marks: Number(editData.total_marks),
      negative_marking: Number(editData.negative_marking),
    }).eq("id", examId)
    setEditMode(false)
    loadExamData()
  }

  if (isLoading) return null

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>Exam Details</CardTitle>
          <CardDescription>Update exam information</CardDescription>
        </div>
        <Button variant="outline" onClick={() => (editMode ? handleUpdateExam() : setEditMode(true))}>
          {editMode ? "Save" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {editMode ? (
          <>
            <FormField label="Title" value={editData.title} onChange={(v:any) => setEditData({ ...editData, title: v })} />
            <FormField label="Description" value={editData.description} onChange={(v:any) => setEditData({ ...editData, description: v })} textarea rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Duration (minutes)" value={editData.duration_minutes} onChange={(v:any) => setEditData({ ...editData, duration_minutes: v })} type="number" />
              <FormField label="Total Marks" value={editData.total_marks} onChange={(v:any) => setEditData({ ...editData, total_marks: v })} type="number" />
            </div>
            <FormField label="Negative Marking" value={editData.negative_marking} onChange={(v:any) => setEditData({ ...editData, negative_marking: v })} type="number" step="0.25" />
          </>
        ) : (
          <div className="space-y-2">
            <p><strong>Title:</strong> {exam.title}</p>
            <p><strong>Description:</strong> {exam.description || "No description"}</p>
            <p><strong>Duration:</strong> {exam.duration_minutes} min</p>
            <p><strong>Total Marks:</strong> {exam.total_marks}</p>
            <p><strong>Negative Marking:</strong> {exam.negative_marking}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FormField({ label, value, onChange, type = "text", textarea = false, rows, step }: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} step={step} />
      )}
    </div>
  )
}
