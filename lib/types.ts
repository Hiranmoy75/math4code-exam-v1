export type UserRole = "admin" | "student"

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Exam {
  id: string
  title: string
  description: string | null
  created_by: string
  total_duration: number
  total_marks: number
  passing_marks: number | null
  status: "draft" | "published" | "archived"
  start_time: string | null
  end_time: string | null
  show_answers: boolean
  negative_marking: boolean
  negative_marks_per_question: number | null
  created_at: string
  updated_at: string
}

export interface Section {
  id: string
  exam_id: string
  title: string
  description: string | null
  duration: number
  total_questions: number
  total_marks: number
  section_order: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  section_id: string
  question_text: string
  question_type: "mcq" | "msq" | "nat"
  marks: number
  negative_marks: number | null
  question_order: number
  image_url: string | null
  created_at: string
  updated_at: string
  duration_minutes:number
}

export interface Option {
  id: string
  question_id: string
  option_text: string
  option_order: number
  is_correct: boolean
  created_at: string
}

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  start_time: string
  end_time: string | null
  status: "in_progress" | "submitted" | "abandoned"
  total_time_spent: number | null
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  attempt_id: string
  question_id: string
  selected_options: string[]
  nat_answer: string | null
  is_marked_for_review: boolean
  is_visited: boolean
  answered: boolean
  created_at: string
  updated_at: string
}

export interface Result {
  id: string
  attempt_id: string
  exam_id: string
  student_id: string
  total_questions: number
  attempted: number
  correct: number
  incorrect: number
  unanswered: number
  marked_for_review: number
  total_marks_obtained: number
  total_marks: number
  percentage: number
  rank: number | null
  passed: boolean
  created_at: string
  updated_at: string
}

export interface SectionResult {
  id: string
  result_id: string
  section_id: string
  total_questions: number
  attempted: number
  correct: number
  incorrect: number
  unanswered: number
  marks_obtained: number
  total_marks: number
  accuracy: number | null
  created_at: string
}
