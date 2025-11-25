"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PremiumLoaderProps {
    text?: string;
    size?: "sm" | "md" | "lg";
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
    text = "Loading...",
    size = "md"
}) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            <div className="relative">
                {/* Animated background circles */}
                <motion.div
                    className="absolute inset-0 -m-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute top-0 left-0 w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            x: [0, 20, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute bottom-0 right-0 w-40 h-40 bg-violet-200/40 rounded-full blur-2xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            x: [0, -20, 0],
                            y: [0, 20, 0],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </motion.div>

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-slate-200/50"
                >
                    <div className="flex flex-col items-center gap-6">
                        {/* Animated logo/icon */}
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                className={`${sizeClasses[size]} text-indigo-600`}
                            >
                                <Loader2 className="w-full h-full" />
                            </motion.div>

                            {/* Pulsing ring */}
                            <motion.div
                                className="absolute inset-0 -m-2 rounded-full border-2 border-indigo-400/30"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.2, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        </div>

                        {/* Text */}
                        <div className="text-center space-y-2">
                            <motion.h3
                                className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                {text}
                            </motion.h3>

                            {/* Loading dots */}
                            <div className="flex items-center justify-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 bg-indigo-600 rounded-full"
                                        animate={{
                                            y: [0, -8, 0],
                                            opacity: [0.5, 1, 0.5],
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                            ease: "easeInOut",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-indigo-400/40 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
