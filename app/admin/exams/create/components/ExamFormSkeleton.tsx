import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ExamFormSkeleton() {
  const skeletonFields = Array.from({ length: 5 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Details</CardTitle>
        <CardDescription>Enter basic information about your exam</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {skeletonFields.map((_, idx) => (
          <div key={idx} className="h-10 bg-gray-200 rounded animate-pulse"></div>
        ))}
        <div className="flex gap-4 mt-4">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  )
}
