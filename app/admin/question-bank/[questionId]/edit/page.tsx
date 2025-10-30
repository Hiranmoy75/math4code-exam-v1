"use client"

import dynamic from "next/dynamic"
import { Suspense, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save } from "lucide-react"
import { motion } from "framer-motion"
import { pageBg, cardGlass } from "@/components/question-bank/ui"

const QuestionForm = dynamic(() => import("@/components/question-bank/QuestionForm"), { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> })

export default function EditQuestionPage() {
  const router = useRouter()
  const { questionId } = useParams<{ questionId: string }>()
  const [saving, setSaving] = useState(false)
  const formRef = useRef<{ submit: () => Promise<void> } | null>(null)

  return (
    <div className={`space-y-6 ${pageBg}`}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Edit Question</h1>
          <p className="text-sm text-muted-foreground">ID: {questionId}</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true)
                await formRef.current?.submit?.()
                router.push(`/dashboard/question-bank/${questionId}`)
              } finally {
                setSaving(false)
              }
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </motion.div>

      <Card className={`${cardGlass}`}>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Question Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-80 w-full" />}>
            <QuestionForm questionId={questionId} ref={formRef as any} onSuccess={() => router.push(`/dashboard/question-bank/${questionId}`)} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Sticky mobile actions */}
      <div className="md:hidden fixed inset-x-0 bottom-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="flex gap-2">
          <Button variant="outline" className="w-1/2" onClick={() => router.back()}>Back</Button>
          <Button
            className="w-1/2"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true)
                await formRef.current?.submit?.()
                router.push(`/dashboard/question-bank/${questionId}`)
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
