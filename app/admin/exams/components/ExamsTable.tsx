import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ExamRow from "./ExamRow"
import EmptyExams from "./EmptyExams"
import fetchExams from "./fetchExams"

export default async function ExamsTable() {
  const exams = await fetchExams()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Exams</CardTitle>
        <CardDescription>All exams created by you</CardDescription>
      </CardHeader>
      <CardContent>
        {exams && exams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam: any) => (
                <ExamRow key={exam.id} exam={exam} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyExams />
        )}
      </CardContent>
    </Card>
  )
}
