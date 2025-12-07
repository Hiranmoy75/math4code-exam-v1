'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function BunnySettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [libraryId, setLibraryId] = useState('');
    const [streamLibraryId, setStreamLibraryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [hasSettings, setHasSettings] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/bunny-settings');
            const data = await res.json();

            if (data.hasSettings) {
                setLibraryId(data.bunny_library_id || '');
                setStreamLibraryId(data.bunny_stream_library_id || '');
                setApiKey(data.bunny_api_key || ''); // This will be masked
                setHasSettings(true);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleTest = async () => {
        if (!apiKey || !libraryId) {
            setMessage({ type: 'error', text: 'Please enter both API Key and Library ID' });
            return;
        }

        // Check if API key is masked (starts with asterisks)
        if (apiKey.startsWith('*')) {
            setMessage({ type: 'error', text: 'Please enter your actual API key (the masked value won\'t work)' });
            return;
        }

        setTesting(true);
        setMessage(null);

        try {
            // Direct test using Bunny.net API
            const response = await fetch(
                `https://video.bunnycdn.com/library/${libraryId}`,
                {
                    headers: {
                        'AccessKey': apiKey,
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setMessage({
                    type: 'success',
                    text: `✅ Connection successful! Library has ${data.videoCount || 0} videos.`
                });
            } else {
                const errorText = await response.text();
                setMessage({
                    type: 'error',
                    text: `❌ Invalid credentials. Status: ${response.status}. Please check your API Key and Library ID.`
                });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `❌ Connection failed: ${error.message}` });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!apiKey || !libraryId) {
            setMessage({ type: 'error', text: 'Please enter both API Key and Library ID' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/bunny-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bunny_api_key: apiKey,
                    bunny_library_id: libraryId,
                    bunny_stream_library_id: streamLibraryId || libraryId
                })
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                fetchSettings();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete your Bunny.net settings?')) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/bunny-settings', {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Settings deleted successfully' });
                setApiKey('');
                setLibraryId('');
                setStreamLibraryId('');
                setHasSettings(false);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to delete settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete settings' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Bunny.net Video Hosting Settings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Configure your Bunny.net credentials to enable video uploads and live streaming
                </p>
            </div>

            {message && (
                <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center">
                        {message.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        )}
                        <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                            {message.text}
                        </AlertDescription>
                    </div>
                </Alert>
            )}

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>API Credentials</CardTitle>
                        <CardDescription>
                            Enter your Bunny.net API credentials. You can find these in your Bunny.net dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                API Key <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Bunny.net API Key"
                                    className="pr-20"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                    {apiKey.startsWith('*') && (
                                        <button
                                            type="button"
                                            onClick={() => { setApiKey(''); setShowApiKey(false); }}
                                            className="text-gray-500 hover:text-gray-700 text-xs"
                                            title="Clear masked key"
                                        >
                                            Clear
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Found in: Bunny.net Dashboard → Account → API Keys
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Library ID (VOD) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={libraryId}
                                onChange={(e) => setLibraryId(e.target.value)}
                                placeholder="e.g., 12345"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Found in: Bunny.net Dashboard → Stream → Video Library → Library ID
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Stream Library ID (Live Streaming)
                            </label>
                            <Input
                                value={streamLibraryId}
                                onChange={(e) => setStreamLibraryId(e.target.value)}
                                placeholder="Leave empty to use same as VOD Library ID"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Optional: Use a separate library for live streaming
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleTest}
                                variant="outline"
                                disabled={testing || loading}
                            >
                                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Test Connection
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || testing}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>
                            {hasSettings && (
                                <Button
                                    onClick={handleDelete}
                                    variant="destructive"
                                    disabled={loading || testing}
                                >
                                    Delete Settings
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">1. Create a Bunny.net Account</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                If you don't have a Bunny.net account, sign up at:
                            </p>
                            <a
                                href="https://bunny.net"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center text-sm"
                            >
                                https://bunny.net <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Create a Stream Library</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Go to Stream → Create Library → Note down your Library ID
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Get Your API Key</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Go to Account → API → Create or copy your API Key
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">4. Configure Above</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Enter your credentials above and click "Test Connection" to verify
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features Enabled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                Upload videos directly from your browser
                            </li>
                            <li className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                Create live streaming sessions for classes
                            </li>
                            <li className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                Get RTMP credentials for OBS/Zoom
                            </li>
                            <li className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                Automatic video encoding and optimization
                            </li>
                            <li className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                Global CDN delivery for fast playback
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
