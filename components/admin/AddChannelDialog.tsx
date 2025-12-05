"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreateChannel } from "@/hooks/admin/useCreateChannel";
import { Loader2 } from "lucide-react";

interface AddChannelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
}

export function AddChannelDialog({ open, onOpenChange, courseId }: AddChannelDialogProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"announcement" | "discussion" | "qa">("discussion");
    const [description, setDescription] = useState("");

    const { mutate: createChannel, isPending } = useCreateChannel();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        createChannel(
            { courseId, name: name.trim(), type, description: description.trim() },
            {
                onSuccess: () => {
                    setName("");
                    setType("discussion");
                    setDescription("");
                    onOpenChange(false);
                }
            }
        );
    };

    const getTypeDescription = (type: string) => {
        switch (type) {
            case 'announcement':
                return 'Only instructors can post. Students can read and react.';
            case 'qa':
                return 'Students can ask questions. Everyone can answer.';
            case 'discussion':
                return 'Open discussion for all students and instructors.';
            default:
                return '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Channel</DialogTitle>
                        <DialogDescription>
                            Create a new channel for your course community. Choose a name and type.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Channel Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Channel Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., homework-help"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isPending}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Use lowercase letters, numbers, and hyphens only
                            </p>
                        </div>

                        {/* Channel Type */}
                        <div className="space-y-2">
                            <Label htmlFor="type">Channel Type</Label>
                            <Select
                                value={type}
                                onValueChange={(value: any) => setType(value)}
                                disabled={isPending}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discussion">
                                        <div className="flex items-center gap-2">
                                            <span>💬</span>
                                            <span>Discussion</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="qa">
                                        <div className="flex items-center gap-2">
                                            <span>❓</span>
                                            <span>Q&A</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="announcement">
                                        <div className="flex items-center gap-2">
                                            <span>📢</span>
                                            <span>Announcement</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {getTypeDescription(type)}
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="What is this channel for?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isPending}
                                rows={3}
                            />
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
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Channel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
