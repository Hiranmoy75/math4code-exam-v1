"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
    title?: string;
    message?: string;
}

export function ErrorFallback({
    error,
    resetError,
    title = "Oops! Something went wrong",
    message = "We encountered an unexpected error. Please try again.",
}: ErrorFallbackProps) {
    const router = useRouter();

    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>

                {error && process.env.NODE_ENV === "development" && (
                    <details className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-left">
                        <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Error Details (Development Only)
                        </summary>
                        <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                            {error.message}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                <div className="flex gap-3 justify-center">
                    {resetError && (
                        <button
                            onClick={resetError}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => router.push("/")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    );
}
