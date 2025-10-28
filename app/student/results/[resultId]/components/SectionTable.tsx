'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function SectionTable({ data }: { data: any[] }) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-md rounded-3xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
          📑 Section-wise Details
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Detailed breakdown of your performance by section
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/70 dark:bg-slate-900/50">
                <TableHead className="text-slate-700 dark:text-slate-200">Section</TableHead>
                <TableHead className="text-slate-700 dark:text-slate-200">Score</TableHead>
                <TableHead className="text-green-600">Correct</TableHead>
                <TableHead className="text-rose-600">Wrong</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-300">Unanswered</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((sr: any) => (
                <TableRow
                  key={sr.id}
                  className="hover:bg-indigo-100/40 dark:hover:bg-slate-800/40 transition"
                >
                  <TableCell className="font-medium text-slate-700 dark:text-slate-100">
                    {sr.sections.title}
                  </TableCell>
                  <TableCell className="font-semibold text-indigo-700 dark:text-indigo-300">
                    {sr.obtained_marks}/{sr.total_marks}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {sr.correct_answers}
                  </TableCell>
                  <TableCell className="text-rose-600 font-medium">
                    {sr.wrong_answers}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {sr.unanswered}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
