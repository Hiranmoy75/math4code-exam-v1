// components/ConceptCard.tsx
import React from "react";
import type { ReactNode } from "react";

type Variant = "emerald" | "indigo" | "amber" | "rose";

interface ConceptCardProps {
    title?: string;
    subtitle?: string;
    children?: ReactNode;
    /**
     * Pass icon as a React node (e.g. <Video />). This is serializable when rendered
     * from a Server Component because it's just JSX that will be rendered on the server.
     */
    icon?: ReactNode;
    contentType?: string;
    variant?: Variant;
    className?: string;
    /**
     * If true, the UI will show a copy button visually.
     * NOTE: this component does not implement clipboard behavior (no client JS).
     * Use ConceptCardClientWrapper to add client-side copy functionality.
     */
    showCopyButton?: boolean;
    copyButtonLabel?: string;
    ariaLabel?: string;
}

const variants: Record<Variant, Record<string, string>> = {
    emerald: {
        wrapper:
            "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200/60 dark:border-emerald-800/60",
        iconBg: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        title: "text-emerald-950 dark:text-emerald-100",
        text: "text-emerald-800/80 dark:text-emerald-200/80",
        button: "hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400",
        glow: "bg-emerald-500/20",
    },
    indigo: {
        wrapper:
            "from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-200/60 dark:border-indigo-800/60",
        iconBg: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
        title: "text-indigo-950 dark:text-indigo-100",
        text: "text-indigo-800/80 dark:text-indigo-200/80",
        button: "hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
        glow: "bg-indigo-500/20",
    },
    amber: {
        wrapper:
            "from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-200/60 dark:border-amber-800/60",
        iconBg: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
        title: "text-amber-950 dark:text-amber-100",
        text: "text-amber-800/80 dark:text-amber-200/80",
        button: "hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-600 dark:text-amber-400",
        glow: "bg-amber-500/20",
    },
    rose: {
        wrapper:
            "from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 border-rose-200/60 dark:border-rose-800/60",
        iconBg: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
        title: "text-rose-950 dark:text-rose-100",
        text: "text-rose-800/80 dark:text-rose-200/80",
        button: "hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400",
        glow: "bg-rose-500/20",
    },
};

export default function ConceptCard({
    title = "Key Concept",
    subtitle,
    children,
    icon,
    contentType = "text",
    variant,
    className = "",
    showCopyButton = false,
    copyButtonLabel = "Copy",
    ariaLabel,
}: ConceptCardProps) {
    const activeVariant: Variant = (variant ?? (contentType === "video" ? "rose" : contentType === "pdf" ? "amber" : contentType === "success" ? "emerald" : "indigo")) as Variant;

    const style = variants[activeVariant] ?? variants.indigo;

    return (
        <div
            className={`relative group overflow-hidden rounded-2xl border bg-gradient-to-br ${style.wrapper} p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 ${className}`}
            role="region"
            aria-label={ariaLabel ?? `${title} card`}
        >
            <div
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${style.glow} pointer-events-none`}
                aria-hidden
            />

            <div className="relative flex items-start gap-4 sm:gap-5">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.iconBg} shadow-sm ring-1 ring-inset ring-black/5 dark:ring-white/5 transition-transform duration-300 group-hover:scale-110`}
                    aria-hidden
                >
                    {icon ?? null}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex flex-col overflow-hidden">
                            <span className={`text-[10px] uppercase tracking-wider font-bold opacity-60 ${style.text} truncate`}>
                                {contentType} Resource
                            </span>
                            <h3 className={`font-bold text-lg leading-tight tracking-tight ${style.title} truncate`}>
                                {title}
                            </h3>
                            {subtitle && <span className={`text-sm ${style.text} truncate`}>{subtitle}</span>}
                        </div>

                        {showCopyButton ? (
                            // visually show a copy button; this button is inert in server context.
                            <button
                                type="button"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${style.button}`}
                                aria-label="Copy (client functionality not attached)"
                                title="Copy (client-only)"
                            // No onClick here: this is server-safe presentational button.
                            >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M16 4H8a2 2 0 0 0-2 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="hidden sm:inline">{copyButtonLabel}</span>
                            </button>
                        ) : null}
                    </div>

                    <div className={`text-sm sm:text-base leading-relaxed ${style.text}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
