import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function StudentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all exams by this admin
  const { data: exams } = await supabase.from("exams").select("id").eq("admin_id", user?.id)

  // Get all students who attempted these exams
  const { data: attempts } = await supabase
    .from("exam_attempts")
    .select("*, profiles(id, full_name, email), exams(title)")
    .in("exam_id", exams?.map((e) => e.id) || [])
    .order("started_at", { ascending: false })

  // Get unique students
  const uniqueStudents = Array.from(
    new Map(
      attempts?.map((a: any) => [
        a.profiles.id,
        {
          id: a.profiles.id,
          name: a.profiles.full_name,
          email: a.profiles.email,
          attempts: attempts.filter((att: any) => att.profiles.id === a.profiles.id).length,
        },
      ]) || [],
    ).values(),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Students</h1>
        <p className="text-gray-600">View and manage students who have attempted your exams</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>All students who have participated in your exams</CardDescription>
        </CardHeader>
        <CardContent>
          {uniqueStudents && uniqueStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueStudents.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name || "N/A"}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.attempts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No students have attempted your exams yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
