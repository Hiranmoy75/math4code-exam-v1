"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"

interface Option {
  id?: string
  option_text: string
  option_order: number
  is_correct: boolean
}

interface QuestionFormProps {
  onSubmit: (formData: any, options: Option[]) => Promise<void>
  isLoading?: boolean
}

export function QuestionForm({ onSubmit, isLoading = false }: QuestionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    question_text: "",
    question_type: "MCQ",
    marks: "1",
    negative_marks: "0",
    correct_answer: "",
    explanation: "",
    subject: "",
    topic: "",
    difficulty: "medium",
  })
  const [options, setOptions] = useState<Option[]>([{ option_text: "", option_order: 1, is_correct: false }])

  const handleOptionChange = (index: number, field: string, value: string | boolean) => {
    const newOptions = [...options]
    if (field === "option_text") {
      newOptions[index].option_text = value as string
    } else if (field === "is_correct") {
      newOptions.forEach((opt, i) => {
        opt.is_correct = i === index
      })
    }
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, { option_text: "", option_order: options.length + 1, is_correct: false }])
  }

  const removeOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions.map((opt, i) => ({ ...opt, option_order: i + 1 })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData, options)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Question Title</Label>
            <Input
              id="title"
              placeholder="e.g., Quadratic Equations - Problem 1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="question">Question Text</Label>
            <Textarea
              id="question"
              placeholder="Enter the question (supports LaTeX)"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Question Type</Label>
              <select
                id="type"
                value={formData.question_type}
                onChange={(e) => {
                  setFormData({ ...formData, question_type: e.target.value })
                  if (e.target.value === "NAT") {
                    setOptions([])
                  } else {
                    setOptions([{ option_text: "", option_order: 1, is_correct: false }])
                  }
                }}
                className="border rounded px-3 py-2"
              >
                <option value="MCQ">MCQ (Single Answer)</option>
                <option value="MSQ">MSQ (Multiple Answers)</option>
                <option value="NAT">NAT (Numerical Answer)</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                type="number"
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="negative">Negative Marks</Label>
              <Input
                id="negative"
                type="number"
                step="0.25"
                value={formData.negative_marks}
                onChange={(e) => setFormData({ ...formData, negative_marks: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Mathematics"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Algebra"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
            </div>
          </div>

          {(formData.question_type === "MCQ" || formData.question_type === "MSQ") && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between items-center">
                <Label>Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 grid gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.option_text}
                      onChange={(e) => handleOptionChange(index, "option_text", e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={option.is_correct}
                      onChange={() => handleOptionChange(index, "is_correct", true)}
                      className="w-4 h-4"
                    />
                    <Label className="text-sm">Correct</Label>
                  </div>
                  {options.length > 1 && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeOption(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {formData.question_type === "NAT" && (
            <div className="grid gap-2 border-t pt-4">
              <Label htmlFor="nat_answer">Correct Answer</Label>
              <Input
                id="nat_answer"
                placeholder="Enter the numerical answer"
                value={formData.correct_answer}
                onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              placeholder="Provide explanation for the answer (supports LaTeX)"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Question"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
