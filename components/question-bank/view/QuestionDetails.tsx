import React from "react"

interface QuestionDetailsProps {
  question: {
    question_type: string
    marks: number
    negative_marks: number
    difficulty: string
    subject: string
    topic: string
  }
}

export default function QuestionDetails({ question }: QuestionDetailsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Detail label="Type" value={question.question_type} />
      <Detail label="Marks" value={question.marks} />
      <Detail label="Negative Marks" value={question.negative_marks} />
      <Detail label="Difficulty" value={question.difficulty} capitalize />
      <Detail label="Subject" value={question.subject} />
      <Detail label="Topic" value={question.topic} />
    </div>
  )
}

function Detail({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string | number
  capitalize?: boolean
}) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  )
}
