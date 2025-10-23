import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex space-x-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3 shadow-sm">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="p-4 border rounded-lg shadow-sm">
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="p-4 border rounded-lg shadow-sm">
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-6 border rounded-lg shadow-sm p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
