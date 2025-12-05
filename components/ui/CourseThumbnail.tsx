import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";


interface CourseThumbnailProps {
    src?: string | null;
    title: string;
    category?: string;
    className?: string;
    priority?: boolean;
    variant?: "default" | "card";
}

export function CourseThumbnail({
    src,
    title,
    category,
    className,
    priority = false,
    variant = "default",
}: CourseThumbnailProps) {
    const isCard = variant === "card";

    // Base classes that apply to both
    const baseClasses = "relative overflow-hidden bg-slate-100 dark:bg-slate-800";

    // Default variant specific classes (standalone card look)
    const defaultClasses = "aspect-video rounded-2xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1";

    // Card variant specific classes (fills parent, no external styles)
    const cardClasses = "w-full h-full";

    // If valid thumbnail exists, show it normally
    if (src) {
        return (
            <div
                className={cn(
                    baseClasses,
                    isCard ? cardClasses : defaultClasses,
                    className
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image
                    src={src}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    priority={priority}
                />
            </div>
        );
    }

    // Gradient Based on Title Hash
    const gradients = [
        "from-indigo-500 via-blue-600 to-sky-700",
        "from-emerald-400 via-green-600 to-teal-700",
        "from-orange-400 via-red-500 to-rose-600",
        "from-fuchsia-500 via-purple-600 to-indigo-700",
        "from-cyan-400 via-blue-600 to-slate-700",
    ];

    const safeTitle = title || "Untitled Course";
    const hash = [...safeTitle].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const gradientIndex = hash % gradients.length;
    const selectedGradient = gradients[gradientIndex];

    return (
        <div
            className={cn(
                "relative overflow-hidden bg-gradient-to-br",
                selectedGradient,
                isCard ? "w-full h-full" : "w-full aspect-video rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                className
            )}
        >
            {/* Glow Blobs */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-white/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-[-80px] right-[-40px] w-64 h-64 bg-black/20 blur-3xl rounded-full pointer-events-none" />

            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <circle cx="80%" cy="20%" r="100" fill="white" fillOpacity="0.1" />
                    <circle cx="10%" cy="90%" r="60" fill="white" fillOpacity="0.1" />
                </svg>
            </div>

            {/* Subtle Math Pattern */}
            <div className="absolute inset-0 opacity-15">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="pattern" width="36" height="36" patternUnits="userSpaceOnUse">
                            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="white" strokeWidth="0.8" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pattern)" />
                </svg>
            </div>

            {/* Glass Effect Overlay */}
            <div className="absolute inset-[12px] rounded-2xl bg-white/10 backdrop-blur-lg flex flex-col justify-between p-4">

                {/* Top Row: Category + Logo */}
                <div className="flex items-start justify-between">
                    {category && (
                        <span className="text-white/90 text-[10px] tracking-widest uppercase rounded-full px-2 py-1 bg-white/15 backdrop-blur-sm">
                            {category}
                        </span>
                    )}

                    {/* ✨ Premium Math4Code Text Logo */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white font-extrabold text-xs tracking-widest drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                        Math4Code
                    </div>
                </div>

                {/* Title */}
                <div className="flex items-end justify-between">
                    <h3 className="text-lg md:text-xl font-bold text-white leading-tight line-clamp-3 drop-shadow-md">
                        {safeTitle}
                    </h3>

                    <span className="text-5xl text-white/20 font-serif italic select-none">∫</span>
                </div>
            </div>
        </div>
    );
}
