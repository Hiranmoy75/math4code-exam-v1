"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Pencil } from "lucide-react"
import { motion } from "framer-motion"
import { pageBg, cardGlass } from "@/components/question-bank/ui"

const QuestionDetails = dynamic(() => import("@/components/question-bank/view/QuestionDetails"), { ssr: false, loading: () => <Skeleton className="h-24 w-full" /> })
const OptionList = dynamic(() => import("@/components/question-bank/view/OptionList"), { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> })
const QuestionExplanation = dynamic(() => import("@/components/question-bank/view/QuestionExplanation"), { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> })

export default function QuestionViewPage() {
  const { questionId } = useParams<{ questionId: string }>()
  const router = useRouter()

  return (
    <div className={`space-y-6 ${pageBg}`}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Question Details</h1>
          <p className="text-sm text-muted-foreground">ID: {questionId}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={() => router.push(`/dashboard/question-bank/${questionId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </motion.div>

      <Card className={`${cardGlass}`}>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <QuestionDetails questionId={questionId} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <OptionList questionId={questionId} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full" />}>
            <QuestionExplanation questionId={questionId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
