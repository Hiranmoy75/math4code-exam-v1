"use client";

import { useState, useEffect } from "react";
import { ChannelSidebar, MessageList, MessageInput } from "@/components/community";
import { useEnrolledCourses } from "@/hooks/community/useEnrolledCourses";
import { useAdminCoursesWithChannels } from "@/hooks/admin/useAdminCoursesWithChannels";
import { useMentions, useBookmarkedMessages } from "@/hooks/community";
import { MessageCard } from "@/components/community/MessageCard";
import { CommunitySettingsView } from "@/components/community/CommunitySettingsView";
import { Loader2, Menu, X, AtSign, Bookmark, Settings } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCommunityModal } from "@/context/CommunityModalContext";

type ViewType = 'channels' | 'mentions' | 'bookmarks' | 'settings';

export function CommunityModal() {
    const { isOpen, closeCommunity, options } = useCommunityModal();
    const { user, profile, loading: userLoading } = useUser();

    const isAdmin = options?.isAdmin || false;

    // Data fetching
    const { data: studentCourses, isLoading: studentLoading } = useEnrolledCourses(user?.id);
    const { data: adminCourses, isLoading: adminLoading } = useAdminCoursesWithChannels(user?.id);

    const enrolledCourses = isAdmin ? adminCourses : studentCourses;
    const coursesLoading = isAdmin ? adminLoading : studentLoading;

    const { data: mentions = [], isLoading: mentionsLoading } = useMentions();
    const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarkedMessages();

    const [activeView, setActiveView] = useState<ViewType>('channels');
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Get all channels from all enrolled courses
    const allChannels = enrolledCourses?.flatMap(course => course.channels || []) || [];
    // Only show active channels in the sidebar
    const visibleChannels = allChannels.filter(c => c.is_active);

    const activeChannel = allChannels.find(c => c.id === activeChannelId);

    // Get the course for the active channel or use the selected course
    const activeCourse = enrolledCourses?.find(course =>
        course.id === selectedCourseId || course.channels?.some(ch => ch.id === activeChannelId)
    );

    const canPost = activeChannel && (
        profile?.role === 'admin' ||
        profile?.role === 'instructor' ||
        profile?.role === 'creator' ||
        (activeChannel.type !== 'announcement')
    );

    // Initial setup when opening
    // Initial setup when opening
    useEffect(() => {
        if (isOpen) {
            // Priority: Options -> Existing Selected -> First Available
            let targetCourseId = options?.courseId || selectedCourseId || enrolledCourses?.[0]?.id;

            if (targetCourseId) {
                setSelectedCourseId(targetCourseId);

                // If the selected course has active channels, select the default one
                // UNLESS we are simply navigating back to a course we were already on? 
                // Actually, if activeChannelId is already set and belongs to this course, keep it.
                // Otherwise, find default.

                const courseChannels = visibleChannels.filter(c => c.course_id === targetCourseId);
                const currentChannelValid = activeChannelId && courseChannels.some(c => c.id === activeChannelId);

                if (!currentChannelValid && courseChannels.length > 0) {
                    const defaultChannel =
                        courseChannels.find(c => c.type === 'announcement') ||
                        courseChannels.find(c => c.type === 'discussion') ||
                        courseChannels[0];
                    setActiveChannelId(defaultChannel.id);
                    setActiveView('channels');
                } else if (!currentChannelValid) {
                    // No channels for this course
                    setActiveChannelId(null);
                    setActiveView('channels');
                }
            }
        }
    }, [isOpen, options, visibleChannels, enrolledCourses]);

    // Handle course selection from sidebar
    const handleCourseSelect = (courseId: string) => {
        setSelectedCourseId(courseId);
        // Find default channel for this course
        const courseChannels = visibleChannels.filter(c => c.course_id === courseId);
        if (courseChannels.length > 0) {
            const defaultChannel =
                courseChannels.find(c => c.type === 'announcement') ||
                courseChannels.find(c => c.type === 'discussion') ||
                courseChannels[0];
            setActiveChannelId(defaultChannel.id);
        } else {
            setActiveChannelId(null);
        }
        setActiveView('channels');
    };

    // Close sidebar when channel is selected on mobile
    const handleChannelSelect = (channelId: string) => {
        setActiveChannelId(channelId);
        // Also ensure course is selected
        const channel = visibleChannels.find(c => c.id === channelId);
        if (channel) {
            setSelectedCourseId(channel.course_id);
        }
        setActiveView('channels');
        setIsSidebarOpen(false);
    };

    const handleViewChange = (view: ViewType) => {
        setActiveView(view);
        setIsSidebarOpen(false);
    };

    if (!isOpen) return null;

    if (userLoading || coursesLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-white mx-auto" />
                    <p className="text-white font-medium">Loading community...</p>
                </div>
            </div>
        );
    }

    if (!enrolledCourses || enrolledCourses.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md mx-4 shadow-2xl relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={closeCommunity}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/10 flex items-center justify-center mx-auto">
                            <span className="text-5xl">📚</span>
                        </div>
                        <h2 className="text-2xl font-bold">No Community Channels</h2>
                        <p className="text-muted-foreground">
                            No community channels are available yet.
                        </p>
                        <Button onClick={closeCommunity} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render different views
    const renderContent = () => {
        if (activeView === 'settings' && activeCourse && isAdmin) {
            return (
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
                    <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                                <Menu className="h-5 w-5" />
                            </Button>
                            <h3 className="font-bold text-lg">Settings</h3>
                        </div>
                    </div>
                    {/* Settings View gets all channels (including inactive) */}
                    <CommunitySettingsView
                        courseId={activeCourse.id}
                        courseTitle={activeCourse.title}
                        communityEnabled={activeCourse.community_enabled}
                        channels={activeCourse.channels || []}
                        onBack={() => setActiveView('channels')}
                    />
                </div>
            );
        }

        if (activeView === 'mentions') {
            return (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
                        <Button variant="ghost" size="icon" className="md:hidden mr-4" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <AtSign className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Mentions</h3>
                                {mentions.length > 0 && (
                                    <p className="text-xs text-muted-foreground">{mentions.length} {mentions.length === 1 ? 'mention' : 'mentions'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {mentionsLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : mentions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 flex items-center justify-center mb-4">
                                    <AtSign className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Mentions Yet</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    When someone mentions you in a message, it will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {mentions.map((message: any) => (
                                    <MessageCard
                                        key={message.id}
                                        message={message}
                                        isOwnMessage={message.user_id === user?.id}
                                        channelId={message.channel_id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activeView === 'bookmarks') {
            return (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
                        <Button variant="ghost" size="icon" className="md:hidden mr-4" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                                <Bookmark className="w-5 h-5 text-white fill-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Bookmarks</h3>
                                {bookmarks.length > 0 && (
                                    <p className="text-xs text-muted-foreground">{bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {bookmarksLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : bookmarks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 flex items-center justify-center mb-4">
                                    <Bookmark className="w-12 h-12 text-amber-500 dark:text-amber-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">No Bookmarks Yet</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Save important messages by clicking the bookmark icon.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {bookmarks.map((bookmark: any) => (
                                    <MessageCard
                                        key={bookmark.bookmarkId}
                                        message={bookmark.message}
                                        isOwnMessage={bookmark.message.user_id === user?.id}
                                        channelId={bookmark.message.channel_id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>

                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                activeChannel?.type === 'announcement' ? "bg-blue-500" :
                                    activeChannel?.type === 'qa' ? "bg-purple-500" : "bg-emerald-500"
                            )} />
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                    #{activeChannel?.name || 'Select a channel'}
                                </h3>
                                {activeCourse && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {activeCourse.title}
                                    </p>
                                )}
                            </div>
                            {activeChannel?.description && (
                                <span className="text-sm text-slate-600 dark:text-slate-400 hidden lg:inline-block ml-2">
                                    — {activeChannel.description}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Admin Settings Button */}
                    {isAdmin && activeCourse && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 mr-12"
                            onClick={() => setActiveView('settings')}
                        >
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Button>
                    )}
                </div>

                {activeChannelId && (
                    <>
                        <MessageList channelId={activeChannelId} />
                        {canPost ? (
                            <MessageInput channelId={activeChannelId} />
                        ) : (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10 text-center text-sm text-amber-800 dark:text-amber-200 backdrop-blur-sm">
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>Only instructors can post in this announcement channel</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0 flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 animate-in slide-in-from-bottom duration-300">
                <ChannelSidebar
                    channels={visibleChannels}
                    activeChannelId={activeChannelId}
                    onSelectChannel={handleChannelSelect}
                    courseId={selectedCourseId || enrolledCourses?.[0]?.id || ''}
                    enrolledCourses={enrolledCourses || []}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isAdmin={isAdmin}
                    onViewChange={(view) => handleViewChange(view as ViewType)}
                    onSelectCourse={handleCourseSelect}
                />

                {/* Close Button - Fixed Position */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-4 right-4 z-10 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg"
                    onClick={closeCommunity}
                >
                    <X className="h-5 w-5" />
                </Button>

                {renderContent()}
            </div>
        </div>
    );
}
