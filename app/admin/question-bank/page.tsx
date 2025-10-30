"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal, Plus, RefreshCw } from "lucide-react"

import { Pill, pageBg, cardGlass } from "@/components/question-bank/ui"
import EmptyState from "@/components/question-bank/EmptyState"
import { useQuestionQuery } from "@/components/question-bank/useQuestionQuery"
import { QuestionTable } from "@/components/question-bank/table/QuestionTable"
import { columns as makeColumns } from "@/components/question-bank/table/columns"
import { createClient } from "@/lib/supabase/client"
import ImportQuestions from "./ImportQuestions"

const QuestionForm = dynamic(() => import("@/components/question-bank/QuestionForm"), { ssr: false })

export default function QuestionBankPage() {
  const router = useRouter()
  const qs = useSearchParams()
  const supabase = createClient()
  

  const [createOpen, setCreateOpen] = useState(false)
  const [adminId, setUserId] = useState<string | null>(null)

    useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    fetchUser()
  }, [supabase])

  const page = Number(qs.get("page") ?? "1")
  const pageSize = 10
  const search = qs.get("q") ?? ""
  const subject = qs.get("subject") ?? "all"
  const difficulty = qs.get("difficulty") ?? "all"
  const qtype = qs.get("type") ?? "all"

  const { loading, rows, pages } = useQuestionQuery({
    page,
    pageSize,
    search,
    subject,
    difficulty,
    qtype,
  })

  const setQuery = (key: string, value: string) => {
    const params = new URLSearchParams(qs.toString())
    if (!value || value === "all") params.delete(key)
    else params.set(key, value)
    params.set("page", "1")
    router.push(`/admin/question-bank?${params.toString()}`)
  }

  const onPageChange = (p: number) => {
    const params = new URLSearchParams(qs.toString())
    params.set("page", String(p))
    router.push(`/admin/question-bank?${params.toString()}`)
  }

  const columns = makeColumns(async (id) => {
    // delete options first (no cascade in schema)
    await supabase.from("question_bank_options").delete().eq("question_id", id)
    const { error } = await supabase.from("question_bank").delete().eq("id", id)
    if (!error) router.refresh()
  })

  return (
    <div className={`space-y-6 ${pageBg}`}>
       {adminId && <ImportQuestions adminId={adminId} />}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardGlass} p-6 md:p-8 flex items-center justify-between`}
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Welcome back, <span className="text-indigo-600">Hiranmoy</span>!
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Keep up the great work! You’re progressing steadily towards your goals.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Question
        </Button>
      </motion.div>

      {/* toolbar */}
      <Card className={`${cardGlass}`}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-96">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-8"
                  placeholder="Search question text…"
                  defaultValue={search}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setQuery("q", (e.target as HTMLInputElement).value)
                  }}
                />
              </div>
              <Button variant="outline" onClick={() => setQuery("q", search)}>
                Search
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Subject</div>
                  {["all", "math", "cs", "physics"].map((s) => (
                    <DropdownMenuItem key={s} onClick={() => setQuery("subject", s)}>
                      <Pill color={subject === s ? "blue" : "gray"} className="mr-2">{s.toUpperCase()}</Pill>
                    </DropdownMenuItem>
                  ))}
                  <Separator className="my-2" />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Difficulty</div>
                  {["all", "easy", "medium", "hard"].map((d) => (
                    <DropdownMenuItem key={d} onClick={() => setQuery("difficulty", d)}>
                      <Pill color={d === "easy" ? "mint" : d === "medium" ? "amber" : d === "hard" ? "red" : "gray"} className="mr-2">
                        {d.toUpperCase()}
                      </Pill>
                    </DropdownMenuItem>
                  ))}
                  <Separator className="my-2" />
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Type</div>
                  {["all", "MCQ", "MSQ", "NAT"].map((t) => (
                    <DropdownMenuItem key={t} onClick={() => setQuery("type", t)}>
                      <Pill color={t === "MCQ" ? "violet" : t === "MSQ" ? "pink" : t === "NAT" ? "mint" : "gray"} className="mr-2">
                        {t}
                      </Pill>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => router.refresh()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {subject !== "all" && <Pill color="blue">Subject: {subject}</Pill>}
            {difficulty !== "all" && <Pill color={difficulty === "easy" ? "mint" : difficulty === "medium" ? "amber" : "red"}>Difficulty: {difficulty}</Pill>}
            {qtype !== "all" && <Pill color={qtype === "MCQ" ? "violet" : qtype === "MSQ" ? "pink" : "mint"}>Type: {qtype}</Pill>}
            {search && <Pill color="gray">Query: “{search}”</Pill>}
          </div>
        </CardContent>
      </Card>

      {/* table */}
      <QuestionTable
        columns={columns}
        data={rows}
        page={page}
        pages={pages}
        onPageChange={onPageChange}
        loading={loading}
        empty={<EmptyState onCreate={() => setCreateOpen(true)} />}
      />

      {/* create sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create a new Question</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <QuestionForm
              onSuccess={() => {
                setCreateOpen(false)
                router.refresh()
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
