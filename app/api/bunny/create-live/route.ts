import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBunnyLiveStream } from '@/lib/bunny';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}


/**
 * Create a new live stream session in Bunny.net
 * Returns RTMP URL and Stream Key for OBS/Zoom
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: corsHeaders }
            );
        }

        // Get request body
        const body = await req.json();
        const { streamTitle, lessonId } = body;

        if (!streamTitle) {
            return NextResponse.json(
                { error: 'Stream title is required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Fetch user's Bunny.net credentials
        const { data: settings, error: settingsError } = await supabase
            .from('bunny_settings')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (settingsError || !settings) {
            return NextResponse.json(
                { error: 'Bunny.net settings not found. Please configure your Bunny.net credentials first.' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Use stream library ID if available, otherwise use regular library ID
        const libraryId = settings.bunny_stream_library_id || settings.bunny_library_id;

        // Create live stream in Bunny.net
        const liveStreamInfo = await createBunnyLiveStream(
            libraryId,
            settings.bunny_api_key,
            streamTitle
        );

        // If lessonId is provided, create a live stream session record
        if (lessonId) {
            const { error: sessionError } = await supabase
                .from('live_stream_sessions')
                .insert({
                    lesson_id: lessonId,
                    bunny_stream_id: liveStreamInfo.streamId,
                    status: 'scheduled'
                });

            if (sessionError) {
                console.error('Failed to create live stream session:', sessionError);
                // Don't fail the request, just log the error
            }
        }

        return NextResponse.json(
            {
                success: true,
                streamId: liveStreamInfo.streamId,
                streamKey: liveStreamInfo.streamKey,
                rtmpUrl: liveStreamInfo.rtmpUrl,
                playbackUrl: liveStreamInfo.playbackUrl,
                libraryId: libraryId,
                instructions: {
                    obs: {
                        server: liveStreamInfo.rtmpUrl,
                        streamKey: liveStreamInfo.streamKey
                    },
                    zoom: {
                        rtmpUrl: `${liveStreamInfo.rtmpUrl}/${liveStreamInfo.streamKey}`,
                        streamKey: liveStreamInfo.streamKey
                    }
                }
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Create Live Stream Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create live stream' },
            { status: 500, headers: corsHeaders }
        );
    }
}
