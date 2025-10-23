import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ResultsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all results for this student
  const { data: results } = await supabase
    .from("results")
    .select("*, exam_attempts(exam_id, exams(title))")
    .eq("exam_attempts.student_id", user?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Results</h1>
        <p className="text-gray-600">View your exam performance and detailed analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
          <CardDescription>All your completed exams</CardDescription>
        </CardHeader>
        <CardContent>
          {results && results.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result: any) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.exam_attempts.exams.title}</TableCell>
                    <TableCell>
                      {result.obtained_marks}/{result.total_marks}
                    </TableCell>
                    <TableCell>{result.percentage.toFixed(2)}%</TableCell>
                    <TableCell>{result.rank || "N/A"}</TableCell>
                    <TableCell>
                      <Link href={`/student/results/${result.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No results yet</p>
              <Link href="/student/dashboard">
                <Button>Take an Exam</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
