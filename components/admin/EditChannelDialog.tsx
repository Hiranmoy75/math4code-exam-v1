"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateChannel } from "@/hooks/admin/useAdminChannels";
import { CommunityChannel } from "@/types/community";
import { Loader2 } from "lucide-react";

interface EditChannelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: CommunityChannel | null;
}

export function EditChannelDialog({
    open,
    onOpenChange,
    channel,
}: EditChannelDialogProps) {
    const [name, setName] = useState("");
    const { mutate: updateChannel, isPending } = useUpdateChannel();

    useEffect(() => {
        if (channel) {
            setName(channel.name);
        }
    }, [channel]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !name.trim()) return;

        updateChannel(
            { channelId: channel.id, name: name.trim() },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Channel</DialogTitle>
                    <DialogDescription>
                        Update the channel name.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Channel Name</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-bold">#</span>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. announcements"
                                    className="flex-1"
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || !name.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
