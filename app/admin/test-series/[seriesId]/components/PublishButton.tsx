"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"

export default function PublishButton({
  seriesId,
  isPublished,
  publishAction,
}: {
  seriesId: string
  isPublished: boolean
  publishAction: (seriesId: string) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    if (confirm("Are you sure you want to publish this test series?")) {
      startTransition(async () => {
        await publishAction(seriesId)
      })
    }
  }

  return (
    <Button
      disabled={isPending || isPublished}
      variant={isPublished ? "secondary" : "default"}
      onClick={handlePublish}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Publishing...
        </>
      ) : isPublished ? (
        "Published"
      ) : (
        <>
          <Upload className="w-4 h-4 mr-2" />
          Publish
        </>
      )}
    </Button>
  )
}
