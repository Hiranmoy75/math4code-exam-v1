"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"

interface TestSeriesCardProps {
  series: {
    id: string
    title: string
    description: string
    total_exams: number
    is_free: boolean
    price?: number
    status: string
  }
  onDelete: (id: string) => void
}

export function TestSeriesCard({ series, onDelete }: TestSeriesCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="line-clamp-2">{series.title}</CardTitle>
        <CardDescription className="line-clamp-2">{series.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Exams:</span>
            <span className="font-medium">{series.total_exams}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="font-medium">{series.is_free ? "Free" : `₹${series.price}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${series.status === "published" ? "text-green-600" : "text-yellow-600"}`}>
              {series.status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/test-series/${series.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" className="flex-1" onClick={() => onDelete(series.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
