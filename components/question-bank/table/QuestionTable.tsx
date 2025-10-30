"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { motion, AnimatePresence } from "framer-motion"
import { cardGlass } from "../ui"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[]        // optional now
  page: number
  pages: number
  onPageChange: (p: number) => void
  loading?: boolean
  empty?: React.ReactNode
}

export function QuestionTable<TData, TValue>({
  columns,
  data = [],     // ✅ safe default
  page,
  pages,
  onPageChange,
  loading,
  empty,
}: DataTableProps<TData, TValue>) {
  const safeData = Array.isArray(data) ? data : [] // double safety

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className={`${cardGlass}`}>
      <div className="overflow-x-auto rounded-3xl">
        <Table>
          <TableHeader className="bg-slate-50/70 dark:bg-slate-800/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-600 dark:text-slate-300"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <AnimatePresence initial={false}>
              {!loading && safeData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="p-8">{empty}</div>
                  </TableCell>
                </TableRow>
              )}

              {loading &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`}>
                    {columns.map((_, i) => (
                      <TableCell key={i}>
                        <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading &&
                table.getRowModel().rows.map((r) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="border-b hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    {r.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end p-3">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.max(1, page - 1))
                }}
              />
            </PaginationItem>
            <div className="px-3 text-sm text-slate-600 dark:text-slate-300">
              Page <span className="font-semibold">{page}</span> / {pages}
            </div>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(Math.min(pages, page + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
