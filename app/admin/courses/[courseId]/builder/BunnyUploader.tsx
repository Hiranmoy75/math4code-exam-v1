'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload as UploadIcon, CheckCircle2, XCircle, Loader2, Video } from 'lucide-react';
import * as tus from 'tus-js-client';

interface BunnyUploaderProps {
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    onUploadComplete: (videoData: {
        videoId: string;
        guid: string;
        libraryId: string;
    }) => void;
    onError?: (error: string) => void;
}

export function BunnyUploader({ lessonTitle, courseId, courseTitle, onUploadComplete, onError }: BunnyUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [videoData, setVideoData] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadRef = useRef<tus.Upload | null>(null);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                setErrorMessage('Please select a valid video file');
                setUploadStatus('error');
                return;
            }

            // Validate file size (max 5GB for example)
            const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
            if (file.size > maxSize) {
                setErrorMessage('File size exceeds 5GB limit');
                setUploadStatus('error');
                return;
            }

            setSelectedFile(file);
            setUploadStatus('idle');
            setErrorMessage('');
        }
    }, []);

    const startUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadStatus('uploading');
        setUploadProgress(0);
        setErrorMessage('');

        try {
            // 1. Get or create collection for this course
            console.log('📁 Initializing collection for course:', courseTitle);
            const collectionResponse = await fetch('/api/admin/bunny-collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    courseTitle
                })
            });

            if (!collectionResponse.ok) {
                console.warn('Failed to initialize collection, continuing without it');
            }

            const collectionData = await collectionResponse.json();
            const collectionId = collectionData?.collectionId;

            if (collectionId) {
                console.log('✅ Collection ready:', collectionId, collectionData.created ? '(new)' : '(existing)');
            }

            // 2. Get upload signature from backend
            const signResponse = await fetch('/api/bunny/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoTitle: lessonTitle || selectedFile.name,
                    collectionId // Pass collection ID to sign endpoint
                })
            });

            if (!signResponse.ok) {
                throw new Error('Failed to get upload signature');
            }

            const signData = await signResponse.json();
            const { videoId, guid, libraryId, apiKey } = signData;

            console.log('Starting upload with:', { videoId, libraryId });

            // 2. Upload directly to Bunny.net using their API
            // Use XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentage = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentage);
                }
            });

            xhr.addEventListener('load', async () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    console.log('Upload completed successfully');
                    setUploadStatus('processing');

                    // Store video data
                    const data = { videoId, guid, libraryId };
                    setVideoData(data);

                    // Wait a bit for processing to start
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Check video status
                    await checkVideoStatus(videoId, data);
                } else {
                    console.error('Upload failed:', xhr.status, xhr.responseText);
                    setErrorMessage(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                    setUploadStatus('error');
                    setUploading(false);
                    onError?.(`Upload failed: ${xhr.status}`);
                }
            });

            xhr.addEventListener('error', () => {
                console.error('Upload error');
                setErrorMessage('Network error during upload');
                setUploadStatus('error');
                setUploading(false);
                onError?.('Network error');
            });

            // Upload using Bunny.net's direct upload API
            xhr.open('PUT', `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`);
            xhr.setRequestHeader('AccessKey', apiKey);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(selectedFile);

        } catch (error: any) {
            console.error('Upload initialization error:', error);
            setErrorMessage(error.message || 'Failed to initialize upload');
            setUploadStatus('error');
            setUploading(false);
            onError?.(error.message);
        }
    };

    const checkVideoStatus = async (videoId: string, data: any) => {
        try {
            const response = await fetch('/api/bunny/video-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            });

            const result = await response.json();

            if (result.success && result.status === 'ready') {
                setUploadStatus('success');
                setUploading(false);
                onUploadComplete(data);
            } else if (result.status === 'error') {
                setErrorMessage('Video processing failed');
                setUploadStatus('error');
                setUploading(false);
            } else {
                // Still processing, check again in 3 seconds
                setTimeout(() => checkVideoStatus(videoId, data), 3000);
            }
        } catch (error) {
            console.error('Status check error:', error);
            // Assume success if we can't check status
            setUploadStatus('success');
            setUploading(false);
            onUploadComplete(data);
        }
    };

    const cancelUpload = useCallback(() => {
        if (uploadRef.current) {
            uploadRef.current.abort();
            uploadRef.current = null;
        }
        setUploading(false);
        setUploadStatus('idle');
        setUploadProgress(0);
    }, []);

    const reset = useCallback(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        setErrorMessage('');
        setVideoData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <div className="space-y-4">
            {uploadStatus === 'idle' && !selectedFile && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Click to select a video file or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                            MP4, MOV, AVI, or any video format (Max 5GB)
                        </p>
                    </label>
                </div>
            )}

            {selectedFile && uploadStatus === 'idle' && (
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Video className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={reset}>
                            Change
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={startUpload} className="flex-1">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Start Upload
                        </Button>
                        <Button variant="outline" onClick={reset}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {uploadStatus === 'uploading' && (
                <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="font-medium">Uploading...</span>
                        </div>
                        <span className="text-sm font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {selectedFile?.name}
                    </p>
                    <Button variant="outline" size="sm" onClick={cancelUpload} className="mt-2">
                        Cancel Upload
                    </Button>
                </div>
            )}

            {uploadStatus === 'processing' && (
                <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                        <strong>Processing video...</strong>
                        <p className="text-sm mt-1">
                            Your video is being encoded. This may take a few minutes.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {uploadStatus === 'success' && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                        <strong>Upload successful!</strong>
                        <p className="text-sm mt-1">
                            Your video has been uploaded and is ready to use.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            {uploadStatus === 'error' && (
                <Alert className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                        <strong>Upload failed</strong>
                        <p className="text-sm mt-1">{errorMessage}</p>
                        <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
