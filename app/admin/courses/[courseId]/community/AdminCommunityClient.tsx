"use client";

import { useState, useEffect } from "react";
import { ChannelSidebar, MessageList, MessageInput } from "@/components/community";
import { useCommunityChannels } from "@/hooks/community";
import { useAdminCoursesWithChannels } from "@/hooks/admin/useAdminCoursesWithChannels";
import { Loader2, Menu, ArrowLeft, Settings } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminCommunityClientProps {
    courseId: string;
    userProfile: any;
    courseTitle: string;
}

export default function AdminCommunityClient({ courseId, userProfile, courseTitle }: AdminCommunityClientProps) {
    const router = useRouter();
    const { data: channels, isLoading: channelsLoading } = useCommunityChannels(courseId);
    const { data: adminCourses, isLoading: coursesLoading } = useAdminCoursesWithChannels(userProfile?.id);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, loading: userLoading } = useUser();

    const activeChannel = channels?.find(c => c.id === activeChannelId);

    // Admins can post anywhere
    const canPost = true;

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
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading community...</p>
                </div>
            </div>
        );
    }

    if (!channels || channels.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">No Channels Found</h2>
                    <p className="text-muted-foreground">
                        Channels will be created automatically when community is enabled.
                    </p>
                </div>
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
                enrolledCourses={adminCourses || []}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isAdmin={true}
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

                        {/* Back to Courses Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => router.push(`/admin/courses`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back to Courses</span>
                        </Button>

                        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2 h-2 rounded-full",
                                activeChannel?.type === 'announcement' ? "bg-blue-500" :
                                    activeChannel?.type === 'qa' ? "bg-purple-500" : "bg-emerald-500"
                            )} />
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                    #{activeChannel?.name}
                                </h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {courseTitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Settings Button */}
                    <Link href={`/admin/courses/${courseId}/community/settings`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Button>
                    </Link>
                </div>

                {/* Messages Area */}
                {activeChannelId && (
                    <>
                        <MessageList channelId={activeChannelId} />
                        <MessageInput channelId={activeChannelId} />
                    </>
                )}
            </div>
        </div>
    );
}
