"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";

import { pageBg, cardGlass } from "@/components/question-bank/ui";
import EmptyState from "@/components/question-bank/EmptyState";
import { QuestionTable } from "@/components/question-bank/table/QuestionTable";
import { columns as makeColumns } from "@/components/question-bank/table/columns";
import { ImportQuestionsDialog } from "./ImportQuestions";

import { useCurrentAdmin } from "@/hooks/admin/question-bank/useCurrentAdmin";
import { useQuestions } from "@/hooks/admin/question-bank/useQuestions";
import { useDeleteQuestion } from "@/hooks/admin/question-bank/useDeleteQuestion";

// New components
import { QuestionBankHeader } from "./components/QuestionBankHeader";
import { SearchBar } from "./components/SearchBar";
import { ActiveFilters } from "./components/ActiveFilters";
import { FilterDropdown } from "./components/FilterDropdown";

const QuestionForm = dynamic(
  () => import("@/components/question-bank/QuestionForm"),
  { ssr: false }
);

export default function QuestionBankPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Local filter state
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

  // Fetch questions with current filters
  const { data, isLoading, refetch } = useQuestions(filters);

  // Handlers
  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
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

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const columns = makeColumns(async (id: string) => {
    await deleteQuestion(id);
  });

  return (
    <div className={`min-h-screen space-y-6 p-4 md:p-6 ${pageBg}`}>
      {/* Premium Header */}
      <QuestionBankHeader
        onCreateClick={() => setCreateOpen(true)}
        onImportClick={() => setImportOpen(true)}
        totalQuestions={data?.total ?? 0}
      />

      {/* Toolbar Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className={`${cardGlass} border-slate-200 dark:border-slate-800`}>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search and Filters Row */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SearchBar
                  value={filters.search}
                  onChange={handleSearchChange}
                  onSearch={refetch}
                  placeholder="Search question text..."
                />

                <FilterDropdown
                  currentFilters={{
                    subject: filters.subject,
                    difficulty: filters.difficulty,
                    qtype: filters.qtype,
                  }}
                  onFilterChange={setFilter}
                  onRefresh={refetch}
                />
              </div>

              {/* Active Filters Chips */}
              <ActiveFilters filters={filters} onClearFilter={clearFilter} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Questions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <QuestionTable
          columns={columns}
          data={data?.rows ?? []}
          page={filters.page}
          pages={data?.pages ?? 1}
          onPageChange={onPageChange}
          loading={isLoading}
          empty={<EmptyState onCreate={() => setCreateOpen(true)} />}
        />
      </motion.div>

      {/* Create Question Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Create a New Question</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <QuestionForm
              onSuccess={() => {
                setCreateOpen(false);
                refetch();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Import Questions Dialog */}
      {adminId && (
        <ImportQuestionsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          adminId={adminId}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
