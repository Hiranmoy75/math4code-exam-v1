// app/admin/test-series/components/EmptyState.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function EmptyState() {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <p className="text-gray-500 mb-4">No test series created yet</p>
        <Link href="/admin/test-series/create">
          <Button>Create Your First Series</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
