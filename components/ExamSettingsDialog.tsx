"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Calendar, Eye, EyeOff, Clock } from "lucide-react";
import { Exam } from "@/lib/types";

interface ExamSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId: string;
    onSettingsUpdated?: (exam: Exam) => void;
}

export function ExamSettingsDialog({
    open,
    onOpenChange,
    examId,
    onSettingsUpdated
}: ExamSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [exam, setExam] = useState<Exam | null>(null);

    // Form state
    const [resultVisibility, setResultVisibility] = useState<"immediate" | "scheduled" | "manual">("immediate");
    const [releaseDate, setReleaseDate] = useState("");
    const [releaseTime, setReleaseTime] = useState("");
    const [showAnswers, setShowAnswers] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (open && examId) {
            fetchExamSettings();
        }
    }, [open, examId]);

    const fetchExamSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId)
                .single();

            if (error) throw error;

            setExam(data);
            setResultVisibility(data.result_visibility || "immediate");
            setShowAnswers(data.show_answers ?? true);

            if (data.result_release_time) {
                const date = new Date(data.result_release_time);
                setReleaseDate(date.toISOString().split('T')[0]);
                // Format time as HH:MM
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                setReleaseTime(`${hours}:${minutes}`);
            } else {
                setReleaseDate("");
                setReleaseTime("");
            }
        } catch (error) {
            console.error("Error fetching exam settings:", error);
            toast.error("Failed to load exam settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let releaseTimestamp = null;

            if (resultVisibility === "scheduled") {
                if (!releaseDate || !releaseTime) {
                    toast.error("Please select both date and time for scheduled release");
                    setSaving(false);
                    return;
                }
                releaseTimestamp = new Date(`${releaseDate}T${releaseTime}`).toISOString();
            }

            const updates = {
                result_visibility: resultVisibility,
                result_release_time: releaseTimestamp,
                show_answers: showAnswers,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from("exams")
                .update(updates)
                .eq("id", examId)
                .select()
                .single();

            if (error) throw error;

            toast.success("Exam settings updated");
            if (onSettingsUpdated) onSettingsUpdated(data as Exam);
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving exam settings:", JSON.stringify(error, null, 2));
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] dark:bg-[#161b22] dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-white">Exam Settings</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        Configure how and when students see their results and answers.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Result Visibility */}
                        <div className="space-y-3">
                            <Label className="dark:text-slate-300">Result Visibility</Label>
                            <Select
                                value={resultVisibility}
                                onValueChange={(value: any) => setResultVisibility(value)}
                            >
                                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                                    <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                    <SelectItem value="immediate">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-green-500" />
                                            <span>Immediate</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="scheduled">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-500" />
                                            <span>Scheduled</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="manual">
                                        <div className="flex items-center gap-2">
                                            <EyeOff className="h-4 w-4 text-orange-500" />
                                            <span>Manual Release</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {resultVisibility === "immediate" && "Students see results immediately after submission."}
                                {resultVisibility === "scheduled" && "Results are hidden until the specified date and time."}
                                {resultVisibility === "manual" && "Results are hidden until you manually change this setting."}
                            </p>
                        </div>

                        {/* Schedule Date/Time Picker */}
                        {resultVisibility === "scheduled" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                <div className="space-y-2">
                                    <Label className="text-xs dark:text-slate-400">Release Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="date"
                                            value={releaseDate}
                                            onChange={(e) => setReleaseDate(e.target.value)}
                                            className="pl-8 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs dark:text-slate-400">Release Time</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="time"
                                            value={releaseTime}
                                            onChange={(e) => setReleaseTime(e.target.value)}
                                            className="pl-8 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show Answers Toggle */}
                        <div className="flex items-center justify-between space-x-2 border-t dark:border-slate-800 pt-4">
                            <div className="space-y-0.5">
                                <Label className="text-base dark:text-slate-300">Show Answers</Label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Allow students to see correct answers and solutions
                                </p>
                            </div>
                            <Switch
                                checked={showAnswers}
                                onCheckedChange={setShowAnswers}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Settings"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
