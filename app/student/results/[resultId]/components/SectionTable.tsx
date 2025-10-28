'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  TableFooter,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function SectionTable({ data }: { data: any[] }) {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 
      dark:from-slate-800 dark:to-slate-900 border-0 shadow-md rounded-3xl">

      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">
          📑 Section-wise Details
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Detailed breakdown of your performance by section
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0">
  <div className="overflow-x-auto w-full">
    <Table className="min-w-[650px]">
            <TableCaption>Section-wise breakdown of your result</TableCaption>
            <TableHeader>
              <TableRow className="bg-white/70 dark:bg-slate-900/50">
                <TableHead>Section</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-green-600">Correct</TableHead>
                <TableHead className="text-rose-600">Wrong</TableHead>
                <TableHead>Unanswered</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((sr: any) => (
                <TableRow key={sr.id} className="hover:bg-indigo-100/40 dark:hover:bg-slate-800/40">
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0"
                    >
                      {sr.sections.title}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-lg px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold">
                      {sr.obtained_marks}/{sr.total_marks}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-lg px-3 py-1 bg-green-500/90 text-white font-medium">
                      {sr.correct_answers}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-lg px-3 py-1 bg-rose-500/90 text-white font-medium">
                      {sr.wrong_answers}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-lg px-3 py-1 bg-slate-400/80 text-white font-medium">
                      {sr.unanswered}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-green-600 font-semibold">
                  {data.reduce((sum, sr) => sum + sr.correct_answers, 0)}
                </TableCell>
                <TableCell className="text-rose-600 font-semibold">
                  {data.reduce((sum, sr) => sum + sr.wrong_answers, 0)}
                </TableCell>
                <TableCell className="text-slate-600 font-semibold">
                  {data.reduce((sum, sr) => sum + sr.unanswered, 0)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
