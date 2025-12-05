"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Plus, Trash, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToggleCommunity } from "@/hooks/admin/useToggleCommunity";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AddChannelDialog } from "@/components/admin/AddChannelDialog";

interface Channel {
    id: string;
    name: string;
    type: string;
    description: string | null;
    is_active: boolean;
}

interface CommunitySettingsClientProps {
    courseId: string;
    courseTitle: string;
    communityEnabled: boolean;
    initialChannels: Channel[];
}

export default function CommunitySettingsClient({
    courseId,
    courseTitle,
    communityEnabled: initialEnabled,
    initialChannels
}: CommunitySettingsClientProps) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(initialEnabled);
    const [channels] = useState(initialChannels);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const { mutate: toggleCommunity, isPending } = useToggleCommunity();

    const handleToggle = (checked: boolean) => {
        toggleCommunity(
            { courseId, enabled: checked },
            {
                onSuccess: () => {
                    setEnabled(checked);
                    if (checked) {
                        toast.success("Community enabled! Default channels have been created.");
                    } else {
                        toast.success("Community disabled");
                    }
                },
                onError: () => {
                    toast.error("Failed to toggle community");
                }
            }
        );
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return '📢';
            case 'qa':
                return '❓';
            default:
                return '💬';
        }
    };

    const getChannelColor = (type: string) => {
        switch (type) {
            case 'announcement':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'qa':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            default:
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/courses/${courseId}/community`)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Community
                    </Button>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Community Settings
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage community settings for {courseTitle}
                    </p>
                </div>

                {/* Enable/Disable Community */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Community Status
                        </CardTitle>
                        <CardDescription>
                            Enable or disable community features for this course
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="community-toggle" className="text-base">
                                    Community Features
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow students to discuss and ask questions
                                </p>
                            </div>
                            <Switch
                                id="community-toggle"
                                checked={enabled}
                                onCheckedChange={handleToggle}
                                disabled={isPending}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Channels List */}
                {enabled && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Channels</CardTitle>
                                    <CardDescription>
                                        Manage discussion channels for your course
                                    </CardDescription>
                                </div>
                                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Channel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {channels.map((channel) => (
                                    <div
                                        key={channel.id}
                                        className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getChannelIcon(channel.type)}</span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                                        #{channel.name}
                                                    </h4>
                                                    <Badge className={getChannelColor(channel.type)}>
                                                        {channel.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {channel.description || "No description"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" disabled>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" disabled>
                                                <Trash className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <div className="shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                    About Community Features
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    When enabled, students can participate in discussions, ask questions, and interact with each other.
                                    As an instructor, you can post announcements and moderate conversations.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Channel Dialog */}
                <AddChannelDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    courseId={courseId}
                />
            </div>
        </div>
    );
}
