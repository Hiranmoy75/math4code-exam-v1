"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Plus, RefreshCw, X } from "lucide-react";

import { Pill, pageBg, cardGlass } from "@/components/question-bank/ui";
import EmptyState from "@/components/question-bank/EmptyState";
import { QuestionTable } from "@/components/question-bank/table/QuestionTable";
import { columns as makeColumns } from "@/components/question-bank/table/columns";
import ImportQuestions from "./ImportQuestions";

import { useCurrentAdmin } from "@/hooks/admin/question-bank/useCurrentAdmin";
import { useQuestions } from "@/hooks/admin/question-bank/useQuestions";
import { useDeleteQuestion } from "@/hooks/admin/question-bank/useDeleteQuestion";

const QuestionForm = dynamic(
  () => import("@/components/question-bank/QuestionForm"),
  { ssr: false }
);

export default function QuestionBankPage() {
  const [createOpen, setCreateOpen] = useState(false);

  // ✅ Local filter state (No URL params)
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    subject: "all",
    difficulty: "all",
    qtype: "all",
  });

  const { data: adminId } = useCurrentAdmin();
  const { mutateAsync: deleteQuestion } = useDeleteQuestion();

  // ✅ Fetch questions with current filters
  const { data, isLoading, refetch } = useQuestions(filters);

  // Handlers
  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]:
        key === "search"
          ? ""
          : key === "page"
          ? 1
          : key === "pageSize"
          ? 10
          : "all",
    }));
  };

  const onPageChange = (p: number) => {
    setFilters((prev) => ({ ...prev, page: p }));
  };

  const columns = makeColumns(async (id: string) => {
    await deleteQuestion(id);
  });

  return (
    <div className={`space-y-6 ${pageBg}`}>
      {adminId && <ImportQuestions adminId={adminId} />}

      {/* Header */}
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
            Keep up the great work! You’re progressing steadily towards your
            goals.
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Question
        </Button>
      </motion.div>

      {/* Toolbar */}
      <Card className={`${cardGlass}`}>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="flex items-center gap-2 w-full md:w-96">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-8"
                  placeholder="Search question text…"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") refetch();
                  }}
                />
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* Subject */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Subject
                  </div>
                  {["all", "math", "cs", "physics"].map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => setFilter("subject", s)}
                    >
                      <Pill
                        color={filters.subject === s ? "blue" : "gray"}
                        className="mr-2"
                      >
                        {s.toUpperCase()}
                      </Pill>
                    </DropdownMenuItem>
                  ))}
                  <Separator className="my-2" />

                  {/* Difficulty */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Difficulty
                  </div>
                  {["all", "easy", "medium", "hard"].map((d) => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() => setFilter("difficulty", d)}
                    >
                      <Pill
                        color={
                          d === "easy"
                            ? "mint"
                            : d === "medium"
                            ? "amber"
                            : d === "hard"
                            ? "red"
                            : "gray"
                        }
                        className="mr-2"
                      >
                        {d.toUpperCase()}
                      </Pill>
                    </DropdownMenuItem>
                  ))}
                  <Separator className="my-2" />

                  {/* Type */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Type
                  </div>
                  {["all", "MCQ", "MSQ", "NAT"].map((t) => (
                    <DropdownMenuItem
                      key={t}
                      onClick={() => setFilter("qtype", t)}
                    >
                      <Pill
                        color={
                          t === "MCQ"
                            ? "violet"
                            : t === "MSQ"
                            ? "pink"
                            : t === "NAT"
                            ? "mint"
                            : "gray"
                        }
                        className="mr-2"
                      >
                        {t}
                      </Pill>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Chips with ✕ clear */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.subject !== "all" && (
              <Pill color="blue" className="flex items-center gap-2">
                Subject: {filters.subject}
                <button
                  onClick={() => clearFilter("subject")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Pill>
            )}

            {filters.difficulty !== "all" && (
              <Pill
                color={
                  filters.difficulty === "easy"
                    ? "mint"
                    : filters.difficulty === "medium"
                    ? "amber"
                    : "red"
                }
                className="flex items-center gap-2"
              >
                Difficulty: {filters.difficulty}
                <button
                  onClick={() => clearFilter("difficulty")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Pill>
            )}

            {filters.qtype !== "all" && (
              <Pill
                color={
                  filters.qtype === "MCQ"
                    ? "violet"
                    : filters.qtype === "MSQ"
                    ? "pink"
                    : "mint"
                }
                className="flex items-center gap-2"
              >
                Type: {filters.qtype}
                <button
                  onClick={() => clearFilter("qtype")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Pill>
            )}

            {filters.search && (
              <Pill color="gray" className="flex items-center gap-2">
                Query: “{filters.search}”
                <button
                  onClick={() => clearFilter("search")}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </Pill>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <QuestionTable
        columns={columns}
        data={data?.rows ?? []}
        page={filters.page}
        pages={data?.pages ?? 1}
        onPageChange={onPageChange}
        loading={isLoading}
        empty={<EmptyState onCreate={() => setCreateOpen(true)} />}
      />

      {/* Create Question Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Create a new Question</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <QuestionForm
              onSuccess={() => {
                setCreateOpen(false);
                refetch();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
