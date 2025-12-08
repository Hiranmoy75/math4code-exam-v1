"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion } from "framer-motion"
import { Trophy, Percent, Award, FileText } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

const supabase = createClient()

// 🔹 Fetch Function
import { useUser } from "@/hooks/useUser"

// 🔹 Fetch Function
async function fetchResults(userId: string | undefined) {
  if (!userId) return []

  const { data, error } = await supabase
    .from("results")
    .select("*, exam_attempts(exam_id, exams(title))")
    .eq("exam_attempts.student_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

export default function ResultsPage() {
  const { user, loading: isUserLoading } = useUser()

  const {
    data: results,
    isLoading: isResultsLoading,
    isFetching,
  } = useQuery({
    queryKey: ["student-results", user?.id],
    queryFn: () => fetchResults(user?.id),
    enabled: !!user?.id,
  })

  const isLoading = isResultsLoading || isUserLoading


  return (
    <div className="p-6 md:p-10 bg-gradient-to-br from-indigo-50 via-sky-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-black min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
          🏆 My Results
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          View your performance across all completed exams
        </p>
      </div>

      <Card className="shadow-xl border-0 rounded-3xl backdrop-blur bg-white/70 dark:bg-slate-800/60">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <FileText className="w-5 h-5 text-indigo-600" /> Exam Performance Summary
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            All your completed test results are shown below
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-x-auto mt-3">
          {/* 🔹 Loading Skeleton */}
          {(isLoading || isFetching) && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50"
                >
                  <Skeleton className="h-5 w-1/4 rounded-md" />
                  <Skeleton className="h-5 w-1/6 rounded-md" />
                  <Skeleton className="h-5 w-1/6 rounded-md" />
                  <Skeleton className="h-5 w-1/6 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          )}

          {/* 🔹 Data Table */}
          {!isLoading && results && results.length > 0 ? (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-indigo-100 via-sky-100 to-blue-100 dark:from-slate-700 dark:via-slate-700 dark:to-slate-800">
                  <TableHead className="font-semibold text-slate-800 dark:text-slate-200">
                    Exam
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-800 dark:text-slate-200">
                    Score
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-800 dark:text-slate-200">
                    Percentage
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-800 dark:text-slate-200">
                    Rank
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-800 dark:text-slate-200">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((result: any, idx: number) => (
                  <motion.tr
                    key={result.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-sky-50 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all"
                  >
                    {/* Exam Title */}
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {result.exam_attempts.exams.title}
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-center">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 text-sm rounded-full shadow-md">
                        <Trophy className="w-3 h-3 mr-1" />
                        {result.obtained_marks}/{result.total_marks}
                      </Badge>
                    </TableCell>

                    {/* Percentage */}
                    <TableCell className="text-center">
                      <Badge
                        className={`px-3 py-1 text-sm rounded-full shadow-md ${result.percentage >= 80
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : result.percentage >= 60
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                            : "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                          }`}
                      >
                        <Percent className="w-3 h-3 mr-1" />
                        {result.percentage.toFixed(2)}%
                      </Badge>
                    </TableCell>

                    {/* Rank */}
                    <TableCell className="text-center">
                      {result.rank ? (
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 text-sm rounded-full shadow-md">
                          <Award className="w-3 h-3 mr-1" /> #{result.rank}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          N/A
                        </Badge>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center">
                      <Link
                        href={`/student/results/${result.id}?attemptId=${result.attempt_id}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-500 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-6 rounded-full bg-indigo-100 dark:bg-slate-700 mb-4"
                >
                  <Trophy className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white mb-2">
                  No Results Yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  You haven’t completed any exams yet. Start your first test now!
                </p>
                <Link href="/student/dashboard">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                    Take an Exam
                  </Button>
                </Link>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
