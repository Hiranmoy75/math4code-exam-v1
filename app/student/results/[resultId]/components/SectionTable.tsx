'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SectionTable({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Section-wise Details</CardTitle>
        <CardDescription>Detailed breakdown for each section</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Correct</TableHead>
              <TableHead>Wrong</TableHead>
              <TableHead>Unanswered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((sr: any) => (
              <TableRow key={sr.id}>
                <TableCell className="font-medium">{sr.sections.title}</TableCell>
                <TableCell>
                  {sr.obtained_marks}/{sr.total_marks}
                </TableCell>
                <TableCell className="text-green-600">{sr.correct_answers}</TableCell>
                <TableCell className="text-red-600">{sr.wrong_answers}</TableCell>
                <TableCell className="text-gray-600">{sr.unanswered}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
