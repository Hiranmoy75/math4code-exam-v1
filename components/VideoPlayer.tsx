"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
    Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
    Maximize, Minimize, PlayCircle, Loader2, Settings, Info
} from "lucide-react";
import { awardCoins } from "@/app/actions/rewardActions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLessonContext } from "@/context/LessonContext";

// Dynamically import ReactPlayer to avoid hydration errors
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

interface VideoPlayerProps {
    url: string;
    className?: string;
    thumbUrl?: string;
}

const extractYouTubeId = (s?: string | null) => {
    if (!s) return null;
    const str = s.trim();
    const idMatch = str.match(/^[\w-]{11}$/);
    if (idMatch) return idMatch[0];
    const qMatch = str.match(/[?&]v=([\w-]{11})/);
    if (qMatch) return qMatch[1];
    const shortMatch = str.match(/youtu\.be\/([\w-]{11})/);
    if (shortMatch) return shortMatch[1];
    const embMatch = str.match(/embed\/([\w-]{11})/);
    if (embMatch) return embMatch[1];
    return null;
};

function loadYouTubeIframeAPI(): Promise<void> {
    return new Promise((resolve) => {
        if ((window as any).YT && (window as any).YT.Player) return resolve();
        if (document.getElementById("youtube-iframe-api")) {
            const interval = setInterval(() => {
                if ((window as any).YT && (window as any).YT.Player) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
            return;
        }
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
        (window as any).onYouTubeIframeAPIReady = () => resolve();
    });
}

export default function VideoPlayer({ url, className = "", thumbUrl }: VideoPlayerProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const progressContainerRef = useRef<HTMLDivElement | null>(null);
    const ytRef = useRef<any>(null);
    const rpRef = useRef<any>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [mounted, setMounted] = useState(false);
    const [usingYouTube, setUsingYouTube] = useState(false);
    const [youtubeId, setYoutubeId] = useState<string | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isPlayingState, setIsPlayingState] = useState(false);
    const [showCover, setShowCover] = useState(true);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [sliderValue, setSliderValue] = useState<number>(0);
    const [seeking, setSeeking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [rewarded, setRewarded] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Make lesson context optional - it may not exist in admin builder
    let markComplete: (() => void) | null = null;
    try {
        const context = useLessonContext();
        markComplete = context.markComplete;
    } catch (error) {
        // Context not available (e.g., in admin builder), that's okay
        markComplete = null;
    }

    // Missing state variables
    const [showControls, setShowControls] = useState(true);
    const [showQualityModal, setShowQualityModal] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [selectedQuality, setSelectedQuality] = useState("auto");
    const [qualityOptions, setQualityOptions] = useState<string[]>([]);
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const updateQualityOptions = (target: any) => {
        try {
            if (typeof target.getAvailableQualityLevels === 'function') {
                const levels = target.getAvailableQualityLevels();
                if (levels && levels.length > 0) {
                    setQualityOptions(levels);
                }
            }
        } catch (e) { }
    };

    useEffect(() => {
        setMounted(true);
        const yId = extractYouTubeId(url);
        if (yId) {
            setUsingYouTube(true);
            setYoutubeId(yId);
        } else {
            setUsingYouTube(false);
            setYoutubeId(null);
        }
    }, [url]);

    useEffect(() => {
        const getUser = async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, []);

    const startHideControlsTimer = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        if (isPlayingState && !showQualityModal && !showSpeedMenu) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSpeedMenu(false); setShowQualityModal(false);
            }, 3000);
        }
    }, [isPlayingState, showQualityModal, showSpeedMenu]);

    const handleMouseMove = () => { setShowControls(true); startHideControlsTimer(); };
    const handleMouseLeave = () => { if (isPlayingState && !showQualityModal && !showSpeedMenu) setShowControls(false); };

    useEffect(() => {
        if (isPlayingState) startHideControlsTimer();
        else { setShowControls(true); if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); }
    }, [isPlayingState, startHideControlsTimer]);

    useEffect(() => {
        let pollTimer: number | null = null;
        const initYT = async () => {
            if (!usingYouTube || !youtubeId || !containerRef.current) return;
            try { await loadYouTubeIframeAPI(); } catch { setErrorMsg("Load Error"); return; }
            if (ytRef.current) { try { ytRef.current.destroy(); } catch { } ytRef.current = null; }

            containerRef.current.innerHTML = "";
            const el = document.createElement("div");
            el.id = `yt - player - ${youtubeId} -${Date.now()} `;
            el.style.width = "100%"; el.style.height = "100%";
            el.style.pointerEvents = "none";
            containerRef.current.appendChild(el);

            ytRef.current = new (window as any).YT.Player(el.id, {
                videoId: youtubeId,
                playerVars: {
                    controls: 0, modestbranding: 1, rel: 0, disablekb: 1,
                    iv_load_policy: 3, showinfo: 0, playsinline: 1, enablejsapi: 1,
                    origin: typeof window !== "undefined" ? window.location.origin : undefined,
                },
                events: {
                    onReady: (ev: any) => {
                        setIsReady(true);
                        try { const d = ev.target.getDuration(); if (d > 0) setDuration(d); } catch { }
                        updateQualityOptions(ev.target);
                        pollTimer = window.setInterval(() => {
                            if (seeking) return;
                            try {
                                const t = ev.target.getCurrentTime?.() || 0;
                                const d = ev.target.getDuration?.() || duration || 0;
                                setCurrentTime(t);
                                if (d > 0) { setDuration(d); setSliderValue(t / d); }
                            } catch { }
                        }, 250) as unknown as number;
                    },
                    onStateChange: (e: any) => {
                        const s = e.data;
                        if (s === 1) {
                            setIsPlayingState(true); setIsPaused(false); setShowCover(false);
                            updateQualityOptions(e.target);
                        } else if (s === 2 || s === 0) {
                            setIsPlayingState(false); setIsPaused(true);
                        }
                    },
                    onError: () => { setErrorMsg("Error"); setIsReady(true); }
                },
            });
        };
        if (usingYouTube) initYT();
        return () => { if (pollTimer) clearInterval(pollTimer); if (ytRef.current) { try { ytRef.current.destroy(); } catch { } } };
    }, [usingYouTube, youtubeId]);

    const onRPReady = () => { setIsReady(true); try { const d = rpRef.current?.getDuration(); if (d > 0) setDuration(d); } catch { } };

    const onRPProgress = async (state: any) => {
        if (!seeking) {
            setSliderValue(state.played);
            setCurrentTime(state.playedSeconds);

            // Reward Logic
            if (!rewarded && userId && state.played > 0.8) {
                setRewarded(true);
                const res = await awardCoins(userId, 'video_watch', url, `Watched video: ${url} `);
                if (res.success && res.message) {
                    toast.success(res.message, { icon: "🪙" });
                }
                // Mark lesson complete via context (if available)
                if (markComplete) {
                    markComplete();
                }
            }
        }
    };
    const onRPPause = () => { setIsPlayingState(false); setIsPaused(true); };
    const onRPPlay = () => { setIsPlayingState(true); setIsPaused(false); setShowCover(false); };

    const sendYTCommand = useCallback((func: string, args: any[] = []) => {
        if (!usingYouTube) return;
        try { if (ytRef.current && typeof ytRef.current[func] === 'function') return ytRef.current[func](...args); } catch { }
        try { const iframe = containerRef.current?.querySelector("iframe"); iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*"); } catch { }
    }, [usingYouTube]);

    const handlePlay = useCallback(() => {
        if (usingYouTube) sendYTCommand("playVideo"); else setIsPlayingState(true);
        setIsPaused(false); setShowQualityModal(false); setShowSpeedMenu(false);
    }, [usingYouTube, sendYTCommand]);

    const handlePause = useCallback(() => {
        if (usingYouTube) sendYTCommand("pauseVideo"); else setIsPlayingState(false);
        setIsPaused(true);
    }, [usingYouTube, sendYTCommand]);

    const togglePlay = useCallback(() => isPlayingState ? handlePause() : handlePlay(), [isPlayingState, handlePause, handlePlay]);

    const seekToFraction = useCallback((fraction: number) => {
        const d = duration || (usingYouTube ? ytRef.current?.getDuration() : rpRef.current?.getDuration()) || 0;
        if (d <= 0) return;
        const secs = fraction * d;
        if (usingYouTube) sendYTCommand("seekTo", [secs, true]);
        else rpRef.current?.seekTo(fraction, "fraction");

        setCurrentTime(secs);
        setSliderValue(fraction);
        handlePlay();
        startHideControlsTimer();
    }, [duration, usingYouTube, sendYTCommand, handlePlay, startHideControlsTimer]);

    /* --- CLICK-TO-SEEK LOGIC --- */
    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressContainerRef.current) return;
        const rect = progressContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const fraction = Math.max(0, Math.min(1, clickX / rect.width));

        setSeeking(false);
        seekToFraction(fraction);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(parseFloat(e.target.value));
        startHideControlsTimer();
    };

    const handleSliderEnd = (e: React.MouseEvent | React.TouchEvent) => {
        setSeeking(false);
        seekToFraction(parseFloat((e.currentTarget as HTMLInputElement).value));
    };

    const toggleMute = useCallback(() => { if (usingYouTube) sendYTCommand(muted ? "unMute" : "mute"); setMuted(p => !p); }, [usingYouTube, sendYTCommand, muted]);
    const rewind = useCallback(() => { const d = duration || 1; const t = Math.max(0, currentTime - 10); seekToFraction(t / d); setShowControls(true); }, [currentTime, duration, seekToFraction]);
    const fastForward = useCallback(() => { const d = duration || 1; const t = Math.min(d, currentTime + 10); seekToFraction(t / d); setShowControls(true); }, [currentTime, duration, seekToFraction]);

    const handleFullScreen = useCallback(async () => {
        if (!wrapperRef.current) return;
        try {
            if (document.fullscreenElement) { await document.exitFullscreen(); setIsFullScreen(false); }
            else { await (wrapperRef.current as any).requestFullscreen(); setIsFullScreen(true); }
        } catch { }
    }, []);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            setShowControls(true); startHideControlsTimer();
            switch (e.key) {
                case ' ': case 'k': case 'K': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': case 'l': case 'L': e.preventDefault(); fastForward(); break;
                case 'ArrowLeft': case 'j': case 'J': e.preventDefault(); rewind(); break;
                case 'f': case 'F': e.preventDefault(); handleFullScreen(); break;
                case 'm': case 'M': e.preventDefault(); toggleMute(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, fastForward, rewind, handleFullScreen, toggleMute, startHideControlsTimer]);

    useEffect(() => {
        const onFullscreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const changeQuality = (q: string) => { setSelectedQuality(q); setShowQualityModal(false); if (usingYouTube) { sendYTCommand("setPlaybackQuality", [q]); sendYTCommand("setPlaybackQualityRange", [q]); } };
    const changeSpeed = (s: number) => { setPlaybackRate(s); setShowSpeedMenu(false); if (usingYouTube) sendYTCommand("setPlaybackRate", [s]); };

    if (!mounted) return <div className="aspect-video bg-slate-900 rounded-xl"></div>;

    return (
        <div
            ref={wrapperRef}
            className={`relative w-full h-full bg-black group overflow-hidden rounded-xl shadow-2xl border border-slate-900 ${className} ${isFullScreen ? 'rounded-none border-none cursor-none' : ''} ${showControls ? 'cursor-auto' : ''} `}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="w-full h-full relative">
                <div ref={containerRef} className="w-full h-full bg-black" />
                {!usingYouTube && (
                    <ReactPlayer ref={rpRef} url={url} width="100%" height="100%" playing={isPlayingState} muted={muted} playbackRate={playbackRate} controls={false} onReady={onRPReady} onProgress={onRPProgress} onPause={onRPPause} onPlay={onRPPlay} config={{ file: { attributes: { controlsList: "nodownload" } } }} playsinline />
                )}
            </div>

            {!showCover && (<div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} onContextMenu={e => e.preventDefault()} />)}

            {/* BRANDING */}
            {usingYouTube && !showCover && (
                <>
                    <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} `} />
                    <div className={`absolute top-4 left-4 z-30 pointer-events-none flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} `}>
                        <div className="bg-blue-600 w-2 h-6 rounded-full"></div>
                        <span className="text-white font-bold tracking-wider text-sm shadow-black drop-shadow-md">MATH4CODE</span>
                    </div>
                    <div className={`absolute top-4 right-4 z-30 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} `}>
                        <div className="bg-white/10 p-2 rounded-full backdrop-blur-md"><Info size={20} className="text-white/80" /></div>
                    </div>
                </>
            )}

            {/* INITIAL COVER */}
            {showCover && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black cursor-pointer" style={{ backgroundImage: thumbUrl ? `url(${thumbUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} onClick={handlePlay}>
                    <div className={`absolute inset-0 ${thumbUrl ? 'bg-black/40' : 'bg-slate-900'} `}></div>
                    <div className="relative z-10 bg-white/10 p-5 rounded-full backdrop-blur-md border border-white/20 hover:scale-110 transition-transform shadow-2xl">
                        {(!isReady && youtubeId) ? <Loader2 className="w-16 h-16 text-white animate-spin" /> : <PlayCircle className="w-20 h-20 text-white" />}
                    </div>
                </div>
            )}

            {/* PAUSE OVERLAY */}
            {!showCover && isPaused && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300 pointer-events-none">
                    <div className="bg-white/10 p-5 rounded-full backdrop-blur-md shadow-2xl animate-in zoom-in-50"><Play className="w-12 h-12 text-white fill-white" /></div>
                </div>
            )}

            {errorMsg && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/90 text-white px-4 py-2 rounded-lg z-50 backdrop-blur-md">{errorMsg}</div>}

            {/* === CONTROLS === */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent pt-12 pb-4 px-3 sm:px-5 z-50 transition-all duration-300 pointer-events-auto ${showControls || !isPlayingState ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} `}
                onMouseEnter={() => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); setShowControls(true); }}
                onMouseLeave={startHideControlsTimer}
            >
                {/* SEEK BAR (Enhanced Hit Area) */}
                <div
                    ref={progressContainerRef}
                    className="relative group/slider h-6 flex items-center mb-1 cursor-pointer"
                    onClick={handleProgressBarClick}
                >
                    {/* Background Line */}
                    <div className="absolute inset-0 h-1 top-2.5 bg-white/20 rounded-full group-hover/slider:h-1.5 transition-all pointer-events-none"></div>
                    {/* Progress Line */}
                    <div className="absolute left-0 top-2.5 h-1 bg-blue-500 rounded-full group-hover/slider:h-1.5 transition-all pointer-events-none" style={{ width: `${sliderValue * 100}% ` }}></div>

                    {/* Invisible Range Input for Dragging Only */}
                    <input
                        type="range" min={0} max={0.999999} step="any"
                        value={seeking ? sliderValue : (duration ? currentTime / duration : 0)}
                        onMouseDown={() => setSeeking(true)}
                        onTouchStart={() => setSeeking(true)}
                        onChange={handleSliderChange}
                        onMouseUp={handleSliderEnd}
                        onTouchEnd={handleSliderEnd}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    {/* Thumb */}
                    <div className="absolute h-3.5 w-3.5 top-2.5 bg-white border-2 border-blue-500 rounded-full -ml-1.5 -mt-[4px] shadow-lg scale-0 group-hover/slider:scale-100 transition-transform pointer-events-none" style={{ left: `${sliderValue * 100}% ` }}></div>
                </div>

                {/* BUTTONS ROW */}
                <div className="flex items-center justify-between text-white">
                    {/* LEFT SIDE CONTROLS */}
                    <div className="flex items-center gap-2 sm:gap-5">
                        <button onClick={togglePlay} className="hover:text-blue-400 transition-colors transform active:scale-90" title="Space">
                            {isPlayingState ? <Pause size={24} className="sm:w-7 sm:h-7" fill="currentColor" /> : <Play size={24} className="sm:w-7 sm:h-7" fill="currentColor" />}
                        </button>

                        {/* Hide Rewind/Forward on very small mobile screens to save space */}
                        <div className="hidden sm:flex items-center gap-3 text-white/80">
                            <button onClick={rewind} className="hover:text-white transition-colors hover:bg-white/10 p-1 rounded-full"><RotateCcw size={20} /></button>
                            <button onClick={fastForward} className="hover:text-white transition-colors hover:bg-white/10 p-1 rounded-full"><RotateCw size={20} /></button>
                        </div>

                        <button onClick={toggleMute} className="hover:text-white transition-colors ml-0 sm:ml-2">
                            {muted ? <VolumeX size={20} className="sm:w-6 sm:h-6" /> : <Volume2 size={20} className="sm:w-6 sm:h-6" />}
                        </button>

                        <div className="text-[10px] sm:text-xs font-mono text-white/60 whitespace-nowrap">
                            {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {duration ? new Date(duration * 1000).toISOString().substr(14, 5) : "00:00"}
                        </div>
                    </div>

                    {/* RIGHT SIDE CONTROLS */}
                    <div className="flex items-center gap-2 sm:gap-3 relative">
                        {/* Quality Button - Text hidden on mobile */}
                        <button onClick={() => { setShowQualityModal(s => !s); setShowSpeedMenu(false); }} className="hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all backdrop-blur-sm text-[10px] sm:text-xs font-semibold tracking-wide">
                            <Settings size={14} />
                            <span className="hidden sm:inline">{selectedQuality === 'auto' ? 'AUTO' : selectedQuality.toUpperCase()}</span>
                        </button>

                        {/* Speed Button */}
                        <button onClick={() => { setShowSpeedMenu(s => !s); setShowQualityModal(false); }} className="hover:text-white bg-white/10 hover:bg-white/20 border border-white/5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all backdrop-blur-sm text-[10px] sm:text-xs font-bold min-w-[2.5rem] sm:min-w-[3rem]">
                            {playbackRate}x
                        </button>

                        <button onClick={handleFullScreen} className="hover:text-white transition-colors hover:bg-white/20 p-1.5 sm:p-2 rounded-lg">
                            {isFullScreen ? <Minimize size={18} className="sm:w-5 sm:h-5" /> : <Maximize size={18} className="sm:w-5 sm:h-5" />}
                        </button>

                        {/* Popups (Speed/Quality) - Adjusted positioning */}
                        {(showQualityModal || showSpeedMenu) && (
                            <div className="absolute bottom-full mb-4 right-0 bg-slate-900/95 border border-white/10 text-white rounded-xl shadow-2xl p-2 w-28 sm:w-32 backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 origin-bottom-right">
                                <div className="max-h-[150px] sm:max-h-[200px] overflow-y-auto thin-scrollbar flex flex-col gap-1">
                                    {showQualityModal && (<><button className={`modal-btn ${selectedQuality === "auto" ? "active" : ""} `} onClick={() => changeQuality("auto")}>Auto</button>{qualityOptions.map(q => <button key={q} className={`modal-btn ${selectedQuality === q ? "active" : ""} `} onClick={() => changeQuality(q)}>{q.toUpperCase()}</button>)}</>)}
                                    {showSpeedMenu && speedOptions.map(s => (<button key={s} className={`modal-btn ${playbackRate === s ? "active" : ""} `} onClick={() => changeSpeed(s)}>{s}x</button>))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{` .modal-btn { @apply w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all hover:bg-white/10 text-white/70 hover:text-white; } .modal-btn.active { @apply bg-blue-600 text-white shadow-md; } .thin-scrollbar::-webkit-scrollbar { width: 3px; } .thin-scrollbar::-webkit-scrollbar-thumb { @apply bg-white/20 rounded-full; } `}</style>
        </div>
    );
}
