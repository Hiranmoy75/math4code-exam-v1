import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ExamDetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="h-6 w-40 bg-gray-200 rounded animate-pulse"></CardTitle>
        <CardDescription className="h-4 w-60 bg-gray-200 rounded animate-pulse mt-2"></CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  )
}
