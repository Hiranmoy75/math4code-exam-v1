export type UserRole = "admin" | "student" | "creator"

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
  admin_id: string
  title: string
  description: string | null
  created_by: string | null
  duration_minutes: number
  total_marks: number
  passing_marks: number | null
  status: "draft" | "published" | "archived"
  start_time: string | null
  end_time: string | null
  result_visibility: "immediate" | "scheduled" | "manual"
  result_release_time: string | null
  show_answers: boolean
  max_attempts: number | null
  created_at: string
  updated_at?: string
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
  duration_minutes: number
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

// LMS Types

export interface Course {
  id: string
  creator_id: string
  title: string
  description: string | null
  price: number
  thumbnail_url: string | null
  category: string | null
  level: "beginner" | "intermediate" | "advanced" | "all"
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  module_order: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  content_type: "video" | "text" | "pdf" | "quiz"
  content_url: string | null
  content_text: string | null
  video_duration: number | null
  is_free_preview: boolean
  is_downloadable: boolean
  lesson_order: number
  exam_id?: string
  // Live Class fields
  is_live?: boolean
  meeting_url?: string | null
  meeting_platform?: string | null
  meeting_date?: string | null
  // Bunny.net video hosting fields
  video_provider?: "youtube" | "bunny" | "direct" | "jitsi"
  video_type?: "vod" | "live"
  bunny_video_id?: string | null
  bunny_library_id?: string | null
  bunny_guid?: string | null
  bunny_stream_id?: string | null
  video_status?: "processing" | "ready" | "live" | "ended" | "error"
  stream_key?: string | null
  rtmp_url?: string | null
  // Jitsi fields
  jitsi_meeting_id?: string | null
  jitsi_meeting_url?: string | null
  created_at: string
  updated_at: string
}


export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  status: "active" | "completed" | "refunded"
  progress: number
}

export interface Review {
  id: string
  course_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
}
