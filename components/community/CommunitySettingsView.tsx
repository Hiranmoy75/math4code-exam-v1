"use client";

import { useState } from "react";
import { Plus, MessageSquare, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToggleCommunity } from "@/hooks/admin/useToggleCommunity";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AddChannelDialog } from "@/components/admin/AddChannelDialog";
import { EditChannelDialog } from "@/components/admin/EditChannelDialog";
import { CommunityChannel } from "@/types/community";
import { useDeleteChannel } from "@/hooks/admin/useAdminChannels";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommunitySettingsViewProps {
    courseId: string;
    courseTitle: string;
    communityEnabled: boolean;
    channels: CommunityChannel[];
    onBack: () => void;
}

export function CommunitySettingsView({
    courseId,
    courseTitle,
    communityEnabled: initialEnabled,
    channels,
    onBack
}: CommunitySettingsViewProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<CommunityChannel | null>(null);

    const { mutate: toggleCommunity, isPending: isTogglePending } = useToggleCommunity();
    const { mutate: deleteChannel, isPending: isDeletePending } = useDeleteChannel();

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

    const confirmDelete = (channel: CommunityChannel) => {
        setSelectedChannel(channel);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = () => {
        if (!selectedChannel) return;
        deleteChannel({ channelId: selectedChannel.id, courseId }, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setSelectedChannel(null);
            }
        });
    };

    const openEdit = (channel: CommunityChannel) => {
        setSelectedChannel(channel);
        setIsEditDialogOpen(true);
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
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
            <div className="max-w-3xl mx-auto p-6 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Community Settings
                    </h2>
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
                                disabled={isTogglePending}
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEdit(channel)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => confirmDelete(channel)}
                                            >
                                                <Trash className="h-4 w-4" />
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

                {/* Dialogs */}
                <AddChannelDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    courseId={courseId}
                />

                <EditChannelDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    channel={selectedChannel}
                />

                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Channel?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete <span className="font-bold">#{selectedChannel?.name}</span>?
                                This action cannot be undone and all messages in this channel will be permanently deleted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletePending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeletePending}
                            >
                                {isDeletePending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
