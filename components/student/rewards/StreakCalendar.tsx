"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, subMonths, addMonths } from "date-fns";

interface StreakCalendarProps {
    streakHistory: string[]; // Array of ISO date strings (YYYY-MM-DD)
    currentStreak: number;
    longestStreak: number;
}

export default function StreakCalendar({ streakHistory, currentStreak, longestStreak }: StreakCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Normalize history dates to local date strings for comparison
    const activeDates = new Set(streakHistory.map(date => new Date(date).toDateString()));

    return (
        <Card className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            Learning Streak
                        </CardTitle>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Keep it up to achieve your goals!</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Stats */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 flex items-center justify-between relative overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-8 relative z-10">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Current</p>
                            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{currentStreak} days</p>
                        </div>
                        <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Longest</p>
                            <p className="text-2xl font-bold text-slate-700 dark:text-white">{longestStreak} days</p>
                        </div>
                    </div>

                    {/* Decorative Flame */}
                    <div className="absolute right-0 bottom-0 opacity-10 dark:opacity-20 transform translate-x-4 translate-y-4">
                        <div className="bg-orange-500 rounded-full p-4 blur-xl">
                            <Flame className="w-16 h-16 text-orange-200" />
                        </div>
                    </div>
                    <div className="relative z-10 bg-white dark:bg-slate-800 rounded-full p-3 border-4 border-slate-100 dark:border-slate-700 shadow-sm">
                        <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
                    </div>
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                    <span className="font-bold text-lg">{format(currentMonth, "MMMM yyyy")}</span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-xs font-bold text-slate-400 dark:text-slate-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day, idx) => {
                        const isActive = activeDates.has(day.toDateString());
                        const isCurrentDay = isToday(day);

                        // Add offset for first day of month
                        const style = idx === 0 ? { gridColumnStart: day.getDay() + 1 } : {};

                        return (
                            <div
                                key={day.toString()}
                                style={style}
                                className="aspect-square flex items-center justify-center relative"
                            >
                                {isActive ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 dark:shadow-blue-500/30"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </motion.div>
                                ) : (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
                                        ${isCurrentDay
                                            ? "border-2 border-indigo-600 dark:border-blue-500 text-indigo-600 dark:text-blue-400 font-bold"
                                            : "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50"}
                                    `}>
                                        {/* Only show day number if not active (active shows checkmark) */}
                                        {!isActive && format(day, "d")}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
