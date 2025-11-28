"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { generateLessonSummary } from "@/app/actions/generateSummary";
import { motion, AnimatePresence } from "framer-motion";

interface VideoSummaryProps {
    videoUrl: string;
}

export function LessonSummary({ videoUrl }: VideoSummaryProps) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSummarize = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await generateLessonSummary(videoUrl);
            if (result.success && result.summary) {
                setSummary(result.summary);
            } else {
                setError(result.error || "Failed to generate summary");
            }
        } catch (err) {
            setError("Sorry, something went wrong while generating the summary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            {!summary && !loading && (
                <Button
                    onClick={handleSummarize}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300 group"
                >
                    <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                    Summarize this video
                </Button>
            )}

            {loading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating summary...</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <AnimatePresence>
                {summary && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-950 dark:to-indigo-950/10 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                    <Sparkles className="h-5 w-5" />
                                    AI Video Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground">
                                    <div className="whitespace-pre-wrap leading-relaxed">
                                        {summary}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
