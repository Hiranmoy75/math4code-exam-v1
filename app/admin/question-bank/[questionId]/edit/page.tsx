"use client"

import { Suspense, lazy } from "react"
import { SkeletonQuestionForm } from "@/components/question-bank/edit/SkeletonQuestionForm"

const QuestionForm = lazy(() => import("@/components/question-bank/edit/QuestionForm"))

export default function EditQuestionPage() {
  return (
    <Suspense fallback={<SkeletonQuestionForm />}>
      <QuestionForm />
    </Suspense>
  )
}
