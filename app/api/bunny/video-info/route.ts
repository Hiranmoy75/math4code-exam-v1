import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBunnyVideoInfo } from '@/lib/bunny';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Get video information from Bunny.net
 * Used to check upload status and get video details
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
        const { videoId } = body;

        if (!videoId) {
            return NextResponse.json(
                { error: 'Video ID is required' },
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
                { error: 'Bunny.net settings not found' },
                { status: 404, headers: corsHeaders }
            );
        }

        // Fetch video info from Bunny.net
        const videoInfo = await getBunnyVideoInfo(
            settings.bunny_library_id,
            videoId,
            settings.bunny_api_key
        );

        // Map Bunny.net status to our status
        let status = 'processing';
        if (videoInfo.status === 3) status = 'ready';
        else if (videoInfo.status === 4) status = 'error';

        return NextResponse.json(
            {
                success: true,
                videoId: videoInfo.videoId,
                guid: videoInfo.guid,
                title: videoInfo.title,
                status: status,
                duration: videoInfo.duration,
                thumbnailUrl: videoInfo.thumbnailUrl,
                embedUrl: videoInfo.embedUrl
            },
            { headers: corsHeaders }
        );
    } catch (error: any) {
        console.error('Get Video Info Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch video info' },
            { status: 500, headers: corsHeaders }
        );
    }
}
