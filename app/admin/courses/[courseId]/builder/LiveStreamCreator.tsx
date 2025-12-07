'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Loader2, Radio, Copy, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

interface LiveStreamCreatorProps {
    lessonId?: string;
    lessonTitle: string;
    initialStreamData?: {
        streamId: string;
        streamKey: string;
        rtmpUrl: string;
        playbackUrl?: string;
        libraryId: string;
    } | null;
    onStreamCreated: (streamData: {
        streamId: string;
        streamKey: string;
        rtmpUrl: string;
        playbackUrl: string;
        libraryId: string;
    }) => void;
    onError?: (error: string) => void;
}

export function LiveStreamCreator({ lessonId, lessonTitle, initialStreamData, onStreamCreated, onError }: LiveStreamCreatorProps) {
    const [creating, setCreating] = useState(false);
    const [streamData, setStreamData] = useState<any>(initialStreamData || null);
    const [error, setError] = useState<string>('');
    const [copiedField, setCopiedField] = useState<string>('');

    const createLiveStream = async () => {
        setCreating(true);
        setError('');

        try {
            const response = await fetch('/api/bunny/create-live', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    streamTitle: lessonTitle,
                    lessonId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create live stream');
            }

            setStreamData(data);
            onStreamCreated({
                streamId: data.streamId,
                streamKey: data.streamKey,
                rtmpUrl: data.rtmpUrl,
                playbackUrl: data.playbackUrl,
                libraryId: data.libraryId
            });
        } catch (err: any) {
            console.error('Create live stream error:', err);
            setError(err.message || 'Failed to create live stream');
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

    if (streamData) {
        return (
            <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        <strong>Live stream created successfully!</strong>
                        <p className="text-sm mt-1">
                            Use the credentials below to configure your streaming software.
                        </p>
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Radio className="mr-2 h-5 w-5 text-red-500" />
                            Stream Credentials
                        </CardTitle>
                        <CardDescription>
                            Copy these credentials to your streaming software (OBS, Zoom, etc.)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* RTMP URL */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                RTMP Server URL
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={streamData.rtmpUrl}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(streamData.rtmpUrl, 'rtmpUrl')}
                                >
                                    {copiedField === 'rtmpUrl' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Stream Key */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Stream Key
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={streamData.streamKey}
                                    readOnly
                                    type="password"
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(streamData.streamKey, 'streamKey')}
                                >
                                    {copiedField === 'streamKey' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Keep this private! Anyone with this key can stream to your channel.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* OBS Setup Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">OBS Studio Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Open OBS Studio</li>
                            <li>Go to Settings → Stream</li>
                            <li>
                                <strong>Service:</strong> Custom
                            </li>
                            <li>
                                <strong>Server:</strong> {streamData.rtmpUrl}
                            </li>
                            <li>
                                <strong>Stream Key:</strong> {streamData.streamKey.substring(0, 10)}...
                            </li>
                            <li>Click "Start Streaming"</li>
                        </ol>
                        <a
                            href="https://obsproject.com/download"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center mt-3"
                        >
                            Download OBS Studio <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                    </CardContent>
                </Card>

                {/* Zoom Setup Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Zoom Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Start or join a Zoom meeting</li>
                            <li>Click "More" → "Live on Custom Live Streaming Service"</li>
                            <li>
                                <strong>Stream URL:</strong> {streamData.rtmpUrl}/{streamData.streamKey.substring(0, 10)}...
                            </li>
                            <li>
                                <strong>Stream Key:</strong> {streamData.streamKey.substring(0, 10)}...
                            </li>
                            <li>Click "Go Live"</li>
                        </ol>
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                            <p className="text-xs">
                                <strong>Full Stream URL for Zoom:</strong>
                            </p>
                            <div className="flex gap-2 mt-1">
                                <code className="flex-1 text-xs bg-white dark:bg-gray-900 p-2 rounded">
                                    {streamData.rtmpUrl}/{streamData.streamKey}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(
                                        `${streamData.rtmpUrl}/${streamData.streamKey}`,
                                        'fullUrl'
                                    )}
                                >
                                    {copiedField === 'fullUrl' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Alert>
                    <AlertDescription className="text-sm">
                        <strong>Important:</strong> Students will see a "Waiting for stream..." message
                        until you start broadcasting. Once you go live, they'll automatically see your stream.
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
                        <strong>Error creating live stream</strong>
                        <p className="text-sm mt-1">{error}</p>
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Create Live Stream Session</CardTitle>
                    <CardDescription>
                        Generate RTMP credentials to stream live classes using OBS, Zoom, or other streaming software.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-medium mb-2 flex items-center">
                                <Radio className="mr-2 h-4 w-4 text-red-500" />
                                What happens when you create a live stream?
                            </h4>
                            <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                <li>• You'll receive RTMP credentials for streaming</li>
                                <li>• Students will see this lesson as "Live" in the course</li>
                                <li>• They can join and watch when you start broadcasting</li>
                                <li>• The stream will be recorded automatically (optional)</li>
                            </ul>
                        </div>

                        <Button
                            onClick={createLiveStream}
                            disabled={creating}
                            className="w-full"
                            size="lg"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Live Stream...
                                </>
                            ) : (
                                <>
                                    <Radio className="mr-2 h-4 w-4" />
                                    Create Live Stream Session
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
