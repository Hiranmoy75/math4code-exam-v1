"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useParams, useRouter } from "next/navigation"
import SectionItem from "./SectionItem"

export default function SectionsCard() {
  const params = useParams()
  const examId = params.examId as string
  const router = useRouter()

  const [sections, setSections] = useState<any[]>([])
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSection, setNewSection] = useState({ title: "", duration_minutes: "", total_marks: "" })

  const loadSections = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("sections").select("*").eq("exam_id", examId).order("section_order", { ascending: true })
    setSections(data || [])
  }

  useEffect(() => { loadSections() }, [examId])

  const handleAddSection = async () => {
    const supabase = createClient()
    await supabase.from("sections").insert({
      exam_id: examId,
      title: newSection.title,
      duration_minutes: Number(newSection.duration_minutes),
      total_marks: Number(newSection.total_marks),
      section_order: sections.length + 1,
    })
    setNewSection({ title: "", duration_minutes: "", total_marks: "" })
    setShowAddSection(false)
    loadSections()
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>Sections</CardTitle>
          <CardDescription>Manage exam sections</CardDescription>
        </div>
        <Button onClick={() => setShowAddSection(!showAddSection)}>{showAddSection ? "Cancel" : "Add Section"}</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddSection && (
          <div className="border rounded p-4 space-y-4 bg-gray-50">
            <FormField label="Section Title" value={newSection.title} onChange={(v:any) => setNewSection({ ...newSection, title: v })} />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Duration (minutes)" value={newSection.duration_minutes} onChange={(v:any) => setNewSection({ ...newSection, duration_minutes: v })} type="number" />
              <FormField label="Total Marks" value={newSection.total_marks} onChange={(v:any) => setNewSection({ ...newSection, total_marks: v })} type="number" />
            </div>
            <Button onClick={handleAddSection}>Create Section</Button>
          </div>
        )}

        {sections.length === 0 ? <p className="text-gray-600">No sections yet. Add one to get started!</p> : (
          <div className="space-y-3">
            {sections.map((section) => <SectionItem key={section.id} section={section} examId={examId} />)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FormField({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} />
    </div>
  )
}
