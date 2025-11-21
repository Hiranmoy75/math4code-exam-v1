"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Pill } from "@/components/question-bank/ui";

interface FilterChip {
    key: string;
    label: string;
    value: string;
    color: "blue" | "mint" | "amber" | "red" | "violet" | "pink" | "gray";
}

interface ActiveFiltersProps {
    filters: {
        subject: string;
        difficulty: string;
        qtype: string;
        search: string;
    };
    onClearFilter: (key: string) => void;
}

export function ActiveFilters({ filters, onClearFilter }: ActiveFiltersProps) {
    const activeFilters: FilterChip[] = [];

    if (filters.subject !== "all") {
        activeFilters.push({
            key: "subject",
            label: "Subject",
            value: filters.subject,
            color: "blue",
        });
    }

    if (filters.difficulty !== "all") {
        activeFilters.push({
            key: "difficulty",
            label: "Difficulty",
            value: filters.difficulty,
            color:
                filters.difficulty === "easy"
                    ? "mint"
                    : filters.difficulty === "medium"
                        ? "amber"
                        : "red",
        });
    }

    if (filters.qtype !== "all") {
        activeFilters.push({
            key: "qtype",
            label: "Type",
            value: filters.qtype,
            color:
                filters.qtype === "MCQ"
                    ? "violet"
                    : filters.qtype === "MSQ"
                        ? "pink"
                        : "mint",
        });
    }

    if (filters.search) {
        activeFilters.push({
            key: "search",
            label: "Query",
            value: `"${filters.search}"`,
            color: "gray",
        });
    }

    if (activeFilters.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2"
        >
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Filters:
            </span>
            <AnimatePresence mode="popLayout">
                {activeFilters.map((filter) => (
                    <motion.div
                        key={filter.key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Pill color={filter.color} className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                                {filter.label}: {filter.value}
                            </span>
                            <button
                                onClick={() => onClearFilter(filter.key)}
                                className="text-xs hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Pill>
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
