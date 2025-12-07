'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, Video, Copy, CheckCircle2, XCircle, Users } from 'lucide-react';
import { LiveClassPlayer } from '@/components/LiveClassPlayer';

interface JitsiLiveCreatorProps {
    lessonId?: string;
    lessonTitle: string;
    initialMeetingData?: {
        meetingId: string;
        meetingUrl: string;
    } | null;
    onMeetingCreated: (meetingData: {
        meetingId: string;
        meetingUrl: string;
    }) => void;
    onError?: (error: string) => void;
}

export function JitsiLiveCreator({ lessonId, lessonTitle, initialMeetingData, onMeetingCreated, onError }: JitsiLiveCreatorProps) {
    const [creating, setCreating] = useState(false);
    const [meetingData, setMeetingData] = useState<any>(initialMeetingData || null);
    const [error, setError] = useState<string>('');
    const [copiedField, setCopiedField] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);

    const createMeeting = async () => {
        setCreating(true);
        setError('');

        try {
            // Generate unique meeting ID based on lesson ID
            const meetingId = `Math4Code_${lessonId || Date.now()}`;
            const meetingUrl = `https://meet.jit.si/${meetingId}`;

            const data = {
                meetingId,
                meetingUrl
            };

            setMeetingData(data);
            onMeetingCreated(data);
        } catch (err: any) {
            console.error('Create meeting error:', err);
            setError(err.message || 'Failed to create meeting');
            onError?.(err.message);
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(''), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (meetingData) {
        return (
            <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        <strong>Live class meeting created successfully!</strong>
                        <p className="text-sm mt-1">
                            Students will see an embedded video player when they open this lesson.
                        </p>
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center">
                                <Video className="mr-2 h-5 w-5 text-blue-500" />
                                Meeting Details
                            </span>
                            <Button
                                variant={showPreview ? "secondary" : "default"}
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            Share this room with your students
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Meeting ID */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Room Name
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={meetingData.meetingId}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(meetingData.meetingId, 'id')}
                                >
                                    {copiedField === 'id' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Unique room name for this lesson
                            </p>
                        </div>

                        {/* Meeting URL */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Direct Link (Optional)
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={meetingData.meetingUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(meetingData.meetingUrl, 'url')}
                                >
                                    {copiedField === 'url' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Students can also join via this direct link
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Embedded Preview */}
                {showPreview && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Live Preview (Teacher View)</CardTitle>
                            <CardDescription>
                                This is how the meeting will appear. Students will see a similar view.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[500px] rounded-lg overflow-hidden border border-border">
                                <LiveClassPlayer
                                    roomName={meetingData.meetingId}
                                    userName="Teacher (Preview)"
                                    userEmail="teacher@math4code.com"
                                    isTeacher={true}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            How It Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="space-y-3">
                            <div>
                                <strong className="text-blue-600">For Teachers:</strong>
                                <ol className="list-decimal list-inside space-y-1 mt-1 ml-2">
                                    <li>Click "Show Preview" to join the meeting</li>
                                    <li>Allow camera and microphone permissions</li>
                                    <li>Share your screen if needed</li>
                                    <li>Students will automatically see this lesson as "Live"</li>
                                </ol>
                            </div>

                            <div>
                                <strong className="text-green-600">For Students:</strong>
                                <ol className="list-decimal list-inside space-y-1 mt-1 ml-2">
                                    <li>They'll see an embedded video player in the lesson</li>
                                    <li>Click to join instantly (no external links!)</li>
                                    <li>Their name is pre-filled automatically</li>
                                    <li>Works on desktop and mobile</li>
                                </ol>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs">
                                <strong>💡 Pro Tip:</strong> The meeting is embedded directly in your platform.
                                Students never leave your website - it's a seamless experience!
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <AlertDescription className="text-sm">
                        <strong>Note:</strong> The meeting room is always available. Students can join anytime,
                        but they'll only see content when you're actively teaching.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                        <strong>Error creating meeting</strong>
                        <p className="text-sm mt-1">{error}</p>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Create Live Class Meeting</CardTitle>
                    <CardDescription>
                        Generate an embedded Jitsi Meet room for live video classes with your students.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-medium mb-2 flex items-center">
                                <Video className="mr-2 h-4 w-4 text-blue-500" />
                                Embedded Live Classes
                            </h4>
                            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>• Video player embedded directly in your platform</li>
                                <li>• Students never leave your website</li>
                                <li>• No account or installation required</li>
                                <li>• Automatic name and email pre-fill</li>
                                <li>• Screen sharing, chat, and recording</li>
                                <li>• Works on all devices (desktop & mobile)</li>
                            </ul>
                        </div>

                        <Button
                            onClick={createMeeting}
                            disabled={creating}
                            className="w-full"
                            size="lg"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Meeting...
                                </>
                            ) : (
                                <>
                                    <Video className="mr-2 h-4 w-4" />
                                    Create Live Class Meeting
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
