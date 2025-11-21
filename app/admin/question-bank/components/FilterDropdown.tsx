"use client";

import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Pill } from "@/components/question-bank/ui";

interface FilterOption {
    value: string;
    label: string;
    color?: string;
}

interface FilterDropdownProps {
    currentFilters: {
        subject: string;
        difficulty: string;
        qtype: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onRefresh: () => void;
}

const subjects: FilterOption[] = [
    { value: "all", label: "ALL" },
    { value: "math", label: "MATH" },
    { value: "cs", label: "CS" },
    { value: "physics", label: "PHYSICS" },
];

const difficulties: FilterOption[] = [
    { value: "all", label: "ALL", color: "gray" },
    { value: "easy", label: "EASY", color: "mint" },
    { value: "medium", label: "MEDIUM", color: "amber" },
    { value: "hard", label: "HARD", color: "red" },
];

const types: FilterOption[] = [
    { value: "all", label: "ALL", color: "gray" },
    { value: "MCQ", label: "MCQ", color: "violet" },
    { value: "MSQ", label: "MSQ", color: "pink" },
    { value: "NAT", label: "NAT", color: "mint" },
];

export function FilterDropdown({ currentFilters, onFilterChange, onRefresh }: FilterDropdownProps) {
    const getActiveFilterCount = () => {
        let count = 0;
        if (currentFilters.subject !== "all") count++;
        if (currentFilters.difficulty !== "all") count++;
        if (currentFilters.qtype !== "all") count++;
        return count;
    };

    const activeCount = getActiveFilterCount();

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="relative">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filters
                        {activeCount > 0 && (
                            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    {/* Subject */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Subject
                    </div>
                    {subjects.map((s) => (
                        <DropdownMenuItem
                            key={s.value}
                            onClick={() => onFilterChange("subject", s.value)}
                            className="cursor-pointer"
                        >
                            <Pill
                                color={currentFilters.subject === s.value ? "blue" : "gray"}
                                className="mr-2"
                            >
                                {s.label}
                            </Pill>
                            {currentFilters.subject === s.value && (
                                <span className="ml-auto text-indigo-600">✓</span>
                            )}
                        </DropdownMenuItem>
                    ))}
                    <Separator className="my-2" />

                    {/* Difficulty */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Difficulty
                    </div>
                    {difficulties.map((d) => (
                        <DropdownMenuItem
                            key={d.value}
                            onClick={() => onFilterChange("difficulty", d.value)}
                            className="cursor-pointer"
                        >
                            <Pill color={d.color as any} className="mr-2">
                                {d.label}
                            </Pill>
                            {currentFilters.difficulty === d.value && (
                                <span className="ml-auto text-indigo-600">✓</span>
                            )}
                        </DropdownMenuItem>
                    ))}
                    <Separator className="my-2" />

                    {/* Type */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Question Type
                    </div>
                    {types.map((t) => (
                        <DropdownMenuItem
                            key={t.value}
                            onClick={() => onFilterChange("qtype", t.value)}
                            className="cursor-pointer"
                        >
                            <Pill color={t.color as any} className="mr-2">
                                {t.label}
                            </Pill>
                            {currentFilters.qtype === t.value && (
                                <span className="ml-auto text-indigo-600">✓</span>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
            </Button>
        </div>
    );
}
