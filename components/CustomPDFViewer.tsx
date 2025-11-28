"use client";

import { useEffect, useState } from "react";
import { Download, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomPDFViewerProps {
    url: string;
    title?: string;
    // keep flag but you should pass false if you want to block download
    allowDownload?: boolean;
}

export default function CustomPDFViewer({
    url,
    title,
    allowDownload = false,
}: CustomPDFViewerProps) {
    const [scale, setScale] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 🔒 Block Ctrl+P / Cmd+P and PrintScreen (best-effort)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+P / Cmd+P
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
                e.preventDefault();
                e.stopPropagation();
                alert("Printing is disabled for this protected document.");
            }

            // PrintScreen key (some browsers will still ignore this)
            if (e.key === "PrintScreen") {
                e.preventDefault();
                e.stopPropagation();
                // Optional: you could also briefly hide content here
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleDownload = () => {
        if (allowDownload && url) {
            window.open(url, "_blank");
        }
    };

    const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2));
    const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

    return (
        <div
            id="protected-pdf-viewer"
            className={
                "flex flex-col gap-4 w-full transition-all duration-300 " +
                (isFullscreen
                    ? "fixed inset-0 z-[100] bg-slate-900/90 p-4 md:p-6"
                    : "")
            }
            // 🔒 Block right-click on our app area
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                    {title && (
                        <h2 className="text-base md:text-lg font-semibold tracking-tight">
                            {title}
                        </h2>
                    )}
                    <p className="text-xs md:text-sm text-muted-foreground">
                        Secured PDF viewer • Watermarked by{" "}
                        <span className="font-semibold">math4code</span>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={zoomOut}
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-medium w-10 text-center">
                            {Math.round(scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={zoomIn}
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Fullscreen toggle */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={toggleFullscreen}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Download button – only if you REALLY want to allow it */}
                    {allowDownload && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1"
                            onClick={handleDownload}
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Viewer container */}
            <div
                className={
                    "relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 overflow-hidden " +
                    (isFullscreen ? "flex-1" : "min-h-[450px] md:min-h-[550px]")
                }
            >
                {/* Background gradient */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.10),_transparent_55%)]" />

                {/* PDF viewport with scaling */}
                <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 md:p-6">
                    <div
                        className="relative shadow-2xl rounded-lg overflow-hidden bg-white origin-top"
                        style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "top center",
                            minWidth: "70%",
                        }}
                    >
                        {/* The actual PDF, via iframe */}
                        <iframe
                            // toolbar=0 & navpanes=0 -> hides default PDF viewer UI (download/print buttons)
                            src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
                            className="w-[800px] max-w-full h-[1000px] border-none"
                            title={title ?? "PDF Document"}
                        />

                        {/* Watermark overlay */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 opacity-[0.11]">
                                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.08),_transparent_60%)]" />
                            </div>

                            {/* Big diagonal brand text */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                <div className="text-5xl md:text-7xl font-extrabold tracking-[0.3em] uppercase text-slate-900/5 dark:text-white/5 -rotate-30 select-none">
                                    math4code
                                </div>
                            </div>

                            {/* Repeated small watermarks */}
                            <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-6 opacity-30">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-center rotate-[-18deg]"
                                    >
                                        <span className="text-xs md:text-sm font-semibold tracking-widest text-slate-500/70">
                                            math4code • do not share
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom subtle bar */}
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
