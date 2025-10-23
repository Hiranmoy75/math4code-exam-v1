import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonQuestionForm() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
