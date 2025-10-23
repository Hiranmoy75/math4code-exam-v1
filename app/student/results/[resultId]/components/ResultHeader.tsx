'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ResultHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-600">Detailed performance analysis</p>
      </div>
      <Link href="/student/results">
        <Button variant="outline">Back to Results</Button>
      </Link>
    </div>
  )
}
