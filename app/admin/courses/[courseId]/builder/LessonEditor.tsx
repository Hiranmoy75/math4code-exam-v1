"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lesson, Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, FileText, File, HelpCircle, Trash, Save, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { BunnyUploader } from "./BunnyUploader";
import { JitsiLiveCreator } from "./JitsiLiveCreator";
import { BunnyPlayer } from "@/components/BunnyPlayer";
import { ExamSettingsDialog } from "@/components/ExamSettingsDialog";

// Code split RichTextEditor
const RichTextEditor = dynamic(
    () => import("@/components/RichTextEditor").then((mod) => ({ default: mod.RichTextEditor })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        ),
        ssr: false,
    }
);

// Lazy load VideoPlayer
const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
    loading: () => (
        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
    ),
    ssr: false,
});

interface LessonEditorProps {
    lesson: Lesson;
    course: Course;
    onUpdate: (updates: Partial<Lesson>) => Promise<any>;
    onDelete: (id: string) => void;
}

export function LessonEditor({ lesson, course, onUpdate, onDelete }: LessonEditorProps) {
    const [title, setTitle] = useState(lesson.title);
    const [contentUrl, setContentUrl] = useState(lesson.content_url || "");
    const [contentText, setContentText] = useState(lesson.content_text || "");
    const [isSaving, setIsSaving] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showExamSettings, setShowExamSettings] = useState(false);
    const supabase = createClient();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let finalContentUrl = contentUrl;

            // Handle PDF upload if new file selected
            if (lesson.content_type === "pdf" && pdfFile) {
                const fileName = `course-content/${Date.now()}-${pdfFile.name.replace(/\s+/g, "_")}`;
                const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, pdfFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
                finalContentUrl = data.publicUrl;
            }

            // Convert video URL to embed format
            if (lesson.content_type === "video") {
                finalContentUrl = convertToEmbedUrl(contentUrl);
            }

            const updates = {
                title,
                content_url: finalContentUrl,
                content_text: contentText,
                is_downloadable: lesson.is_downloadable,
            };

            // Optimistic Update: Don't await the result
            onUpdate(updates).catch((error) => {
                console.error("Save lesson failed:", error);
                toast.error("Background save failed! Your work is preserved.", {
                    duration: Infinity,
                    action: {
                        label: "Retry Save",
                        onClick: () => {
                            toast.info("Retrying save...");
                            onUpdate(updates).then(() => toast.success("Retry successful!"))
                                .catch(() => toast.error("Retry failed again."));
                        }
                    }
                });
            });

            toast.success("Saved");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to update lesson");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#161b22]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    {lesson.content_type === "video" && <Video className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                    {lesson.content_type === "text" && <FileText className="h-5 w-5 text-green-500 dark:text-green-400" />}
                    {lesson.content_type === "pdf" && <File className="h-5 w-5 text-red-500 dark:text-red-400" />}
                    {lesson.content_type === "quiz" && <HelpCircle className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 px-0 bg-transparent dark:text-white"
                        placeholder="Lesson Title"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="free-preview-toggle"
                            checked={lesson.is_free_preview}
                            onCheckedChange={(checked) => onUpdate({ is_free_preview: checked })}
                        />
                        <Label htmlFor="free-preview-toggle" className="text-sm font-medium dark:text-slate-300 whitespace-nowrap">Free Preview</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-red-400">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Delete Lesson</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            Are you sure you want to delete "{title}"?
                            {lesson.video_provider === 'bunny' && lesson.bunny_video_id && (
                                <span className="block mt-2 text-amber-600 dark:text-amber-500">
                                    ⚠️ This will also delete the associated video from Bunny.net.
                                </span>
                            )}
                            <span className="block mt-2">
                                This action cannot be undone.
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onDelete(lesson.id);
                                setShowDeleteDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {lesson.content_type === "video" && (
                        <>
                            {/* Live Class - Show simple join button */}
                            {lesson.is_live && lesson.meeting_url ? (
                                <div className="space-y-4">
                                    <div className="p-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Live Class Meeting</h3>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    Scheduled for: {lesson.meeting_date ? new Date(lesson.meeting_date).toLocaleString() : 'Not scheduled'}
                                                </p>
                                            </div>
                                            <div className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                                {lesson.meeting_platform?.toUpperCase() || 'GOOGLE MEET'}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">Meeting URL</Label>
                                                <div className="flex gap-2 mt-1">
                                                    <Input
                                                        value={lesson.meeting_url}
                                                        readOnly
                                                        className="bg-white dark:bg-slate-900 font-mono text-sm"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(lesson.meeting_url || '');
                                                            toast.success('Meeting URL copied!');
                                                        }}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => lesson.meeting_url && window.open(lesson.meeting_url, '_blank', 'noopener,noreferrer')}
                                                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                                                size="lg"
                                            >
                                                <Video className="mr-2 h-5 w-5" />
                                                Start Live Class
                                            </Button>

                                            <p className="text-xs text-center text-blue-600 dark:text-blue-400">
                                                This will open the meeting in a new tab
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                                        <h4 className="font-medium mb-2 text-sm">📝 Instructions</h4>
                                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                            <li>• Click "Start Live Class" to join the meeting</li>
                                            <li>• Students will see a countdown and join button</li>
                                            <li>• The meeting link is: {lesson.meeting_platform || 'Google Meet'}</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                /* Regular Video Lesson - Show 3 tabs */
                                <Tabs defaultValue="youtube" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="youtube">YouTube</TabsTrigger>
                                        <TabsTrigger value="upload">Upload Video</TabsTrigger>
                                        <TabsTrigger value="live">Go Live</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="youtube" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="dark:text-slate-300">Video URL</Label>
                                            <Input
                                                value={contentUrl}
                                                onChange={(e) => setContentUrl(e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Paste a YouTube or Vimeo URL</p>
                                        </div>

                                        {contentUrl && (
                                            <div className="space-y-2">
                                                <Label className="dark:text-slate-300">Preview</Label>
                                                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                                    <VideoPlayer url={convertToEmbedUrl(contentUrl)} />
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="upload" className="space-y-4">
                                        <BunnyUploader
                                            lessonTitle={title}
                                            courseId={course.id}
                                            courseTitle={course.title}
                                            onUploadComplete={async (videoData) => {
                                                console.log('✅ Upload complete! Video data:', videoData);
                                                console.log('📝 Lesson ID:', lesson.id);
                                                const updates: Partial<Lesson> = {
                                                    video_provider: 'bunny',
                                                    video_type: 'vod',
                                                    bunny_video_id: videoData.videoId,
                                                    bunny_guid: videoData.guid,
                                                    bunny_library_id: videoData.libraryId,
                                                    video_status: 'ready',
                                                    content_url: `https://iframe.mediadelivery.net/embed/${videoData.libraryId}/${videoData.guid}`
                                                };

                                                onUpdate(updates).then(() => {
                                                    toast.success('Video uploaded and saved successfully!');
                                                }).catch((error) => {
                                                    console.error('Failed to save video data:', error);
                                                    toast.error('Video uploaded but save failed! Your work is preserved.', {
                                                        duration: Infinity,
                                                        action: {
                                                            label: "Retry Save",
                                                            onClick: () => {
                                                                toast.info("Retrying save...");
                                                                onUpdate(updates).then(() => toast.success("Retry successful!"))
                                                                    .catch(() => toast.error("Retry failed again."));
                                                            }
                                                        }
                                                    });
                                                });
                                            }}
                                            onError={(error) => {
                                                toast.error(error);
                                            }}
                                        />

                                        {lesson.bunny_video_id && lesson.bunny_library_id && (
                                            <div className="space-y-2">
                                                <Label className="dark:text-slate-300">Uploaded Video Preview</Label>
                                                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                                    <BunnyPlayer
                                                        videoId={lesson.bunny_video_id}
                                                        libraryId={lesson.bunny_library_id}
                                                        videoType="vod"
                                                        videoStatus={lesson.video_status}
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="live" className="space-y-4">
                                        <JitsiLiveCreator
                                            lessonId={lesson.id}
                                            lessonTitle={title}
                                            initialMeetingData={
                                                lesson.jitsi_meeting_id && lesson.jitsi_meeting_url
                                                    ? {
                                                        meetingId: lesson.jitsi_meeting_id,
                                                        meetingUrl: lesson.jitsi_meeting_url
                                                    }
                                                    : null
                                            }
                                            onMeetingCreated={async (meetingData) => {
                                                const updates: Partial<Lesson> = {
                                                    video_provider: 'jitsi',
                                                    video_type: 'live',
                                                    jitsi_meeting_id: meetingData.meetingId,
                                                    jitsi_meeting_url: meetingData.meetingUrl,
                                                    video_status: 'live',
                                                    content_url: meetingData.meetingUrl
                                                };

                                                onUpdate(updates).then(() => {
                                                    toast.success('Live class meeting created successfully!');
                                                }).catch((error) => {
                                                    console.error('Failed to save stream data:', error);
                                                    toast.error('Stream created but save failed! Your work is preserved.', {
                                                        duration: Infinity,
                                                        action: {
                                                            label: "Retry Save",
                                                            onClick: () => {
                                                                toast.info("Retrying save...");
                                                                onUpdate(updates).then(() => toast.success("Retry successful!"))
                                                                    .catch(() => toast.error("Retry failed again."));
                                                            }
                                                        }
                                                    });
                                                });
                                            }}
                                            onError={(error) => {
                                                toast.error(error);
                                            }}
                                        />
                                    </TabsContent>
                                </Tabs>
                            )}
                        </>
                    )}


                    {lesson.content_type === "pdf" && (
                        <>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">Upload New PDF (Optional)</Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                />
                                {contentUrl && !pdfFile && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Current file: <a href={contentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">View PDF</a>
                                    </p>
                                )}
                                <div className="flex items-center space-x-2 pt-2">
                                    <Switch
                                        id="is-downloadable"
                                        checked={lesson.is_downloadable ?? true}
                                        onCheckedChange={(checked) => onUpdate({ ...lesson, is_downloadable: checked })}
                                    />
                                    <Label htmlFor="is-downloadable" className="dark:text-slate-300">Allow Download</Label>
                                </div>
                            </div>

                            {contentUrl && (
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Preview</Label>
                                    <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <iframe
                                            src={contentUrl}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {lesson.content_type === "text" && (
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Content</Label>
                            <RichTextEditor
                                value={contentText}
                                onChange={setContentText}
                                placeholder="Enter your lesson content here..."
                                className="min-h-[400px] dark:bg-slate-900 dark:border-slate-700"
                            />
                        </div>
                    )}

                    {lesson.content_type === "quiz" && (
                        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Quiz Content</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                This lesson is linked to an exam. Students will see the exam interface when they access this lesson.
                            </p>
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowExamSettings(true)}
                                    className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    Manage Exam Settings
                                </Button>
                            </div>

                            {lesson.exam_id && (
                                <ExamSettingsDialog
                                    open={showExamSettings}
                                    onOpenChange={setShowExamSettings}
                                    examId={lesson.exam_id}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

// Helper function to convert YouTube/Vimeo URLs to embed format
function convertToEmbedUrl(url: string): string {
    if (!url) return "";

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
}
