"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, FileText, File, HelpCircle, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddContentModalProps {
    moduleId: string;
    lessonCount: number;
    onAdd: (data: any) => Promise<Lesson>;
    onSuccess?: (lesson: Lesson) => void;
}

export function AddContentModal({ moduleId, lessonCount, onAdd, onSuccess }: AddContentModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<"select" | "details">("select");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [availableExams, setAvailableExams] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingExams, setIsLoadingExams] = useState(false);
    const [isFreePreview, setIsFreePreview] = useState(false);
    // Live class fields
    const [meetingUrl, setMeetingUrl] = useState("");
    const [meetingDate, setMeetingDate] = useState("");
    const [meetingPlatform, setMeetingPlatform] = useState("google_meet");
    const supabase = createClient();

    const contentOptions = [
        { id: "video", label: "Video", icon: Video, description: "Add YouTube or Vimeo video" },
        { id: "live", label: "Live Class", icon: Video, description: "Schedule live class (Google Meet/Zoom)" },
        { id: "text", label: "Text", icon: FileText, description: "Add text content" },
        { id: "pdf", label: "PDF", icon: File, description: "Upload PDF file" },
        { id: "quiz", label: "Quiz/Exam", icon: HelpCircle, description: "Add quiz or exam" },
    ];

    const handleTypeSelect = async (typeId: string) => {
        setSelectedType(typeId);
        setStep("details");

        // Load available exams if quiz is selected
        if (typeId === "quiz") {
            setIsLoadingExams(true);
            try {
                const { data, error } = await supabase
                    .from("exams")
                    .select("id, title, status")
                    .eq("status", "published")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setAvailableExams(data || []);
            } catch (error) {
                console.error("Error loading exams:", error);
                toast.error("Failed to load exams");
            } finally {
                setIsLoadingExams(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        // Validation for quiz
        if (selectedType === "quiz" && !selectedExamId) {
            toast.error("Please select an exam");
            return;
        }

        // Validation for live class
        if (selectedType === "live") {
            if (!meetingUrl) {
                toast.error("Please enter a meeting URL");
                return;
            }
            if (!meetingDate) {
                toast.error("Please select a date and time");
                return;
            }
        }

        setIsLoading(true);
        try {
            let contentUrl = "";

            // For video lessons, leave content_url empty - will be added via upload
            if (selectedType === "pdf" && pdfFile) {
                const fileName = `course-content/${Date.now()}-${pdfFile.name.replace(/\s+/g, "_")}`;
                const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, pdfFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
                contentUrl = data.publicUrl;
            }

            const lessonData: any = {
                module_id: moduleId,
                title,
                content_type: selectedType === "live" ? "video" : selectedType,
                content_url: contentUrl,
                lesson_order: lessonCount + 1,
                is_free_preview: isFreePreview
            };

            // Add live class specific fields
            if (selectedType === "live") {
                lessonData.is_live = true;
                lessonData.meeting_url = meetingUrl;
                lessonData.meeting_date = new Date(meetingDate).toISOString();
                lessonData.meeting_platform = meetingPlatform;
            }

            // Add exam_id for quiz type
            if (selectedType === "quiz") {
                lessonData.exam_id = selectedExamId;
            }

            // Optimistic Update: Close dialog immediately without waiting for server
            setIsOpen(false);
            resetForm();
            setIsLoading(false);
            toast.info("Adding lesson in background...");

            // Trigger the actual mutation (fire and forget from UI perspective)
            onAdd(lessonData).then((data) => {
                // Once confirmed by server, we can select it or perform other actions
                if (onSuccess) onSuccess(data);
                toast.success("Lesson added successfully");
            }).catch((error) => {
                console.error("Add lesson failed:", error);
                // Persist the data in a retry action
                toast.error("Background save failed! Your work is preserved.", {
                    duration: Infinity, // Don't disappear
                    action: {
                        label: "Retry Save",
                        onClick: () => {
                            toast.info("Retrying save...");
                            onAdd(lessonData).then((d) => {
                                if (onSuccess) onSuccess(d);
                                toast.success("Retry successful!");
                            }).catch((e) => toast.error("Retry failed again. Please check connection."));
                        }
                    }
                });
            });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to add lesson");
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep("select");
        setSelectedType(null);
        setTitle("");
        setPdfFile(null);
        setSelectedExamId("");
        setAvailableExams([]);
        // Reset live class fields
        setMeetingUrl("");
        setMeetingDate("");
        setMeetingPlatform("google_meet");
        setIsFreePreview(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
        }}>
            <DialogTrigger asChild>
                <button className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors w-full">
                    <Plus className="h-3 w-3 mr-2" /> Add chapter item
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl dark:bg-[#161b22] dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-white">{step === "select" ? "Add Content" : `Add ${contentOptions.find(o => o.id === selectedType)?.label}`}</DialogTitle>
                </DialogHeader>

                {step === "select" ? (
                    <div className="grid grid-cols-3 gap-4 py-4">
                        {contentOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleTypeSelect(option.id)}
                                className="flex flex-col items-start p-4 border dark:border-slate-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left group"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md mb-3 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                    <option.icon className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                                </div>
                                <span className="font-semibold text-sm mb-1 dark:text-white">{option.label}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{option.description}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter lesson title"
                                required
                                autoFocus
                                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                            />
                        </div>

                        {selectedType === "live" && (
                            <>
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Meeting URL</Label>
                                    <Input
                                        value={meetingUrl}
                                        onChange={(e) => setMeetingUrl(e.target.value)}
                                        placeholder="https://meet.google.com/abc-defg-hij"
                                        required
                                        className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Paste your Google Meet, Zoom, or Teams link here
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Class Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={meetingDate}
                                        onChange={(e) => setMeetingDate(e.target.value)}
                                        required
                                        className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        When will the live class start?
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Platform</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={meetingPlatform}
                                        onChange={(e) => setMeetingPlatform(e.target.value)}
                                    >
                                        <option value="google_meet">Google Meet</option>
                                        <option value="zoom">Zoom</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {selectedType === "pdf" && (
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Upload PDF File</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    required
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                        )}

                        {selectedType === "quiz" && (
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Select Exam/Quiz</Label>
                                {isLoadingExams ? (
                                    <div className="text-sm text-slate-500">Loading exams...</div>
                                ) : availableExams.length > 0 ? (
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={selectedExamId}
                                        onChange={(e) => setSelectedExamId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select an exam...</option>
                                        {availableExams.map((exam) => (
                                            <option key={exam.id} value={exam.id}>
                                                {exam.title}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-slate-500">
                                        No published exams available. Please create an exam first.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="is-free"
                                checked={isFreePreview}
                                onChange={(e) => setIsFreePreview(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="is-free" className="dark:text-slate-300 cursor-pointer">Free Preview (Available without purchase)</Label>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setStep("select")} className="dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800">Back</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Adding..." : "Add Lesson"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog >
    );
}
