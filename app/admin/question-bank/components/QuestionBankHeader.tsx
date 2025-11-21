"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionBankHeaderProps {
    onCreateClick: () => void;
    onImportClick: () => void;
    totalQuestions?: number;
}

export function QuestionBankHeader({
    onCreateClick,
    onImportClick,
    totalQuestions = 0
}: QuestionBankHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 shadow-xl"
        >
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
            <motion.div
                className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-yellow-300" />
                        <h1 className="text-3xl font-bold text-white md:text-4xl">
                            Question Bank
                        </h1>
                    </div>
                    <p className="text-lg text-white/90">
                        Manage and organize your question collection
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/80">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            <span>{totalQuestions} Total Questions</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="lg"
                        onClick={onImportClick}
                        className="bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Upload className="mr-2 h-5 w-5" />
                        Import
                    </Button>

                    <Button
                        size="lg"
                        onClick={onCreateClick}
                        className="bg-white text-indigo-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Create Question
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
