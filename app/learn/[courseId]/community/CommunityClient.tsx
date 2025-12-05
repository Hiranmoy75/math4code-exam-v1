"use client";

import { useState, useEffect } from "react";
import { ChannelSidebar, MessageList, MessageInput } from "@/components/community";
import { useCommunityChannels } from "@/hooks/community";
import { useEnrolledCourses } from "@/hooks/community/useEnrolledCourses";
import { Loader2, Menu, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommunityClientProps {
    courseId: string;
    userProfile: any;
}

export default function CommunityClient({ courseId, userProfile }: CommunityClientProps) {
    const router = useRouter();
    const { data: channels, isLoading: channelsLoading } = useCommunityChannels(courseId);
    const { data: enrolledCourses, isLoading: coursesLoading } = useEnrolledCourses(userProfile?.id);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, loading: userLoading } = useUser();

    const activeChannel = channels?.find(c => c.id === activeChannelId);
    const canPost = activeChannel && (
        userProfile?.role === 'admin' ||
        userProfile?.role === 'instructor' ||
        (activeChannel.type !== 'announcement')
    );

    // Set default channel when channels are loaded
    useEffect(() => {
        if (channels && channels.length > 0 && !activeChannelId) {
            const defaultChannel =
                channels.find(c => c.type === 'announcement') ||
                channels.find(c => c.type === 'discussion') ||
                channels[0];

            setActiveChannelId(defaultChannel.id);
        }
    }, [channels, activeChannelId]);

    // Close sidebar when channel is selected on mobile
    const handleChannelSelect = (channelId: string) => {
        setActiveChannelId(channelId);
        setIsSidebarOpen(false);
    };

    if (channelsLoading || userLoading || coursesLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!channels || channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p>No community channels available for this course.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <ChannelSidebar
                channels={channels}
                activeChannelId={activeChannelId}
                onSelectChannel={handleChannelSelect}
                courseId={courseId}
                enrolledCourses={enrolledCourses || []}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Channel Header */}
                <div className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center px-6 justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Back to Course Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => router.push(`/learn/${courseId}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Course</span>
                        </Button>

                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                activeChannel?.type === 'announcement' ? "bg-blue-500" :
                                    activeChannel?.type === 'qa' ? "bg-purple-500" : "bg-emerald-500"
                            )} />
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                #{activeChannel?.name}
                            </h3>
                            {activeChannel?.description && (
                                <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:inline-block">
                                    — {activeChannel.description}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
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
        </div>
    );
}
