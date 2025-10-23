// app/admin/test-series/create/components/TestSeriesFormSkeleton.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSeriesFormSkeleton() {
  return (
   <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <CardDescription className="h-4 bg-gray-100 rounded w-2/3 animate-pulse mt-2" />
          </CardHeader>
          <CardContent className="space-y-6 animate-pulse">
            <div className="h-10 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-10 bg-gray-100 rounded" />
            <div className="flex gap-4">
              <div className="h-9 bg-gray-200 rounded w-1/3" />
              <div className="h-9 bg-gray-200 rounded w-1/3" />
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
