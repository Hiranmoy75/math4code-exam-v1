import { CommunityChannel } from "@/types/community";
import { Hash, Volume2, HelpCircle, MessageSquare, X, ChevronDown, ChevronRight, Bookmark, AtSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CourseThumbnail } from "@/components/ui/CourseThumbnail";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EnrolledCourseWithChannels } from "@/hooks/community/useEnrolledCourses";
import { useMentions, useBookmarkedMessages } from "@/hooks/community";

interface ChannelSidebarProps {
    channels: CommunityChannel[];
    activeChannelId: string | null;
    onSelectChannel: (channelId: string) => void;
    courseId: string;
    enrolledCourses: EnrolledCourseWithChannels[];
    isOpen: boolean;
    onClose: () => void;
    isAdmin?: boolean;
    onViewChange?: (view: 'channels' | 'mentions' | 'bookmarks') => void;
    onSelectCourse?: (courseId: string) => void;
}

export const ChannelSidebar = ({
    channels,
    activeChannelId,
    onSelectChannel,
    courseId,
    enrolledCourses,
    isOpen,
    onClose,
    isAdmin = false,
    onViewChange,
    onSelectCourse,
}: ChannelSidebarProps) => {
    const router = useRouter();
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set([courseId]));

    const getIcon = (type: string) => {
        switch (type) {
            case "announcement":
                return <Volume2 className="w-4 h-4" />;
            case "qa":
                return <HelpCircle className="w-4 h-4" />;
            default:
                return <Hash className="w-4 h-4" />;
        }
    };


    const toggleCourse = (id: string) => {
        const newExpanded = new Set(expandedCourses);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCourses(newExpanded);
    };

    // Toggle course expansion and handle selection
    const handleCourseClick = (id: string) => {
        onSelectCourse?.(id);
        toggleCourse(id);
    };

    // Auto-expand course when a channel from it is selected
    useEffect(() => {
        if (activeChannelId) {
            const channelCourse = enrolledCourses.find(course =>
                course.channels?.some(ch => ch.id === activeChannelId)
            );
            if (channelCourse && !expandedCourses.has(channelCourse.id)) {
                toggleCourse(channelCourse.id);
            }
        }
    }, [activeChannelId, enrolledCourses]);


    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "w-72 border-r border-slate-200/80 dark:border-slate-800/80 h-full flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 z-50 shadow-xl",
                    // Mobile: slide-in drawer
                    "fixed md:relative inset-y-0 left-0",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-blue-500/10 dark:from-emerald-500/5 dark:to-blue-500/5">
                    <h2 className="font-bold text-xl tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        Community
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {/* For You Section */}
                    <ForYouSection onViewChange={onViewChange} onClose={onClose} />

                    {/* All Channels Section */}
                    <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                            All Channels
                        </div>
                        <div className="space-y-2">
                            {enrolledCourses.map((course) => {
                                const isExpanded = expandedCourses.has(course.id);
                                // Check if this course contains the active channel
                                const isActive = course.channels?.some(ch => ch.id === activeChannelId) || false;

                                return (
                                    <div key={course.id} className="space-y-1">
                                        {/* Course Header */}
                                        <div
                                            className={cn(
                                                "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-200",
                                                isActive
                                                    ? "bg-gradient-to-r from-emerald-500/15 to-blue-500/15 dark:from-emerald-500/10 dark:to-blue-500/10 shadow-sm"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <button
                                                onClick={() => toggleCourse(course.id)}
                                                className="shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                                )}
                                            </button>
                                            <div
                                                onClick={() => handleCourseClick(course.id)}
                                                className="flex items-center gap-3 flex-1 min-w-0"
                                            >
                                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-md">
                                                    <CourseThumbnail
                                                        src={course.thumbnail_url}
                                                        title={course.title}
                                                        variant="card"
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-semibold truncate",
                                                    isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    {course.title}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Course Channels */}
                                        {isExpanded && (
                                            <div className="ml-8 mt-1 space-y-0.5">
                                                {course.channels.map((channel) => (
                                                    <button
                                                        key={channel.id}
                                                        onClick={() => onSelectChannel(channel.id)}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative",
                                                            activeChannelId === channel.id
                                                                ? "bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm"
                                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                                                        )}
                                                    >
                                                        {activeChannelId === channel.id && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full" />
                                                        )}
                                                        <span className={cn(
                                                            "shrink-0",
                                                            activeChannelId === channel.id
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                                        )}>
                                                            {getIcon(channel.type)}
                                                        </span>
                                                        <span className="truncate">{channel.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// For You Section Component
const ForYouSection = ({
    onViewChange,
    onClose
}: {
    onViewChange?: (view: 'channels' | 'mentions' | 'bookmarks') => void;
    onClose: () => void;
}) => {
    const { data: mentions = [] } = useMentions();
    const { data: bookmarks = [] } = useBookmarkedMessages();

    const handleNavigation = (view: 'mentions' | 'bookmarks') => {
        if (onViewChange) {
            onViewChange(view);
            onClose();
        }
    };

    return (
        <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">
                For You
            </div>
            <div className="space-y-1">
                <button
                    onClick={() => handleNavigation('mentions')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent dark:hover:from-blue-900/20 group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <AtSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold">Mentions</span>
                    {mentions.length > 0 && (
                        <span className="ml-auto text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {mentions.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => handleNavigation('bookmarks')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent dark:hover:from-amber-900/20 group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Bookmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="font-semibold">Bookmarks</span>
                    {bookmarks.length > 0 && (
                        <span className="ml-auto text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                            {bookmarks.length}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
};

